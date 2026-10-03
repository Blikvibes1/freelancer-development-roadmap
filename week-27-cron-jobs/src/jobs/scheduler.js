/**
 * Register cron schedules.
 * Default: cleanup every minute (demo), digest daily at 09:00.
 * Override with env CRON_CLEANUP / CRON_DIGEST.
 */

const cron = require("node-cron");
const { cleanupExpired } = require("./cleanupExpired");
const { dailyDigest } = require("./dailyDigest");
const { logJob } = require("../utils/logger");

function startScheduler() {
  // Demo-friendly: every minute. Production might use "0 3 * * *" (3 AM daily).
  const cleanupExpr = process.env.CRON_CLEANUP || "* * * * *";
  // Daily at 09:00 server time
  const digestExpr = process.env.CRON_DIGEST || "0 9 * * *";

  if (!cron.validate(cleanupExpr)) {
    throw new Error(`Invalid CRON_CLEANUP expression: ${cleanupExpr}`);
  }
  if (!cron.validate(digestExpr)) {
    throw new Error(`Invalid CRON_DIGEST expression: ${digestExpr}`);
  }

  cron.schedule(cleanupExpr, () => {
    try {
      cleanupExpired();
    } catch (err) {
      logJob(`cleanupExpired ERROR: ${err.message}`);
    }
  });

  cron.schedule(digestExpr, () => {
    try {
      dailyDigest();
    } catch (err) {
      logJob(`dailyDigest ERROR: ${err.message}`);
    }
  });

  logJob(`Scheduler started — cleanup="${cleanupExpr}", digest="${digestExpr}"`);
}

module.exports = { startScheduler };
