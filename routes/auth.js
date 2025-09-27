// routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * NOTE:
 * - This file expects `cookie-parser` middleware to be used in server.js
 *   (so that req.cookies.oauth_state is available).
 * - It also expects express-session + connect-mongo to be configured and working.
 */

/* Helper: sign JWTs for authenticated users */
const jwtSign = (user) => {
  if (!user) throw new Error('jwtSign requires a user object');
  const id = (user._id && typeof user._id.toString === 'function') ? user._id.toString() : (user.id || user._id || String(user));
  const payload = { sub: id, email: user.email || null, role: user.role || 'user' };
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/* Helper: compute the Swagger oauth2 redirect page URL */
const getSwaggerRedirectPage = () => {
  const local = process.env.SWAGGER_LOCAL || `http://localhost:${process.env.PORT || 8083}`;
  return `${local.replace(/\/+$/, '')}/api-docs/oauth2-redirect.html`;
};

/**
 * /start-oauth
 * Server-side start for OAuth:
 *  - generate secure random state,
 *  - store in session,
 *  - set a short-lived httpOnly cookie as a fallback,
 *  - save session to the store (ensures persistence),
 *  - then call passport.authenticate which redirects to GitHub.
 *
 * Swagger's authorizationUrl should point to this endpoint.
 */
router.get('/start-oauth', (req, res, next) => {
  try {
    const state = crypto.randomBytes(32).toString('hex'); // 64 hex chars
    req.session.oauthState = state;
    console.log('[oauth] /start-oauth generated state:', state);

    // ALSO set a short-lived httpOnly cookie as a robust fallback
    // Cookie lives 5 minutes and is httpOnly so JS can't read it.
    res.cookie('oauth_state', state, {
      maxAge: 5 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax'
    });

    // Ensure session persisted before redirecting to GitHub
    req.session.save((err) => {
      if (err) {
        console.error('[oauth] session.save failed before start-oauth:', err);
        return res.status(500).send('Error starting OAuth');
      }
      // Kick off passport's redirect to GitHub (state param included)
      passport.authenticate('github', { scope: ['user:email'], state })(req, res, next);
    });
  } catch (err) {
    console.error('Error in /start-oauth:', err);
    res.status(500).send('Error starting OAuth');
  }
});

/**
 * /github (fallback)
 * If a client calls /auth/github directly, ensure a state exists and is saved,
 * then start passport authentication.
 */
router.get('/github', (req, res, next) => {
  try {
    let state = req.session && req.session.oauthState;
    if (!state) {
      state = crypto.randomBytes(32).toString('hex');
      req.session.oauthState = state;
      res.cookie('oauth_state', state, { maxAge: 5 * 60 * 1000, httpOnly: true, sameSite: 'lax' });
      console.log('[oauth] /github generated state (fallback):', state);
      req.session.save((err) => {
        if (err) {
          console.error('[oauth] session.save failed in /github fallback:', err);
          return res.status(500).send('Error starting OAuth');
        }
        passport.authenticate('github', { scope: ['user:email'], state })(req, res, next);
      });
    } else {
      // reuse existing state (also refresh cookie)
      res.cookie('oauth_state', state, { maxAge: 5 * 60 * 1000, httpOnly: true, sameSite: 'lax' });
      passport.authenticate('github', { scope: ['user:email'], state })(req, res, next);
    }
  } catch (err) {
    next(err);
  }
});

/**
 * /github/callback
 * Passport has exchanged code -> profile. Verify state (session OR cookie),
 * issue JWT, and redirect to Swagger's oauth2-redirect.html with the token in the fragment.
 */
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth/github/failure', session: true }),
  (req, res) => {
    try {
      console.log('=== /auth/github/callback called ===');
      console.log('req.query:', req.query);
      console.log('req.headers.cookie:', req.headers.cookie || '(no cookie)');
      console.log('req.sessionID:', req.sessionID || '(no session)');

      // returned state from GitHub
      const returnedState = req.query && req.query.state;

      // stored state from session (if any)
      const storedState = req.session && req.session.oauthState;

      // fallback cookie state (if any)
      const cookieState = req.cookies && req.cookies.oauth_state;

      console.log('[oauth] returnedState=', returnedState, 'storedState=', storedState, 'cookieState=', cookieState);

      // Accept either session or cookie match.
      // If neither matches the returned state => error
      if (!returnedState || (storedState !== returnedState && cookieState !== returnedState)) {
        console.warn('[oauth] state mismatch — stored:', storedState, 'cookie:', cookieState, 'returned:', returnedState);

        // cleanup: remove saved values to prevent reuse
        if (req.session) delete req.session.oauthState;
        res.clearCookie('oauth_state');

        const swaggerOauthPage = getSwaggerRedirectPage();
        return res.redirect(`${swaggerOauthPage}#error=state_mismatch`);
      }

      // matched — remove saved values to avoid reuse
      if (req.session) delete req.session.oauthState;
      res.clearCookie('oauth_state');

      // Build JWT for the authenticated user
      const user = { ...req.user };
      delete user.passwordHash;
      const token = jwtSign(user);

      // Redirect back to swagger oauth redirect page with fragment (Swagger will read this)
      const swaggerOauthPage = getSwaggerRedirectPage();
      const fragParts = [
        `access_token=${encodeURIComponent(token)}`,
        `token_type=bearer`
      ];
      if (returnedState) fragParts.push(`state=${encodeURIComponent(returnedState)}`);
      const fragment = `#${fragParts.join('&')}`;

      console.log('[oauth] success — redirecting to Swagger redirect page with fragment');
      return res.redirect(`${swaggerOauthPage}${fragment}`);
    } catch (err) {
      console.error('Error in /auth/github/callback handler:', err);
      const swaggerOauthPage = getSwaggerRedirectPage();
      return res.redirect(`${swaggerOauthPage}#error=server_error`);
    }
  }
);

/* Failure handler (simple) */
router.get('/github/failure', (req, res) => {
  res.status(401).send('GitHub authentication failed. Try again from the Swagger UI.');
});

/* Logout: destroy session */
router.post('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);
    req.session.destroy(() => {
      res.json({ message: 'Logged out' });
    });
  });
});

module.exports = router;
