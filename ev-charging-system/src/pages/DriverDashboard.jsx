import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Battery } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const {
    currentDriver,
    myQueueEntry,
    bookingsDisplay,
    vehicles,
    driverStats,
    driverRecentSessions,
  } = useAppData();

  const nextBooking = bookingsDisplay.find((b) => b.status === "confirmed" || b.status === "pending");
  const defaultVehicle = vehicles.find((v) => v.is_default) || vehicles[0];

  return (
    <div className="page animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px", margin: 0 }}>
            Good day, {(currentDriver || "Driver").split(" ")[0]}
          </h1>
          <p className="text-muted" style={{ marginTop: 4 }}>
            {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {myQueueEntry ? (
        <div className="card" style={{ borderColor: "var(--teal)" }}>
          <div className="flex items-center gap-16">
            <div className="charge-pulse-wrap">
              <div className="charge-pulse-ring" />
              <div className="charge-pulse-icon">⚡</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>You are currently queued</div>
              <div className="text-muted">
                Position #{myQueueEntry.queue_position} at {myQueueEntry.port_name} · ~{myQueueEntry.estimated_wait} min wait
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--teal)" }}>#{myQueueEntry.queue_position}</div>
              <Badge status={myQueueEntry.status} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Queue Position</div>
          <div className="stat-value">{myQueueEntry ? `#${myQueueEntry.queue_position}` : "-"}</div>
          <div className="stat-sub">{myQueueEntry ? `~${myQueueEntry.estimated_wait} min wait` : "Not in queue"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Bookings</div>
          <div className="stat-value">{driverStats.activeBookings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed Sessions</div>
          <div className="stat-value">{driverStats.completedSessions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Saved CO2 (kg)</div>
          <div className="stat-value">{driverStats.savedCo2}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Next Booking</div>
              <div className="card-subtitle">Upcoming slot</div>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => navigate("/bookings")}>
              View all
            </button>
          </div>
          {nextBooking ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                {nextBooking.port_id} · {nextBooking.assigned_slot_start ? new Date(nextBooking.assigned_slot_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Slot TBD"}
              </div>
              <div className="text-muted" style={{ marginBottom: 8 }}>
                {nextBooking.created_at}
              </div>
              <Badge status={nextBooking.status} />
            </>
          ) : (
            <div className="text-muted" style={{ fontSize: 13 }}>
              No upcoming bookings
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Default Vehicle</div>
              <div className="card-subtitle">{defaultVehicle?.number_plate || "No vehicle"}</div>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => navigate("/vehicles")}>
              Manage
            </button>
          </div>
          {defaultVehicle ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{defaultVehicle.vehicle_model}</div>
              <div className="flex gap-8 items-center">
                <span className="badge badge-blue">{defaultVehicle.connector_type}</span>
                <span className="text-muted">{defaultVehicle.number_plate}</span>
              </div>
              {nextBooking?.battery_level != null ? (
                <div style={{ marginTop: 10 }}>
                  <Battery level={nextBooking.battery_level} />
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-muted">No vehicle added yet.</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Sessions</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Station</th>
                <th>Port</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {driverRecentSessions.length === 0 ? (
                <tr>
                  <td colSpan="5">No sessions yet.</td>
                </tr>
              ) : null}
              {driverRecentSessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.station}</td>
                  <td>{s.port}</td>
                  <td>{s.time}</td>
                  <td>
                    <Badge status={s.status.toLowerCase()} label={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
