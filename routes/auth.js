// routes/auth.js
// Mount this router at /auth
// Provides GitHub OAuth entry, callback, logout, and a helper endpoint.

const express = require('express');
const passport = require('passport');
const router = express.Router();

// Start GitHub OAuth flow
// GET /auth/github
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub callback URL
// GET /auth/github/callback
router.get('/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/auth/github/failure',
    // session: true by default
  }),
  (req, res) => {
    // Successful authentication
    // You can redirect to front-end page or return JSON
    // For API: return the logged-in user info
    res.json({ message: 'Authentication successful', user: req.user });
  }
);

// Failure handler
router.get('/github/failure', (req, res) => {
  res.status(401).json({ error: 'GitHub authentication failed' });
});

// Logout endpoint - destroys session
router.post('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);
    req.session.destroy(() => {
      res.json({ message: 'Logged out' });
    });
  });
});

module.exports = router;
