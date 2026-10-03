function notFound(req, res) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

function errorHandler(err, req, res, next) {
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: { code: "INVALID_TOKEN", message: "Invalid token" },
    });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: { code: "TOKEN_EXPIRED", message: "Token has expired" },
    });
  }

  console.error(err);
  res.status(err.status || 500).json({
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
