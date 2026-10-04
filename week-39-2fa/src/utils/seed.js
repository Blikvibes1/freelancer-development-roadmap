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
        totpEnabled: false,
        totpSecret: null,
        backupCodes: [],
        createdAt: new Date().toISOString(),
      },
    ],
    pending2fa: {},
  });
  console.log("Seeded demo@example.com / password123 (2FA off)");
  console.log("Login → setup 2FA → confirm with authenticator app");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
