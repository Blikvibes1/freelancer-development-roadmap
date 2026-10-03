const express = require("express");
const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");
const { createError } = require("../middleware/errorHandler");

const router = express.Router();

const PRIORITIES = ["low", "medium", "high"];
const STATUSES = ["pending", "in_progress", "done"];

function parseBool(val) {
  if (val === undefined || val === null || val === "") return undefined;
  if (val === true || val === "true" || val === "1") return true;
  if (val === false || val === "false" || val === "0") return false;
  return undefined;
}

/**
 * GET /api/tasks
 * Query:
 *   status=pending|in_progress|done
 *   priority=low|medium|high
 *   completed=true|false   (alias: done ↔ status=done)
 *   q=search text in title/description
 *   sort=createdAt|updatedAt|priority|title|dueDate
 *   order=asc|desc
 *   page=1
 *   limit=10
 */
router.get("/", (req, res) => {
  const db = read();
  let tasks = [...db.tasks];

  // --- Filter ---
  const { status, priority, q, completed } = req.query;

  if (status && STATUSES.includes(String(status))) {
    tasks = tasks.filter((t) => t.status === status);
  }

  if (priority && PRIORITIES.includes(String(priority))) {
    tasks = tasks.filter((t) => t.priority === priority);
  }

  const completedFlag = parseBool(completed);
  if (completedFlag === true) {
    tasks = tasks.filter((t) => t.status === "done");
  } else if (completedFlag === false) {
    tasks = tasks.filter((t) => t.status !== "done");
  }

  if (q && String(q).trim()) {
    const term = String(q).trim().toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        (t.description || "").toLowerCase().includes(term)
    );
  }

  // --- Sort ---
  const sortField = ["createdAt", "updatedAt", "priority", "title", "dueDate"].includes(
    req.query.sort
  )
    ? req.query.sort
    : "createdAt";
  const order = req.query.order === "asc" ? "asc" : "desc";

  const priorityRank = { low: 1, medium: 2, high: 3 };

  tasks.sort((a, b) => {
    let av = a[sortField];
    let bv = b[sortField];

    if (sortField === "priority") {
      av = priorityRank[a.priority] || 0;
      bv = priorityRank[b.priority] || 0;
    } else if (sortField === "dueDate") {
      av = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      bv = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
    } else if (sortField === "title") {
      av = (a.title || "").toLowerCase();
      bv = (b.title || "").toLowerCase();
    } else {
      av = new Date(av || 0).getTime();
      bv = new Date(bv || 0).getTime();
    }

    if (av < bv) return order === "asc" ? -1 : 1;
    if (av > bv) return order === "asc" ? 1 : -1;
    return 0;
  });

  // --- Pagination ---
  const total = tasks.length;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;
  const pageItems = tasks.slice(offset, offset + limit);

  res.json({
    data: pageItems,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
    filters: {
      status: status || null,
      priority: priority || null,
      completed: completedFlag ?? null,
      q: q || null,
      sort: sortField,
      order,
    },
  });
});

// GET /api/tasks/:id
router.get("/:id", (req, res, next) => {
  const db = read();
  const task = db.tasks.find((t) => t.id === req.params.id);
  if (!task) return next(createError(404, "TASK_NOT_FOUND", "Task not found"));
  res.json({ data: task });
});

// POST /api/tasks
router.post("/", (req, res, next) => {
  const { title, description, priority, status, dueDate } = req.body || {};

  if (!title || !String(title).trim()) {
    return next(
      createError(400, "VALIDATION_ERROR", "title is required", { field: "title" })
    );
  }

  const p = priority && PRIORITIES.includes(priority) ? priority : "medium";
  const s = status && STATUSES.includes(status) ? status : "pending";

  if (dueDate && Number.isNaN(Date.parse(dueDate))) {
    return next(createError(400, "VALIDATION_ERROR", "dueDate must be a valid date"));
  }

  const now = new Date().toISOString();
  const task = withDb((db) => {
    const created = {
      id: randomUUID(),
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      priority: p,
      status: s,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      createdAt: now,
      updatedAt: now,
    };
    db.tasks.push(created);
    return created;
  });

  res.status(201).json({ data: task });
});

// PUT /api/tasks/:id
router.put("/:id", (req, res, next) => {
  const { title, description, priority, status, dueDate } = req.body || {};

  try {
    const updated = withDb((db) => {
      const idx = db.tasks.findIndex((t) => t.id === req.params.id);
      if (idx === -1) throw createError(404, "TASK_NOT_FOUND", "Task not found");

      if (title !== undefined) {
        if (!String(title).trim()) {
          throw createError(400, "VALIDATION_ERROR", "title cannot be empty");
        }
        db.tasks[idx].title = String(title).trim();
      }
      if (description !== undefined) {
        db.tasks[idx].description = String(description).trim();
      }
      if (priority !== undefined) {
        if (!PRIORITIES.includes(priority)) {
          throw createError(400, "VALIDATION_ERROR", "priority must be low|medium|high");
        }
        db.tasks[idx].priority = priority;
      }
      if (status !== undefined) {
        if (!STATUSES.includes(status)) {
          throw createError(
            400,
            "VALIDATION_ERROR",
            "status must be pending|in_progress|done"
          );
        }
        db.tasks[idx].status = status;
      }
      if (dueDate !== undefined) {
        if (dueDate === null || dueDate === "") {
          db.tasks[idx].dueDate = null;
        } else if (Number.isNaN(Date.parse(dueDate))) {
          throw createError(400, "VALIDATION_ERROR", "dueDate must be a valid date");
        } else {
          db.tasks[idx].dueDate = new Date(dueDate).toISOString();
        }
      }

      db.tasks[idx].updatedAt = new Date().toISOString();
      return db.tasks[idx];
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id/complete — convenience
router.patch("/:id/complete", (req, res, next) => {
  try {
    const updated = withDb((db) => {
      const idx = db.tasks.findIndex((t) => t.id === req.params.id);
      if (idx === -1) throw createError(404, "TASK_NOT_FOUND", "Task not found");
      db.tasks[idx].status = "done";
      db.tasks[idx].updatedAt = new Date().toISOString();
      return db.tasks[idx];
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", (req, res, next) => {
  try {
    withDb((db) => {
      const idx = db.tasks.findIndex((t) => t.id === req.params.id);
      if (idx === -1) throw createError(404, "TASK_NOT_FOUND", "Task not found");
      db.tasks.splice(idx, 1);
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
