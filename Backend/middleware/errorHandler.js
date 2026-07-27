
const errorHandler = (err, req, res, next) => {
  if (!err.isOperational) {
    console.error('UNEXPECTED ERROR:', err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : 'An unexpected internal server error occurred.';

  res.status(statusCode).json({ error: message });
};

const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, catchAsync };
