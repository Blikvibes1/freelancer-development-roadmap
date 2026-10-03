function notFound(req, res) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "Something went wrong",
    },
  });
}

function createError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

module.exports = { notFound, errorHandler, createError };
