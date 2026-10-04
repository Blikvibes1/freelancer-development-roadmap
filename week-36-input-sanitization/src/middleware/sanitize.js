/**
 * Input sanitization & injection hardening.
 *
 * - Escape HTML entities (XSS when reflected/stored and rendered as HTML)
 * - Detect common SQL injection patterns (defense-in-depth; real fix = parameterized queries)
 * - Strip control characters / null bytes
 * - Optional strict mode: reject instead of only escaping
 */

const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
};

function escapeHtml(str) {
  return String(str).replace(/[&<>"'`/]/g, (ch) => HTML_ESCAPE_MAP[ch] || ch);
}

function stripNullBytes(str) {
  return String(str).replace(/\0/g, "");
}

function stripControlChars(str) {
  // Keep \n \r \t
  return String(str).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

/** Common SQLi patterns (not exhaustive — educational + practical filter) */
const SQLI_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i, // 'or
  /((\%27)|(\'))union/i,
  /union(\s+all)?\s+select/i,
  /select\s+.+\s+from\s+/i,
  /insert\s+into\s+/i,
  /update\s+\w+\s+set\s+/i,
  /delete\s+from\s+/i,
  /drop\s+(table|database)\s+/i,
  /;\s*(drop|delete|update|insert|select)\s+/i,
  /exec(\s|\+)+(s|x)p\w+/i,
  /sleep\s*\(\s*\d+\s*\)/i,
  /benchmark\s*\(/i,
];

function looksLikeSqli(str) {
  const s = String(str);
  return SQLI_PATTERNS.some((re) => re.test(s));
}

/** Basic XSS payload shapes beyond raw tags */
const XSS_PATTERNS = [
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /on\w+\s*=/i, // onclick=, onerror=
  /<\s*script\b/i,
  /<\s*iframe\b/i,
  /<\s*object\b/i,
  /<\s*embed\b/i,
  /<\s*svg\b[^>]*on\w+/i,
  /expression\s*\(/i,
];

function looksLikeXss(str) {
  const s = String(str);
  if (XSS_PATTERNS.some((re) => re.test(s))) return true;
  // Unescaped angle brackets often mean HTML injection attempt
  if (/<[^>]+>/.test(s)) return true;
  return false;
}

function sanitizeString(value, options) {
  let s = stripNullBytes(value);
  s = stripControlChars(s);
  if (options.maxLength && s.length > options.maxLength) {
    s = s.slice(0, options.maxLength);
  }
  if (options.escapeHtml) {
    s = escapeHtml(s);
  }
  return s;
}

function walk(value, options, path, issues) {
  if (value == null) return value;

  if (typeof value === "string") {
    if (options.blockSqli && looksLikeSqli(value)) {
      issues.push({ path, type: "sql_injection", sample: value.slice(0, 80) });
    }
    if (options.blockXss && looksLikeXss(value)) {
      issues.push({ path, type: "xss", sample: value.slice(0, 80) });
    }
    return sanitizeString(value, options);
  }

  if (Array.isArray(value)) {
    return value.map((item, i) => walk(item, options, `${path}[${i}]`, issues));
  }

  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      // Sanitize keys lightly
      const safeKey = stripNullBytes(String(k)).slice(0, 100);
      out[safeKey] = walk(v, options, path ? `${path}.${safeKey}` : safeKey, issues);
    }
    return out;
  }

  return value;
}

/**
 * Express middleware factory.
 *
 * @param {object} opts
 * @param {boolean} [opts.escapeHtml=true]
 * @param {boolean} [opts.blockSqli=true] — reject request on SQLi-like input
 * @param {boolean} [opts.blockXss=false] — if true, reject; if false, escape only
 * @param {number}  [opts.maxLength=5000]
 * @param {boolean} [opts.sanitizeQuery=true]
 * @param {boolean} [opts.sanitizeBody=true]
 * @param {boolean} [opts.sanitizeParams=true]
 */
function sanitizeInput(opts = {}) {
  const options = {
    escapeHtml: opts.escapeHtml !== false,
    blockSqli: opts.blockSqli !== false,
    blockXss: opts.blockXss === true,
    maxLength: opts.maxLength ?? 5000,
    sanitizeQuery: opts.sanitizeQuery !== false,
    sanitizeBody: opts.sanitizeBody !== false,
    sanitizeParams: opts.sanitizeParams !== false,
  };

  return function sanitizeMiddleware(req, res, next) {
    const issues = [];

    try {
      if (options.sanitizeBody && req.body && typeof req.body === "object") {
        req.body = walk(req.body, options, "body", issues);
      }
      if (options.sanitizeQuery && req.query && typeof req.query === "object") {
        req.query = walk(req.query, options, "query", issues);
      }
      if (options.sanitizeParams && req.params && typeof req.params === "object") {
        req.params = walk(req.params, options, "params", issues);
      }
    } catch (err) {
      return next(err);
    }

    const blocked = issues.filter((i) => {
      if (i.type === "sql_injection" && options.blockSqli) return true;
      if (i.type === "xss" && options.blockXss) return true;
      return false;
    });

    if (blocked.length) {
      return res.status(400).json({
        error: {
          code: "UNSAFE_INPUT",
          message: "Input rejected by sanitization policy",
          details: blocked.map((b) => ({
            path: b.path,
            type: b.type,
          })),
        },
      });
    }

    // Attach soft issues (e.g. XSS escaped but noted) for logging in demos
    req.sanitizeIssues = issues;
    next();
  };
}

module.exports = {
  sanitizeInput,
  escapeHtml,
  looksLikeSqli,
  looksLikeXss,
};
