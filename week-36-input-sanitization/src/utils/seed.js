const { randomUUID } = require("crypto");
const { write } = require("../data/store");

const now = new Date().toISOString();

write({
  comments: [
    {
      id: randomUUID(),
      author: "Ada",
      body: "Sanitization is defense-in-depth — always parameterize SQL too.",
      createdAt: now,
    },
    {
      id: randomUUID(),
      author: "Lin",
      body: "Escape on output for the right context (HTML vs URL vs JS).",
      createdAt: now,
    },
  ],
});

console.log("Seeded sample comments.");
