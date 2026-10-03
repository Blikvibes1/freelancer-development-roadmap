/**
 * Sentinel — Week 33 Role-Based Access Control
 * Roles: admin, editor, viewer — permission middleware + own-resource rules.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRouter = require("./routes/auth");
const articlesRouter = require("./routes/articles");
const adminRouter = require("./routes/admin");
const { read } = require("./data/store");
const { ROLE_PERMISSIONS } = require("./config/roles");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Sentinel RBAC API",
    version: "1.0.0",
    phase: "Week 33 · Phase 4",
    roles: ROLE_PERMISSIONS,
    endpoints: {
      login: "POST /api/auth/login",
      me: "GET /api/auth/me",
      articles: "/api/articles",
      admin: "/api/admin/dashboard",
    },
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    users: db.users.length,
    articles: db.articles.length,
  });
});

app.use("/api/auth", authRouter);
app.use("/api/articles", articlesRouter);
app.use("/api/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Sentinel RBAC at http://localhost:${PORT}`);
  console.log("  Login as admin@example.com / editor@example.com / viewer@example.com");
  console.log("  password: password123");
});
