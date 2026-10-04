const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const { write } = require("../data/store");

async function seed() {
  const passwordHash = await bcrypt.hash("password123", 10);
  write({
    users: [
      {
        id: randomUUID(),
        name: "Demo User",
        email: "demo@example.com",
        passwordHash,
        createdAt: new Date().toISOString(),
      },
    ],
    sessions: [],
  });
  console.log("Seeded demo@example.com / password123");
  console.log("Login twice (different User-Agent) to simulate two devices.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
