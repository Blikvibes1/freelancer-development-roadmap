const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const { write } = require("../data/store");

async function seed() {
  const hash = await bcrypt.hash("password123", 10);
  const now = new Date().toISOString();

  const adminId = randomUUID();
  const editorId = randomUUID();
  const viewerId = randomUUID();

  const users = [
    {
      id: adminId,
      name: "Admin Ada",
      email: "admin@example.com",
      passwordHash: hash,
      role: "admin",
      createdAt: now,
    },
    {
      id: editorId,
      name: "Editor Ed",
      email: "editor@example.com",
      passwordHash: hash,
      role: "editor",
      createdAt: now,
    },
    {
      id: viewerId,
      name: "Viewer Vi",
      email: "viewer@example.com",
      passwordHash: hash,
      role: "viewer",
      createdAt: now,
    },
  ];

  const articles = [
    {
      id: randomUUID(),
      title: "Welcome to Sentinel RBAC",
      body: "Admins and editors can change this. Viewers read only.",
      authorId: adminId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      title: "Editor draft",
      body: "Owned by the editor — they can update/delete this one.",
      authorId: editorId,
      createdAt: now,
      updatedAt: now,
    },
  ];

  write({ users, articles });
  console.log("Seeded RBAC users (password: password123):");
  console.log("  admin@example.com  → admin");
  console.log("  editor@example.com → editor");
  console.log("  viewer@example.com → viewer");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
