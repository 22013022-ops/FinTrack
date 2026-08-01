const jwt = require('jsonwebtoken');

/** Creates signed access tokens using environment-only configuration. */
function createToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

module.exports = createToken;
