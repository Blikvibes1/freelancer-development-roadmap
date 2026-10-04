/**
 * Helmet configuration — defense-in-depth HTTP security headers.
 *
 * Docs: https://helmetjs.github.io/
 */

function buildHelmetOptions() {
  const isProd = process.env.NODE_ENV === "production";

  return {
    // Content-Security-Policy
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // inline for simple demo page
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"], // reinforce X-Frame-Options DENY
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },

    // Strict-Transport-Security (only meaningful over HTTPS)
    hsts: isProd
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        }
      : false, // avoid HSTS on plain http://localhost

    // X-Frame-Options: DENY (clickjacking)
    frameguard: { action: "deny" },

    // X-Content-Type-Options: nosniff
    noSniff: true,

    // Referrer-Policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },

    // X-DNS-Prefetch-Control
    dnsPrefetchControl: { allow: false },

    // X-Download-Options (IE)
    ieNoOpen: true,

    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: { permittedPolicies: "none" },

    // Cross-Origin-Opener-Policy / Resource-Policy / Embedder-Policy
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    crossOriginEmbedderPolicy: false, // can break some embeds; enable when ready

    // Remove X-Powered-By (helmet hides it by default via hidePoweredBy)
    hidePoweredBy: true,
  };
}

/** Human-readable summary for /api/security-headers */
const HEADER_GUIDE = [
  {
    header: "Content-Security-Policy",
    purpose: "Restrict where scripts, styles, images, and connections may load from (XSS mitigation).",
  },
  {
    header: "Strict-Transport-Security",
    purpose: "Force HTTPS for a period of time (production only in this project).",
  },
  {
    header: "X-Frame-Options",
    purpose: "Deny embedding in iframes (clickjacking).",
  },
  {
    header: "X-Content-Type-Options",
    purpose: "Prevent MIME sniffing.",
  },
  {
    header: "Referrer-Policy",
    purpose: "Limit referrer data sent on navigation.",
  },
  {
    header: "Cross-Origin-Opener-Policy",
    purpose: "Isolate browsing context from cross-origin popups.",
  },
  {
    header: "Cross-Origin-Resource-Policy",
    purpose: "Control which origins can load this resource.",
  },
];

module.exports = { buildHelmetOptions, HEADER_GUIDE };
