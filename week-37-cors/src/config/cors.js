/**
 * CORS allowlist configuration.
 *
 * ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://app.example.com
 */

function parseOrigins(envValue) {
  if (!envValue || !String(envValue).trim()) {
    return [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5500",
    ];
  }
  return String(envValue)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const allowedOrigins = parseOrigins(process.env.ALLOWED_ORIGINS);

/**
 * Dynamic origin callback for the `cors` package.
 * Reflects allowed origins; rejects others (no error throw → no ACAO header).
 */
function originCallback(origin, callback) {
  // Same-origin / non-browser tools (curl) often send no Origin
  if (!origin) {
    return callback(null, true);
  }
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  return callback(new Error(`CORS blocked for origin: ${origin}`));
}

const corsOptions = {
  origin: originCallback,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-API-Key"],
  exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "X-Request-Id"],
  credentials: true,
  maxAge: 600, // cache preflight 10 minutes
  optionsSuccessStatus: 204,
};

/** Stricter cors for an internal admin mount */
const adminCorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const adminOnly = (process.env.ADMIN_ORIGINS || "http://localhost:3000")
      .split(",")
      .map((s) => s.trim());
    if (adminOnly.includes(origin)) return callback(null, true);
    return callback(new Error(`Admin CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST"],
  credentials: true,
};

module.exports = {
  allowedOrigins,
  corsOptions,
  adminCorsOptions,
};
