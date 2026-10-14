
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("To Do");
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (token) {
      loadTasks();
    }
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      let endpoint = isLogin ? "login" : "signup";

      const response = await fetch(
        API_URL + "/auth/" + endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(
            isLogin
              ? { email: email, password: password }
              : {
                  name: name,
                  email: email,
                  password: password
                }
          )
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong.");
        return;
      }

      if (isLogin) {
        if (!data.token) {
          setMessage("Login response did not contain a token.");
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user || {}));

        setToken(data.token);
        setUser(data.user || {});
        setMessage("Login successful!");
      } else {
        setIsLogin(true);
        setName("");
        setPassword("");
        setMessage("Account created! Please sign in.");
      }
    } catch (error) {
      setMessage("Cannot connect to the server. Check backend.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTasks() {
    try {
      const response = await fetch(API_URL + "/tasks", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not load tasks.");
        return;
      }

      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (error) {
      setMessage("Tasks API is not connected yet.");
    }
  }

  async function saveTask(e) {
    e.preventDefault();
    setMessage("");

    if (!title.trim()) {
      setMessage("Please enter a task title.");
      return;
    }

    const taskData = {
      title: title,
      description: description,
      status: status
    };

    try {
      let url = API_URL + "/tasks";
      let method = "POST";

      if (editingId !== null) {
        url = API_URL + "/tasks/" + editingId;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(taskData)
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not save task.");
        return;
      }

      setTitle("");
      setDescription("");
      setStatus("To Do");
      setEditingId(null);
      setMessage("Task saved successfully!");

      await loadTasks();
    } catch (error) {
      setMessage("Cannot connect to the tasks API.");
    }
  }

  function editTask(task) {
    setEditingId(task.id || task.task_id);
    setTitle(task.title || "");
    setDescription(task.description || "");
    setStatus(task.status || "To Do");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteTask(taskId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        API_URL + "/tasks/" + taskId,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + token
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not delete task.");
        return;
      }

      setMessage("Task deleted successfully!");
      await loadTasks();
    } catch (error) {
      setMessage("Cannot connect to the tasks API.");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);
    setTasks([]);
    setMessage("");
    setIsLogin(true);
  }

  function switchMode() {
    setIsLogin(!isLogin);
    setName("");
    setEmail("");
    setPassword("");
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setStatus("To Do");
    setMessage("");
  }

  const visibleTasks =
    filter === "All"
      ? tasks
      : tasks.filter(function (task) {
          return task.status === filter;
        });

  const todoCount = tasks.filter(function (task) {
    return task.status === "To Do";
  }).length;

  const progressCount = tasks.filter(function (task) {
    return task.status === "In Progress";
  }).length;

  const completedCount = tasks.filter(function (task) {
    return task.status === "Completed";
  }).length;

  if (token) {
    return (
      <main className="page dashboard-page">
        <header className="dashboard-header">
          <h1 className="brand-title">
            Task<span>ora</span>
          </h1>

          <div className="user-area">
            <span>
              Hi, {(user && (user.name || user.email)) || "User"}
            </span>

            <button
              className="logout-btn"
              onClick={logout}
              type="button"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="dashboard-content">
          <div className="dashboard-heading">
            <div>
              <h2>My Dashboard</h2>
              <p>Organize your work. Achieve your goals.</p>
            </div>
          </div>

          {message && (
            <p className="message" role="status">
              {message}
            </p>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <span>Total Tasks</span>
              <h3>{tasks.length}</h3>
            </div>

            <div className="stat-card">
              <span>To Do</span>
              <h3>{todoCount}</h3>
            </div>

            <div className="stat-card">
              <span>In Progress</span>
              <h3>{progressCount}</h3>
            </div>

            <div className="stat-card">
              <span>Completed</span>
              <h3>{completedCount}</h3>
            </div>
          </div>

          <section className="task-form-card add-task-section">
            <h3>
              {editingId !== null ? "Update Task" : "Add New Task"}
            </h3>

            <form onSubmit={saveTask}>
              <div className="form-group">
                <label htmlFor="task-title">Task Title</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="Enter task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-description">Description</label>
                <textarea
                  id="task-description"
                  placeholder="Enter task description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-status">Status</label>
                <select
                  id="task-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="task-actions">
                <button className="submit-btn" type="submit">
                  {editingId !== null ? "Update Task" : "Add Task"}
                </button>

                {editingId !== null && (
                  <button
                    className="logout-btn"
                    type="button"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="tasks-section">
            <div className="tasks-heading">
              <h3>My Tasks</h3>

              <button
                className="logout-btn"
                type="button"
                onClick={loadTasks}
              >
                Refresh
              </button>
            </div>

            <div className="filter-row">
              {["All", "To Do", "In Progress", "Completed"].map(
                function (item) {
                  return (
                    <button
                      key={item}
                      type="button"
                      className={
                        "filter-btn " +
                        (filter === item ? "active" : "")
                      }
                      onClick={() => setFilter(item)}
                    >
                      {item}
                    </button>
                  );
                }
              )}
            </div>

            {visibleTasks.length === 0 ? (
              <div className="empty-state">
                <h3>No tasks found</h3>
                <p>Add a task or choose another filter.</p>
              </div>
            ) : (
              <div className="tasks-grid">
                {visibleTasks.map(function (task) {
                  const taskId = task.id || task.task_id;

                  return (
                    <article className="task-card" key={taskId}>
                      <div className="task-card-top">
                        <span className="status-badge">
                          {task.status || "To Do"}
                        </span>
                      </div>

                      <h4>{task.title}</h4>

                      <p>
                        {task.description || "No description provided."}
                      </p>

                      <div className="task-card-actions">
                        <button
                          className="edit-btn"
                          type="button"
                          onClick={() => editTask(task)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          type="button"
                          onClick={() => deleteTask(taskId)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand-icon">
          <span>✓</span>
        </div>

        <h1 className="brand-title">
          Task<span>ora</span>
        </h1>

        <p className="tagline">Organize. Plan. Achieve.</p>

        <div className="welcome">
          <h2>{isLogin ? "Welcome Back!" : "Create Account"}</h2>
          <p>
            {isLogin
              ? "Sign in to continue your productivity journey."
              : "Start organizing your tasks today."}
          </p>
        </div>

        {!isLogin && (
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={6}
            required
          />
        </div>

        {isLogin && (
          <div className="form-options">
            <span className="secure-label">🔒 Secure login</span>
          </div>
        )}

        <button
          className="submit-btn"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : isLogin
              ? "Sign In →"
              : "Create Account →"}
        </button>

        {message && (
          <div className="message" role="status" aria-live="polite">
            {message}
          </div>
        )}

        <div className="switch-text">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            className="switch-btn"
            type="button"
            onClick={switchMode}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>

        <div className="card-footer">
          <span>✦</span> Small steps every day, big results.
        </div>
      </form>

      <p className="copyright">
        © 2026 Taskora. Stay focused. Keep growing.
      </p>
    </main>
  );
}

export default App;
