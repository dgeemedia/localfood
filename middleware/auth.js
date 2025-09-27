// middleware/auth.js
const jwt = require('jsonwebtoken');

const verifyJwtFromHeader = (req) => {
  const auth = req.get('Authorization') || req.get('authorization') || '';
  if (!auth) return null;
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  try {
    return jwt.verify(parts[1], process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  const payload = verifyJwtFromHeader(req);
  if (payload && payload.sub) {
    req.user = { _id: payload.sub, email: payload.email, role: payload.role };
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

module.exports = { ensureAuthenticated };
