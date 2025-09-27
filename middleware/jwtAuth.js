// middleware/jwtAuth.js
const jwt = require('jsonwebtoken');

const verifyJwt = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const match = auth.match(/^Bearer (.+)$/i);
  if (!match) return res.status(401).json({ error: 'Missing token' });

  const token = match[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET);
    // attach simple user claims to req for handlers
    req.jwt = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { verifyJwt };
