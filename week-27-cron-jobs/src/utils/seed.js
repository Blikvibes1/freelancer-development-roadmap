/**
 * Seed sessions — some already expired, some still valid.
 */

const { randomUUID } = require("crypto");
const { write } = require("../data/store");

const now = Date.now();
const sessions = [];

for (let i = 0; i < 12; i++) {
  // Half expired (negative offset), half future
  const hoursOffset = i < 6 ? -(i + 1) : i;
  sessions.push({
    id: randomUUID(),
    userId: `user_${(i % 4) + 1}`,
    token: randomUUID().replace(/-/g, "").slice(0, 24),
    createdAt: new Date(now - 48 * 3600000).toISOString(),
    expiresAt: new Date(now + hoursOffset * 3600000).toISOString(),
  });
}

write({ sessions, jobRuns: [] });
console.log("Seeded", sessions.length, "sessions (mix of expired + active).");
console.log("Run: npm run job:cleanup");
