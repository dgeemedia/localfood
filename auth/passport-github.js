// auth/passport-github.js
// Configures Passport's GitHub strategy and serialization.
// This file must be required once in server.js

const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const db = require('../db/connect');
const { ObjectId } = require('mongodb');

// Configure GitHub strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:8083/auth/github/callback',
  scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Find existing user by githubId
    const users = db.getDb().collection('clients');
    const githubId = profile.id;

    let user = await users.findOne({ githubId });

    // If user does not exist, create a new one
    if (!user) {
      // Build a minimal user document. You can expand fields as necessary.
      const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
      const payload = {
        githubId,
        username: profile.username || null,
        displayName: profile.displayName || null,
        email,
        role: 'user',
        createdAt: new Date()
      };

      const result = await users.insertOne(payload);
      user = { _id: result.insertedId, ...payload };
    }

    // Completed — pass user object to passport
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Serialize user id into session
passport.serializeUser((user, done) => {
  // store the user's db _id in session
  done(null, user._id.toString ? user._id.toString() : user._id);
});

// Deserialize user from session (populate req.user)
passport.deserializeUser(async (id, done) => {
  try {
    if (!ObjectId.isValid(id)) return done(null, false);
    const users = db.getDb().collection('clients');
    const user = await users.findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});
