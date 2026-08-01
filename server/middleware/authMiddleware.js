const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Protects routes by verifying Authorization: Bearer <token> and loading the user. */
exports.requireAuth = async (req, res, next) => {
  try {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Authentication is required.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id fullName email createdAt');
    if (!user) return res.status(401).json({ message: 'This account no longer exists.' });
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return res.status(401).json({ message: 'Your session is invalid or has expired.' });
    return next(error);
  }
};
