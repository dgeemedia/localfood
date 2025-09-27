// auth/passport-github.js
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
  console.error(`GitHub OAuth not configured (missing: ${missing.join(', ')}).`);
  module.exports = passport;
  return;
}

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: GITHUB_CALLBACK_URL,
  scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const database = db.getDb();
    const usersCol = database.collection('clients');

    // find by stored oauth id or by email
    let user = null;
    if (profile && profile.id) {
      user = await usersCol.findOne({ 'oauth.githubId': profile.id });
    }

    if (!user && profile.emails && profile.emails.length) {
      const primaryEmail = profile.emails.find(e => e.verified) || profile.emails[0];
      if (primaryEmail && primaryEmail.value) {
        user = await usersCol.findOne({ email: primaryEmail.value.toLowerCase() });
      }
    }

    if (!user) {
      const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || `github_${profile.id}@noemail`;
      const payload = {
        firstName: profile.displayName || profile.username || 'GitHubUser',
        lastName: '',
        email: email.toLowerCase(),
        role: 'user',
        oauth: { githubId: profile.id },
        createdAt: new Date(),
        metadata: { provider: 'github', username: profile.username }
      };
      const result = await usersCol.insertOne(payload);
      payload._id = result.insertedId;
      return done(null, payload);
    } else {
      // ensure oauth.githubId stored
      if (!user.oauth || !user.oauth.githubId) {
        await usersCol.updateOne({ _id: user._id }, { $set: { 'oauth.githubId': profile.id } });
        user.oauth = user.oauth || {};
        user.oauth.githubId = profile.id;
      }
      return done(null, user);
    }
  } catch (err) {
    console.error('Error in GitHubStrategy verify callback:', err);
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
    const user = await db.getDb().collection('clients').findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });
    done(null, user || false);
  } catch (err) {
    console.error('deserializeUser error:', err);
    done(err);
  }
});

module.exports = passport;
