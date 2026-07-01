import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

export default function Login() {
  const { login } = useAppData();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (!result.ok) return setError(result.error);
    navigate(result.user.role === "operator" ? "/operator/dashboard" : "/dashboard");
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <div style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: "12px" }}>⚡</div>
        <h1 className="auth-title" style={{ textAlign: "center" }}>EV Charge</h1>
        <p className="auth-subtitle" style={{ textAlign: "center" }}>Sign in to your account</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <button className="btn btn-primary" style={{ width: "100%", padding: "11px" }} type="submit">
            Sign In
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: ".88rem", color: "var(--text-secondary)" }}>
          No account? <Link className="auth-link" to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
