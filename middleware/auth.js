// middleware/auth.js
// Simple middleware to require an authenticated user for API endpoints.

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

module.exports = { ensureAuthenticated };
