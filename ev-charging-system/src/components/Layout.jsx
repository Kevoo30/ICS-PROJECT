import { NavLink, useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { useTheme } from "../context/ThemeContext";

export default function Layout({ children }) {
  const { currentUser, logout } = useAppData();
  const { lightMode, setLightMode } = useTheme();
  const navigate = useNavigate();

  if (!currentUser) return null;
  const isOperator = currentUser.role === "operator";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const driverLinks = [
    { to: "/dashboard", label: "🏠 Dashboard" },
    { to: "/queue", label: "⚡ Charging Queue" },
    { to: "/vehicles", label: "🚗 My Vehicles" },
    { to: "/history", label: "📋 Sessions" },
    { to: "/profile", label: "👤 Profile" },
  ];

  const operatorLinks = [
    { to: "/operator/dashboard", label: "🏠 Dashboard" },
    { to: "/operator/queue", label: "⚡ Queue Monitor" },
    { to: "/operator/stations", label: "📍 Stations" },
    { to: "/operator/violations", label: "🚨 Violations" },
    { to: "/operator/drivers", label: "👥 Sessions" },
  ];

  const links = isOperator ? operatorLinks : driverLinks;

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-brand">
          ⚡ EV Charge
          <span>{isOperator ? "Operator Portal" : "Driver Portal"}</span>
        </div>

        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " active" : "")
            }
          >
            {l.label}
          </NavLink>
        ))}

        <div className="sidebar-bottom">
          {/* Light mode toggle */}
          <div className="theme-toggle">
            <span>{lightMode ? "☀️" : "🌙"}</span>
            <div
              className={"toggle-track" + (lightMode ? " on" : "")}
              onClick={() => setLightMode((v) => !v)}
            >
              <div className="toggle-knob" />
            </div>
            <span>{lightMode ? "Light" : "Dark"}</span>
          </div>

          <div style={{ fontSize: ".82rem", color: "var(--text-secondary)" }}>
            {currentUser.name}
          </div>
          <button className="btn btn-ghost" style={{ width: "100%" }} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </nav>

      <main className="main-content">{children}</main>
    </div>
  );
}
