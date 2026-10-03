const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function appendLog(name, line) {
  ensureLogDir();
  const file = path.join(LOG_DIR, `${name}.log`);
  const stamp = new Date().toISOString();
  fs.appendFileSync(file, `[${stamp}] ${line}\n`);
}

function logJob(message) {
  console.log(`[job] ${message}`);
  appendLog("jobs", message);
}

module.exports = { appendLog, logJob, LOG_DIR };
