/**
 * Simulated email — writes to logs/mail.log and console.
 * Swap sendPasswordResetEmail for Nodemailer/SendGrid in production.
 */

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");
const LOG_FILE = path.join(LOG_DIR, "mail.log");

function ensureLog() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function sendPasswordResetEmail({ to, resetUrl, expiresInMinutes }) {
  ensureLog();
  const stamp = new Date().toISOString();
  const body = [
    `To: ${to}`,
    `Subject: Reset your password`,
    ``,
    `You requested a password reset.`,
    `Open this link within ${expiresInMinutes} minutes:`,
    resetUrl,
    ``,
    `If you did not request this, ignore this email.`,
    `---`,
  ].join("\n");

  fs.appendFileSync(LOG_FILE, `\n[${stamp}]\n${body}\n`);
  console.log("\n[mailer] Password reset email (simulated)");
  console.log(`  to: ${to}`);
  console.log(`  url: ${resetUrl}\n`);

  return { ok: true, simulated: true, to, resetUrl };
}

module.exports = { sendPasswordResetEmail, LOG_FILE };
