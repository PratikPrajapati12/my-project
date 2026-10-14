
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const db = require("../db");

// Check login token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please login again." });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id || decoded.userId || decoded.user?.id;

    if (!req.userId) {
      return res.status(401).json({ message: "Invalid user token." });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

// GET: Show all tasks for logged-in user
router.get("/", verifyToken, (req, res) => {
  const sql =
    "SELECT id, title, description, status, created_at FROM tasks WHERE user_id = ? ORDER BY id DESC";

  db.query(sql, [req.userId], (err, results) => {
    if (err) {
      console.error("Get tasks error:", err);
      return res.status(500).json({ message: "Could not load tasks." });
    }

    res.json(results);
  });
});

// POST: Add task
router.post("/", verifyToken, (req, res) => {
  const { title, description = "", status = "To Do" } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Task title is required." });
  }

  const allowedStatuses = ["To Do", "In Progress", "Completed"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid task status." });
  }

  const sql =
    "INSERT INTO tasks (user_id, title, description, status) VALUES (?, ?, ?, ?)";

  db.query(
    sql,
    [req.userId, title.trim(), description, status],
    (err, result) => {
      if (err) {
        console.error("Add task error:", err);
        return res.status(500).json({ message: "Could not add task." });
      }

      res.status(201).json({
        message: "Task added successfully!",
        id: result.insertId,
      });
    }
  );
});

// PUT: Update task
router.put("/:id", verifyToken, (req, res) => {
  const { title, description = "", status } = req.body;
  const taskId = Number(req.params.id);
  const allowedStatuses = ["To Do", "In Progress", "Completed"];

  if (!Number.isInteger(taskId) || taskId < 1) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  if (!title || !title.trim() || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "Enter a title and select a valid status.",
    });
  }

  const sql =
    "UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ? AND user_id = ?";

  db.query(
    sql,
    [title.trim(), description, status, taskId, req.userId],
    (err, result) => {
      if (err) {
        console.error("Update task error:", err);
        return res.status(500).json({ message: "Could not update task." });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Task not found." });
      }

      res.json({ message: "Task updated successfully!" });
    }
  );
});

// DELETE: Delete task
router.delete("/:id", verifyToken, (req, res) => {
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId) || taskId < 1) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  const sql = "DELETE FROM tasks WHERE id = ? AND user_id = ?";

  db.query(sql, [taskId, req.userId], (err, result) => {
    if (err) {
      console.error("Delete task error:", err);
      return res.status(500).json({ message: "Could not delete task." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ message: "Task deleted successfully!" });
  });
});

module.exports = router;
