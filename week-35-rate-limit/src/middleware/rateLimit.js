/**
 * In-memory sliding-window rate limiter (per key, usually IP).
 * Production: swap store for Redis.
 */

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 60;
  const message =
    options.message ?? "Too many requests. Please try again later.";
  const code = options.code ?? "RATE_LIMITED";
  const keyGenerator =
    options.keyGenerator ??
    ((req) => {
      const xf = req.headers["x-forwarded-for"];
      if (typeof xf === "string" && xf.length) {
        return xf.split(",")[0].trim();
      }
      return req.ip || req.socket?.remoteAddress || "unknown";
    });
  const skip = options.skip ?? (() => false);
  const standardHeaders = options.standardHeaders !== false;

  /** @type {Map<string, number[]>} */
  const hits = new Map();

  function prune(timestamps, now) {
    const cutoff = now - windowMs;
    let i = 0;
    while (i < timestamps.length && timestamps[i] <= cutoff) i += 1;
    return i > 0 ? timestamps.slice(i) : timestamps;
  }

  function middleware(req, res, next) {
    if (skip(req)) return next();

    const key = keyGenerator(req);
    const now = Date.now();
    let timestamps = hits.get(key) || [];
    timestamps = prune(timestamps, now);

    if (timestamps.length >= max) {
      const retryAfterMs = timestamps[0] + windowMs - now;
      const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));

      if (standardHeaders) {
        res.setHeader("RateLimit-Limit", String(max));
        res.setHeader("RateLimit-Remaining", "0");
        res.setHeader(
          "RateLimit-Reset",
          String(Math.ceil((timestamps[0] + windowMs) / 1000))
        );
        res.setHeader("Retry-After", String(retryAfterSec));
      }

      return res.status(429).json({
        error: {
          code,
          message,
          retryAfterSeconds: retryAfterSec,
        },
      });
    }

    timestamps.push(now);
    hits.set(key, timestamps);

    if (standardHeaders) {
      res.setHeader("RateLimit-Limit", String(max));
      res.setHeader(
        "RateLimit-Remaining",
        String(Math.max(0, max - timestamps.length))
      );
      res.setHeader(
        "RateLimit-Reset",
        String(Math.ceil((timestamps[0] + windowMs) / 1000))
      );
    }

    next();
  }

  middleware.resetKey = (key) => {
    hits.delete(key);
  };

  middleware.getStats = () => {
    const now = Date.now();
    const stats = [];
    for (const [key, timestamps] of hits.entries()) {
      const active = prune(timestamps, now);
      if (active.length === 0) {
        hits.delete(key);
        continue;
      }
      hits.set(key, active);
      stats.push({ key, count: active.length, max });
    }
    return stats.sort((a, b) => b.count - a.count);
  };

  // Periodic cleanup
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits.entries()) {
      const active = prune(timestamps, now);
      if (active.length === 0) hits.delete(key);
      else hits.set(key, active);
    }
  }, Math.min(windowMs, 60_000));
  if (timer.unref) timer.unref();

  return middleware;
}

module.exports = { createRateLimiter };
