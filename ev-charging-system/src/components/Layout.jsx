import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

const driverNav = [
  { to: "/dashboard", icon: "⚡", label: "Dashboard" },
  { to: "/queue", icon: "↕", label: "My queue" },
  { to: "/bookings", icon: "📅", label: "Bookings" },
  { to: "/vehicles", icon: "🚗", label: "My vehicles" },
];

const operatorNav = [
  { to: "/operator/overview", icon: "◈", label: "Overview" },
  { to: "/operator/ports", icon: "⬡", label: "Port management" },
  { to: "/operator/queue", icon: "≡", label: "Queue monitor" },
  { to: "/operator/violations", icon: "⚠", label: "Violations" },
];

export default function Layout({ children, currentRole, onRoleChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { appAlerts, dismissNotification, currentUser, logoutUser } = useAppData();

  const isOperator = currentRole === "operator";
  const nav = isOperator ? operatorNav : driverNav;

  const pageTitles = {
    "/dashboard": "Dashboard",
    "/queue": "My queue",
    "/bookings": "Bookings",
    "/vehicles": "My vehicles",
    "/operator/overview": "Overview",
    "/operator/ports": "Port management",
    "/operator/queue": "Queue monitor",
    "/operator/violations": "Violations",
  };

  const pageTitle = pageTitles[location.pathname] || "EV Charge";

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <div className="sidebar-logo-text">
            EV<span>Charge</span>
          </div>
        </div>

        <div className="sidebar-section-label">{isOperator ? "Operator" : "Driver"}</div>

        <nav>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-divider" />

        <div style={{ display: "flex", gap: 6, padding: "6px 12px" }}>
          {["driver", "operator"].map((r) => (
            <button
              key={r}
              type="button"
              className={`btn ${currentRole === r ? "btn-primary" : "btn-secondary"}`}
              onClick={() => {
                onRoleChange(r);
                navigate(r === "driver" ? "/dashboard" : "/operator/overview");
              }}
              style={{ flex: 1 }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="avatar">
              {(currentUser?.name || "User")
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="avatar-name">{currentUser?.name || "Driver"}</div>
              <div className="avatar-role">{isOperator ? "Operator" : "Driver"}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">{pageTitle}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="topbar-breadcrumb">
              EV Charge &rsaquo; <span>{pageTitle}</span>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        <main style={{ overflowY: "auto" }}>
          {appAlerts.length > 0 ? (
            <section className="page" style={{ paddingBottom: 0 }}>
              {appAlerts.map((notice) => (
                <article key={notice.id} className="card" style={{ padding: "8px 12px" }}>
                  <div className="flex items-center justify-between gap-12">
                    <span style={{ fontSize: 12 }}>{notice.message}</span>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => dismissNotification(notice.id)}>
                      Dismiss
                    </button>
                  </div>
                </article>
              ))}
            </section>
          ) : null}

          <div className="animate-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
