const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    message: 'Invalid request data',
    errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg })),
  });
};

module.exports = validateRequest;
