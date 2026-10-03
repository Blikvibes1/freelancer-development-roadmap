/**
 * Taskflow — Week 23 To-Do List API
 * Filter, sort, pagination.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const tasksRouter = require("./routes/tasks");
const { read } = require("./data/store");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50kb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Taskflow To-Do API",
    version: "1.0.0",
    phase: "Week 23 · Phase 3",
    endpoints: {
      health: "/api/health",
      tasks: "/api/tasks",
    },
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  const byStatus = { pending: 0, in_progress: 0, done: 0 };
  db.tasks.forEach((t) => {
    if (byStatus[t.status] !== undefined) byStatus[t.status] += 1;
  });
  res.json({
    status: "ok",
    uptime: process.uptime(),
    total: db.tasks.length,
    byStatus,
  });
});

app.use("/api/tasks", tasksRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Taskflow API at http://localhost:${PORT}`);
  console.log(`  GET /api/tasks?status=pending&sort=priority&order=desc&page=1&limit=5`);
});
