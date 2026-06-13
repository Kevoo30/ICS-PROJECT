import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge, StatCard, Btn } from "../../components/ui";
import { useAppData } from "../../context/AppDataContext";

export default function OpOverview() {
  const navigate = useNavigate();
  const { ports, sessionsDisplay, queueDisplay, violations } = useAppData();

  const occupied = ports.filter((p) => p.status === "occupied").length;
  const available = ports.filter((p) => p.status === "available").length;
  const offline = ports.filter((p) => p.status === "offline").length;

  return (
    <div className="page animate-in">
      <div className="stat-grid">
        <StatCard label="Total ports" value={ports.length} />
        <StatCard label="Occupied" value={occupied} valueColor="#854F0B" />
        <StatCard label="Available" value={available} valueColor="#3B6D11" />
        <StatCard label="Offline" value={offline} valueColor="#A32D2D" />
        <StatCard label="Queue length" value={queueDisplay.length} />
        <StatCard label="Active sessions" value={sessionsDisplay.length} />
        <StatCard label="Today's sessions" value={sessionsDisplay.length} />
        <StatCard label="Violations" value={violations.length} valueColor="#A32D2D" />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Active sessions</div>
          <Btn size="sm" onClick={() => navigate("/operator/ports")}>View ports</Btn>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {["Session ID", "User", "Vehicle", "Port", "Started", "Duration", "Status"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessionsDisplay.map((s) => (
                <tr key={s.session_id}>
                  <td className="text-muted">{s.session_id}</td>
                  <td>{s.user_name}</td>
                  <td>{s.vehicle_model}</td>
                  <td>{s.port_name}</td>
                  <td>{s.start_time}</td>
                  <td>{s.duration_minutes}m</td>
                  <td><Badge status="active" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
