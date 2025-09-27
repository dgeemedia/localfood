// auth/passport-github.js (drop-in replacement)
// Adds robust logging and error handling for easy debugging.

const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const db = require('../db/connect');
const { ObjectId } = require('mongodb');

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;

console.log('passport-github loaded. env:', {
  GITHUB_CLIENT_ID: !!GITHUB_CLIENT_ID,
  GITHUB_CALLBACK_URL
});

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_CALLBACK_URL) {
  const missing = [];
  if (!GITHUB_CLIENT_ID) missing.push('GITHUB_CLIENT_ID');
  if (!GITHUB_CLIENT_SECRET) missing.push('GITHUB_CLIENT_SECRET');
  if (!GITHUB_CALLBACK_URL) missing.push('GITHUB_CALLBACK_URL');
  const msg = `GitHub OAuth not configured (missing: ${missing.join(', ')}).`;
  console.error(msg);
  // In production you might want to throw; for now we avoid crashing
  module.exports = passport;
  return;
}

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: GITHUB_CALLBACK_URL,
  scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
  // Very verbose logging for debugging
  console.log('GitHub verify callback triggered for profile id=', profile && profile.id);
  try {
    // Ensure DB is initialized
    let database;
    try {
      database = db.getDb();
    } catch (dbErr) {
      console.error('db.getDb() failed in verify callback:', dbErr && dbErr.message);
      return done(dbErr);
    }

    const users = database.collection('clients');

    // Log profile minimal info
    console.log('profile.username=', profile.username, 'emails=', profile.emails);

    const githubId = profile.id;
    let user;
    try {
      user = await users.findOne({ githubId });
      console.log('existing user lookup result:', !!user);
    } catch (findErr) {
      console.error('Error finding user by githubId:', findErr);
      return done(findErr);
    }

    if (!user) {
      // Create user document safely
      const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
      const payload = {
        githubId,
        username: profile.username || null,
        displayName: profile.displayName || null,
        email,
        role: 'user',
        createdAt: new Date()
      };

      try {
        const result = await users.insertOne(payload);
        user = { _id: result.insertedId, ...payload };
        console.log('Created new OAuth user with id=', result.insertedId);
      } catch (insertErr) {
        console.error('Error inserting new OAuth user:', insertErr);
        return done(insertErr);
      }
    }

    return done(null, user);
  } catch (err) {
    console.error('Unexpected error in GitHub verify callback:', err);
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  try {
    const id = user && (user._id ? user._id.toString() : user.id);
    done(null, id);
  } catch (err) {
    done(err);
  }
});

passport.deserializeUser(async (id, done) => {
  try {
    if (!ObjectId.isValid(id)) return done(null, false);
    const users = db.getDb().collection('clients');
    const user = await users.findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });
    done(null, user || false);
  } catch (err) {
    console.error('deserializeUser error:', err);
    done(err);
  }
});

module.exports = passport;
