import React from "react";

const variantMap = {
  confirmed: "badge-green",
  active: "badge-green",
  available: "badge-green",
  completed: "badge-muted",
  offline: "badge-muted",
  lifted: "badge-muted",
  pending: "badge-amber",
  delayed: "badge-amber",
  waiting: "badge-amber",
  occupied: "badge-amber",
  called: "badge-blue",
  cancelled: "badge-red",
  no_show: "badge-red",
  booking: "badge-blue",
  priority: "badge-amber",
  default: "badge-blue",
  operator: "badge-blue",
  system: "badge-muted",
};

export function Badge({ status, label, variant }) {
  const cls = variant ?? variantMap[status] ?? "badge-muted";
  return (
    <span className={`badge ${cls}`}>
      {label || status?.replace(/_/g, " ") || "-"}
    </span>
  );
}

export function StatCard({ label, value, sub, valueColor }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: valueColor || undefined }}>
        {value}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function Card({ children, style }) {
  return <div className="card" style={style}>{children}</div>;
}

export function CardHeader({ title, action }) {
  return (
    <div className="card-header">
      {typeof title === "string" ? <span className="card-title">{title}</span> : title}
      {action || null}
    </div>
  );
}

export function Btn({ children, onClick, variant = "secondary", size, style: extraStyle, type = "button", disabled }) {
  const sizeClass = size === "sm" ? " btn-sm" : size === "xs" ? " btn-xs" : "";
  const variantClass = ` btn-${variant}`;
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn${variantClass}${sizeClass}`}
      style={extraStyle}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Battery({ level = 0 }) {
  const safe = Math.max(0, Math.min(100, Number(level) || 0));
  const color = safe < 25 ? "var(--red)" : safe < 50 ? "var(--amber)" : "var(--teal)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 36, height: 16, border: `1.5px solid ${color}`, borderRadius: 3, position: "relative", padding: "2px" }}>
        <div style={{ width: `${safe}%`, height: "100%", background: color, borderRadius: 1, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>{safe}%</span>
    </div>
  );
}

export function EmptyState({ icon = "📭", message = "Nothing here yet." }) {
  return (
    <div className="empty">
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <p style={{ fontSize: 13 }}>{message}</p>
    </div>
  );
}

export function fmtTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function fmtDateTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function elapsedMins(iso) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}
