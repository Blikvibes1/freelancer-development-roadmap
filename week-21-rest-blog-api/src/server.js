/**
 * Quill — Week 21 RESTful Blog API
 * Express + JSON file store. Portfolio-quality structure.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const usersRouter = require("./routes/users");
const postsRouter = require("./routes/posts");
const commentsRouter = require("./routes/comments");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { read } = require("./data/store");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));

// Health + root
app.get("/", (req, res) => {
  res.json({
    name: "Quill REST Blog API",
    version: "1.0.0",
    phase: "Week 21 · Phase 3",
    docs: "See README.md for endpoint reference",
    health: "/api/health",
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    counts: {
      users: db.users.length,
      posts: db.posts.length,
      comments: db.comments.length,
    },
  });
});

// API routes
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api/comments", commentsRouter);

// 404 + errors
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Quill API running at http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});
