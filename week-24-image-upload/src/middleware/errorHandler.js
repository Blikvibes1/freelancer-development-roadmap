function notFound(req, res) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

function errorHandler(err, req, res, next) {
  // Multer errors
  if (err && err.name === "MulterError") {
    const map = {
      LIMIT_FILE_SIZE: "File too large (max 5MB)",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field",
      LIMIT_FILE_COUNT: "Too many files",
    };
    return res.status(400).json({
      error: {
        code: err.code || "UPLOAD_ERROR",
        message: map[err.code] || err.message,
      },
    });
  }

  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "Something went wrong",
      details: err.details || undefined,
    },
  });
}

function createError(status, code, message, details) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.details = details;
  return err;
}

module.exports = { notFound, errorHandler, createError };
