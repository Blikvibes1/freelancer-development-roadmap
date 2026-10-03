const { randomUUID } = require("crypto");
const { write } = require("../data/store");

const now = new Date().toISOString();

const notes = [
  {
    id: randomUUID(),
    title: "OpenAPI checklist",
    body: "Document paths, schemas, auth, and examples for every endpoint.",
    tags: ["docs", "work"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    title: "Try Swagger UI",
    body: "Open /docs and execute a request with the demo API key.",
    tags: ["docs"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    title: "Phase 3 complete",
    body: "Backend basics covered — ready for auth & security phase.",
    tags: ["milestone"],
    createdAt: now,
    updatedAt: now,
  },
];

write({ notes });
console.log("Seeded", notes.length, "notes.");
console.log("Docs: http://localhost:3000/docs");
