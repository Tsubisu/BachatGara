/**
 * AppError - Custom Error class for operational errors.
 * Distinguishes between expected (operational) errors vs programmer bugs.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // can be safely sent to client
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
