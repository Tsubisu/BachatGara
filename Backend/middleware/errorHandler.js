/**
 * Global async error handler middleware.
 * Catches errors thrown from controllers/services and sends structured responses.
 */
const errorHandler = (err, req, res, next) => {
  // Log unexpected errors with full stack trace
  if (!err.isOperational) {
    console.error('UNEXPECTED ERROR:', err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : 'An unexpected internal server error occurred.';

  res.status(statusCode).json({ error: message });
};

/**
 * Wraps an async controller function to catch rejections
 * and forward them to the error handler — eliminates try/catch boilerplate.
 */
const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, catchAsync };
