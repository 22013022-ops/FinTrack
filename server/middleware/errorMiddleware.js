/** Centralizes unexpected error responses and avoids leaking implementation details in production. */
exports.notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

exports.errorHandler = (error, req, res, next) => {
  console.error(error);
  if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
  return res.status(error.statusCode || 500).json({ message: error.message || 'Something went wrong. Please try again.' });
};
