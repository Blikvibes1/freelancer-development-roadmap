/**
 * Cleanup job: remove expired sessions from the store.
 */

const { randomUUID } = require("crypto");
const { withDb } = require("../data/store");
const { logJob } = require("../utils/logger");

function cleanupExpired() {
  const now = Date.now();
  let removed = 0;
  let remaining = 0;

  withDb((db) => {
    const before = db.sessions.length;
    db.sessions = db.sessions.filter((s) => {
      const exp = new Date(s.expiresAt).getTime();
      return exp > now;
    });
    removed = before - db.sessions.length;
    remaining = db.sessions.length;

    db.jobRuns.unshift({
      id: randomUUID(),
      job: "cleanupExpired",
      removed,
      remaining,
      ranAt: new Date().toISOString(),
      status: "ok",
    });
    if (db.jobRuns.length > 100) db.jobRuns = db.jobRuns.slice(0, 100);
  });

  logJob(`cleanupExpired: removed ${removed}, remaining ${remaining}`);
  return { removed, remaining };
}

module.exports = { cleanupExpired };
