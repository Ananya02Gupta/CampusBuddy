
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import Login from "./Login";
import {
  DashboardPage,
  AttendancePage,
  MarksPage,
} from "./StudentPages";

const suggestions = [
  { icon: "📊", title: "Check my attendance", text: "Show my attendance percentage for each subject." },
  { icon: "🎯", title: "Improve my marks", text: "Analyze my marks and suggest what I should improve." },
  { icon: "📚", title: "Make a study plan", text: "Create a simple study plan based on my academic performance." },
  { icon: "💡", title: "Explain my courses", text: "Help me understand how to prepare for my courses." },
];

function AppContent() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("campusbuddy_token");
    const savedUser = localStorage.getItem("campusbuddy_user");

    if (!token || !savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  function handleLogin(loggedInUser) {
    localStorage.setItem("campusbuddy_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    navigate("/dashboard", { replace: true });
  }

  function handleLogout() {
    localStorage.removeItem("campusbuddy_token");
    localStorage.removeItem("campusbuddy_user");
    setUser(null);
    setMessages([]);
    setMessage("");
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    if (!user && window.location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }

    if (user && window.location.pathname === "/login") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  async function sendMessage(text = message) {
    const question = text.trim();
    if (!question || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", content: question },
    ]);
    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("campusbuddy_token");

      if (!token) {
        throw new Error("Please log in again to continue.");
      }

      const response = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: question }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        throw new Error("Your session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to get an answer.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: data.answer },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: error.message || "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">C</div>
          <div>
            <h2>CampusBuddy</h2>
            <span>YOUR CAMPUS COMPANION</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="campus-navigation">
          <NavLink to="/dashboard" className="nav-item">
            <span>▦</span><span>Dashboard</span>
          </NavLink>
          <NavLink to="/attendance" className="nav-item">
            <span>◷</span><span>Attendance</span>
          </NavLink>
          <NavLink to="/marks" className="nav-item">
            <span>▤</span><span>My Marks</span>
          </NavLink>
          <NavLink to="/assistant" className="nav-item">
            <span>✦</span><span>AI Assistant</span>
          </NavLink>
        </nav>

        <div className="sidebar-note">
          <span className="note-icon">✧</span>
          <h3>Your personal campus agent</h3>
          <p>Track your academic progress and plan your next steps.</p>
        </div>

        <div className="sidebar-footer">
          <span className="online-dot" /> Signed in
          <small>{user.name || "Student"}</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace /</span>
            <strong>
              {window.location.pathname === "/attendance"
                ? " Attendance"
                : window.location.pathname === "/marks"
                ? " My Marks"
                : window.location.pathname === "/assistant"
                ? " AI Assistant"
                : " Dashboard"}
            </strong>
          </div>

          <div className="topbar-actions">
            <div className="status-pill"><span /> AI AGENT</div>
            <button className="logout-button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/marks" element={<MarksPage />} />
            <Route
              path="/assistant"
              element={
                <section className="chat-area">
                  <div className="welcome">
                    <div className="welcome-icon">✦</div>
                    <div className="eyebrow">YOUR SMART CAMPUS COMPANION</div>
                    <h1>Hey, <span>{user.name || "Student"}!</span> 👋</h1>
                    <p>Ask about your attendance, marks, or what to focus on next.</p>
                  </div>

                  {messages.length === 0 ? (
                    <div className="suggestion-grid">
                      {suggestions.map((item) => (
                        <button
                          className="suggestion-card"
                          key={item.title}
                          onClick={() => sendMessage(item.text)}
                          disabled={loading}
                        >
                          <span className="suggestion-icon">{item.icon}</span>
                          <strong>{item.title}</strong>
                          <span className="suggestion-text">{item.text}</span>
                          <span className="card-arrow">↗</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="messages">
                      {messages.map((item, index) => (
                        <div className={`message-row ${item.role}`} key={index}>
                          <div className="message-avatar">
                            {item.role === "user" ? "You" : "✦"}
                          </div>
                          <div className="message-bubble">
                            <span className="message-author">
                              {item.role === "user" ? "You" : "CampusBuddy Agent"}
                            </span>
                            <p>{item.content}</p>
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="thinking">✦ CampusBuddy is thinking...</div>
                      )}
                    </div>
                  )}

                  <form
                    className="composer"
                    onSubmit={(event) => {
                      event.preventDefault();
                      sendMessage();
                    }}
                  >
                    <span className="composer-sparkle">✧</span>
                    <input
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Ask anything about your campus life..."
                      aria-label="Your question"
                      maxLength={1000}
                    />
                    <button type="submit" disabled={!message.trim() || loading}>
                      {loading ? "..." : "Send ↗"}
                    </button>
                  </form>
                  <div className="privacy-note">
                    ✦ Answers are based on your academic records.
                  </div>
                </section>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
