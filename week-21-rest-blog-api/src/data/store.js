/**
 * Simple JSON file store — no external DB required.
 * Data lives in /data/db.json relative to project root.
 */

const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../data/db.json");

const defaultDb = {
  users: [],
  posts: [],
  comments: [],
};

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
  }
}

function read() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf8");
  return JSON.parse(raw);
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
