import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/login.css";
import { useAppData } from "../context/AppDataContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAppData();
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registeredNotice = location.state?.registered
    ? "Registration successful. Please sign in to continue."
    : "";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await loginUser(email, password);
      navigate("/dashboard");
    } catch (submitError) {
      setError(submitError.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-header">
          <p className="login-kicker">EV Charging System</p>
          <h1 id="login-title">User Login</h1>
          <p className="login-subtitle">Sign in to access your charging dashboard.</p>
        </div>

        {registeredNotice ? (
          <p className="auth-notice" role="status" aria-live="polite">
            {registeredNotice}
          </p>
        ) : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="user-email">Email</label>
          <input
            id="user-email"
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="user-password">Password</label>
          <input
            id="user-password"
            type="password"
            name="password"
            placeholder="Enter password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="login-options">
            <label className="remember-me" htmlFor="remember">
              <input id="remember" type="checkbox" name="remember" />
              Remember me
            </label>
            <button type="button" className="link-button">
              Forgot password?
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="login-footer">
          New user? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;