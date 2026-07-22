const AppError = require('../utils/AppError');

/**
 * Validation middleware factory.
 * Wraps a Joi schema and validates req.body, returning 422 on failure.
 * Usage: router.post('/', validate(mySchema), controller.create)
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,    // collect ALL errors at once
    stripUnknown: true,   // silently drop extra keys
  });

  if (error) {
    const message = error.details.map(d => d.message).join('; ');
    return next(new AppError(message, 422));
  }

  // Replace req.body with the validated/sanitized value
  req.body = value;
  next();
};

module.exports = validate;
