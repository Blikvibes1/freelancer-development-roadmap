/**
 * Seed a few example short links.
 * Run: npm run seed
 */

const { randomUUID } = require("crypto");
const { write } = require("../data/store");
const { generateCode } = require("./code");

const now = new Date().toISOString();

const links = [
  {
    id: randomUUID(),
    code: "github",
    url: "https://github.com",
    title: "GitHub",
    clicks: 0,
    createdAt: now,
    lastClickedAt: null,
  },
  {
    id: randomUUID(),
    code: generateCode(7),
    url: "https://developer.mozilla.org",
    title: "MDN Web Docs",
    clicks: 0,
    createdAt: now,
    lastClickedAt: null,
  },
  {
    id: randomUUID(),
    code: generateCode(7),
    url: "https://nodejs.org",
    title: "Node.js",
    clicks: 0,
    createdAt: now,
    lastClickedAt: null,
  },
];

write({ links });
console.log("Seeded", links.length, "short links. Try: GET /r/github");
