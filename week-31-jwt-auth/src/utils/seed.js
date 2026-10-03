const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const { write } = require("../data/store");

async function seed() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const now = new Date().toISOString();

  const users = [
    {
      id: randomUUID(),
      name: "Demo User",
      email: "demo@example.com",
      passwordHash,
      role: "user",
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: "Admin User",
      email: "admin@example.com",
      passwordHash,
      role: "admin",
      createdAt: now,
    },
  ];

  write({ users, refreshTokens: [] });
  console.log("Seeded users:");
  console.log("  demo@example.com / password123 (role: user)");
  console.log("  admin@example.com / password123 (role: admin)");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
