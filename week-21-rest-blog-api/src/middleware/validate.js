const { createError } = require("./errorHandler");

function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => {
      const val = req.body[f];
      return val === undefined || val === null || String(val).trim() === "";
    });
    if (missing.length) {
      return next(
        createError(400, "VALIDATION_ERROR", "Missing required fields", {
          missing,
        })
      );
    }
    next();
  };
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
}

module.exports = { requireFields, isEmail };
