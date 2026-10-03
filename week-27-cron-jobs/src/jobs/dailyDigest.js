/**
 * Simulated daily digest: "email" summary written to logs (no real SMTP).
 */

const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");
const { logJob, appendLog } = require("../utils/logger");

function dailyDigest() {
  const db = read();
  const active = db.sessions.filter(
    (s) => new Date(s.expiresAt).getTime() > Date.now()
  );
  const expired = db.sessions.length - active.length;

  const summary = {
    activeSessions: active.length,
    expiredStillInDb: expired,
    sampleUsers: [...new Set(active.map((s) => s.userId))].slice(0, 5),
  };

  const body = [
    "Daily digest (simulated email)",
    `Active sessions: ${summary.activeSessions}`,
    `Expired rows still present: ${summary.expiredStillInDb}`,
    `Users sample: ${summary.sampleUsers.join(", ") || "(none)"}`,
  ].join(" | ");

  appendLog("digest", body);
  logJob(`dailyDigest: ${body}`);

  withDb((store) => {
    store.jobRuns.unshift({
      id: randomUUID(),
      job: "dailyDigest",
      summary,
      ranAt: new Date().toISOString(),
      status: "ok",
    });
    if (store.jobRuns.length > 100) store.jobRuns = store.jobRuns.slice(0, 100);
  });

  return summary;
}

module.exports = { dailyDigest };
