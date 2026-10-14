
const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./db");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/task");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Test API
app.get("/", (req, res) => {
  res.send("Task Management API is running!");
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
