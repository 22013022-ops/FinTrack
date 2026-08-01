const createToken = require('./token');

/** Sends the consistent, non-sensitive authentication response shared by signup and login. */
function sendAuthResponse(res, statusCode, user) {
  const token = createToken(user._id.toString());
  return res.status(statusCode).json({
    token,
    user: { id: user._id, fullName: user.fullName, email: user.email, createdAt: user.createdAt },
  });
}

module.exports = sendAuthResponse;
