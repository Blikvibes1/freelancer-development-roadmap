/**
 * CLI: run a job once without waiting for cron.
 *   node src/jobs/runOnce.js cleanup
 *   node src/jobs/runOnce.js digest
 */

const { cleanupExpired } = require("./cleanupExpired");
const { dailyDigest } = require("./dailyDigest");

const name = process.argv[2];

if (name === "cleanup") {
  const result = cleanupExpired();
  console.log(JSON.stringify(result, null, 2));
} else if (name === "digest") {
  const result = dailyDigest();
  console.log(JSON.stringify(result, null, 2));
} else {
  console.error("Usage: node src/jobs/runOnce.js <cleanup|digest>");
  process.exit(1);
}
