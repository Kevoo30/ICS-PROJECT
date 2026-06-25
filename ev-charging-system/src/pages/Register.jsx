import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

export default function Register() {
  const { registerUser } = useAppData();
  const navigate = useNavigate();
  const [role, setRole] = useState("driver");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "",
  });
  const [addVehicle, setAddVehicle] = useState(false);
  const [vehicle, setVehicle] = useState({ make: "", model: "", plate: "", batteryCapacity: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords do not match");
    const result = await registerUser({
      name: form.name,
      email: form.email,
      password: form.password,
      role,
      vehicle: role === "driver" && addVehicle ? vehicle : null,
    });
    if (!result.ok) return setError(result.error);
    navigate(result.user?.role === "operator" ? "/operator/dashboard" : "/dashboard");
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-box" style={{ maxWidth: 480 }}>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">
          {role === "operator"
            ? "Create an operator account"
            : "Join the EV Charging System as a driver"}
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className={`btn ${role === "driver" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1 }}
            onClick={() => setRole("driver")}
          >
            Driver Signup
          </button>
          <button
            type="button"
            className={`btn ${role === "operator" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1 }}
            onClick={() => {
              setRole("operator");
              setAddVehicle(false);
            }}
          >
            Operator Signup
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Basic info */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" required value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
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
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" required value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
          </div>

          {/* Optional vehicle */}
          {role === "driver" ? (
            <label className="checkbox-row">
              <input type="checkbox" checked={addVehicle} onChange={e => setAddVehicle(e.target.checked)} />
              Add a vehicle now (you can do this later)
            </label>
          ) : null}

          {role === "driver" && addVehicle && (
            <div style={{ background: "var(--bg-hover)", borderRadius: "var(--radius)", padding: "16px", marginBottom: "16px" }}>
              <p className="page-subheading" style={{ marginBottom: "12px" }}>Vehicle Details</p>
              <div className="form-group">
                <label className="form-label">Make</label>
                <input className="form-input" value={vehicle.make}
                  onChange={e => setVehicle(p => ({ ...p, make: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input className="form-input" value={vehicle.model}
                  onChange={e => setVehicle(p => ({ ...p, model: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Plate Number</label>
                <input className="form-input" value={vehicle.plate}
                  onChange={e => setVehicle(p => ({ ...p, plate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Battery Capacity (kWh)</label>
                <input className="form-input" type="number" value={vehicle.batteryCapacity}
                  onChange={e => setVehicle(p => ({ ...p, batteryCapacity: e.target.value }))} />
              </div>
            </div>
          )}

          <button className="btn btn-primary" style={{ width: "100%", padding: "11px" }} type="submit">
            Create Account
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: ".88rem", color: "var(--text-secondary)" }}>
          Already have an account? <Link className="auth-link" to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}