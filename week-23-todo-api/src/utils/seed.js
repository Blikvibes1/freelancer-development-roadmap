/**
 * Seed sample tasks for filter/sort/pagination demos.
 */

const { randomUUID } = require("crypto");
const { write } = require("../data/store");

const now = Date.now();
const iso = (offsetMs) => new Date(now + offsetMs).toISOString();

const tasks = [
  {
    id: randomUUID(),
    title: "Write API documentation",
    description: "Document all Taskflow endpoints with examples.",
    priority: "high",
    status: "in_progress",
    dueDate: iso(2 * 86400000),
    createdAt: iso(-5 * 86400000),
    updatedAt: iso(-1 * 86400000),
  },
  {
    id: randomUUID(),
    title: "Add pagination tests",
    description: "Cover page boundaries and empty results.",
    priority: "medium",
    status: "pending",
    dueDate: iso(5 * 86400000),
    createdAt: iso(-4 * 86400000),
    updatedAt: iso(-4 * 86400000),
  },
  {
    id: randomUUID(),
    title: "Refactor store layer",
    description: "Prepare for SQLite swap later.",
    priority: "low",
    status: "pending",
    dueDate: null,
    createdAt: iso(-3 * 86400000),
    updatedAt: iso(-3 * 86400000),
  },
  {
    id: randomUUID(),
    title: "Ship Week 22 shortener",
    description: "URL shortener with redirects and stats.",
    priority: "high",
    status: "done",
    dueDate: iso(-1 * 86400000),
    createdAt: iso(-10 * 86400000),
    updatedAt: iso(-2 * 86400000),
  },
  {
    id: randomUUID(),
    title: "Review filter query params",
    description: "status, priority, completed, q.",
    priority: "medium",
    status: "done",
    dueDate: iso(-2 * 86400000),
    createdAt: iso(-8 * 86400000),
    updatedAt: iso(-2 * 86400000),
  },
  {
    id: randomUUID(),
    title: "Design error envelope",
    description: "Consistent { error: { code, message } } shape.",
    priority: "high",
    status: "done",
    dueDate: null,
    createdAt: iso(-12 * 86400000),
    updatedAt: iso(-6 * 86400000),
  },
  {
    id: randomUUID(),
    title: "Plan Week 24 image upload",
    description: "Multer + local disk or Cloudinary.",
    priority: "medium",
    status: "pending",
    dueDate: iso(7 * 86400000),
    createdAt: iso(-1 * 86400000),
    updatedAt: iso(-1 * 86400000),
  },
  {
    id: randomUUID(),
    title: "Fix due date sorting",
    description: "Null due dates should sort last.",
    priority: "low",
    status: "in_progress",
    dueDate: iso(1 * 86400000),
    createdAt: iso(-2 * 86400000),
    updatedAt: iso(-0.5 * 86400000),
  },
];

write({ tasks });
console.log("Seeded", tasks.length, "tasks.");
console.log("Try: GET /api/tasks?status=pending&sort=priority&order=desc&page=1&limit=5");
