function notFound(req, res) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

function errorHandler(err, req, res, next) {
  // CORS package passes Error from origin callback
  if (err && String(err.message || "").startsWith("CORS")) {
    return res.status(403).json({
      error: {
        code: "CORS_FORBIDDEN",
        message: err.message,
      },
    });
  }
  console.error(err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "Something went wrong",
    },
  });
}

module.exports = { notFound, errorHandler };
