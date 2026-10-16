
import { useState } from "react";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed. Please try again.");
      }

      if (data.user?.role !== "student") {
        throw new Error("Please log in with a student account.");
      }

      localStorage.setItem("campusbuddy_token", data.token);
      onLogin(data.user);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Please check that the backend is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">C</div>
        <div className="login-eyebrow">YOUR SMART CAMPUS COMPANION</div>
        <h1>Welcome back!</h1>
        <p className="login-description">
          Sign in to access your personal CampusBuddy AI Agent.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email">Student email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="you@college.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <div className="login-error" role="alert">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in to CampusBuddy ↗"}
          </button>
        </form>

        <div className="login-security">
          🔒 Your academic information is accessed through your secure login.
        </div>
      </section>
    </main>
  );
}

export default Login;
