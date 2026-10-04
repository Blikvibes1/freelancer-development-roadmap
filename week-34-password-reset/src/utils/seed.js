const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const { write } = require("../data/store");

async function seed() {
  const passwordHash = await bcrypt.hash("oldpassword", 10);
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
    resetTokens: [],
  });
  console.log("Seeded demo@example.com / oldpassword");
  console.log("Request reset, then set a new password and login.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
