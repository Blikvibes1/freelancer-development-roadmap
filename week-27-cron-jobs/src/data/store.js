const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../data/db.json");
const defaultDb = {
  sessions: [],
  jobRuns: [],
};

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
  }
}

function read() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function write(db) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function withDb(mutator) {
  const db = read();
  const result = mutator(db);
  write(db);
  return result;
}

module.exports = { read, write, withDb, DB_PATH };
