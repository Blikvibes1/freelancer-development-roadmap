/**
 * Webhook signature helpers (GitHub + Stripe style).
 * Secrets via env; if unset, validation is skipped (demo mode).
 */

const crypto = require("crypto");

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * GitHub: X-Hub-Signature-256 = sha256=<hmac>
 */
function verifyGitHub(rawBody, signatureHeader, secret) {
  if (!secret) return { ok: true, mode: "skipped" };
  if (!signatureHeader) return { ok: false, reason: "Missing X-Hub-Signature-256" };

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  if (!timingSafeEqual(expected, signatureHeader)) {
    return { ok: false, reason: "Invalid GitHub signature" };
  }
  return { ok: true, mode: "verified" };
}

/**
 * Stripe: Stripe-Signature = t=timestamp,v1=signature
 * signed_payload = `${t}.${rawBody}`
 */
function verifyStripe(rawBody, signatureHeader, secret) {
  if (!secret) return { ok: true, mode: "skipped" };
  if (!signatureHeader) return { ok: false, reason: "Missing Stripe-Signature" };

  const parts = {};
  String(signatureHeader)
    .split(",")
    .forEach((piece) => {
      const [k, v] = piece.split("=");
      if (k && v) {
        if (!parts[k]) parts[k] = [];
        parts[k].push(v);
      }
    });

  const timestamp = parts.t && parts.t[0];
  const signatures = parts.v1 || [];
  if (!timestamp || signatures.length === 0) {
    return { ok: false, reason: "Malformed Stripe-Signature" };
  }

  // Reject if older than 5 minutes (replay protection)
  const ts = Number(timestamp);
  if (Number.isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    return { ok: false, reason: "Stripe timestamp outside tolerance" };
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const match = signatures.some((sig) => timingSafeEqual(expected, sig));
  if (!match) return { ok: false, reason: "Invalid Stripe signature" };
  return { ok: true, mode: "verified" };
}

/**
 * Generic shared-secret header: X-Webhook-Secret: <secret>
 */
function verifySharedSecret(headerValue, secret) {
  if (!secret) return { ok: true, mode: "skipped" };
  if (!headerValue) return { ok: false, reason: "Missing X-Webhook-Secret" };
  if (!timingSafeEqual(String(headerValue), secret)) {
    return { ok: false, reason: "Invalid shared secret" };
  }
  return { ok: true, mode: "verified" };
}

module.exports = {
  verifyGitHub,
  verifyStripe,
  verifySharedSecret,
};
