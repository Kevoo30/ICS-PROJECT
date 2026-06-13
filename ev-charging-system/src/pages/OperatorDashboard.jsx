import { Link } from "react-router-dom";
import { useState } from "react";
import "../styles/operator.css";
import { useAppData } from "../context/AppDataContext";

function OperatorDashboard() {
  const [actionError, setActionError] = useState("");
  const {
    stationsWithAvailability,
    queueBookings,
    activeSessions,
    completedSessions,
    totalAvailablePorts,
    startCharging,
    completeSession,
    cancelBooking,
  } = useAppData();

  const waitingVehicles = queueBookings.length;

  const runAction = async (action) => {
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error.message || "Action failed.");
    }
  };

  return (
    <main className="operator-shell">
      <header className="operator-header">
        <div>
          <p className="operator-kicker">EV Charging System</p>
          <h1>Operator Dashboard</h1>
          <p className="operator-subtitle">Track station load, manage driver queue, and clear bottlenecks in real-time.</p>
        </div>
        <div className="operator-actions">
          <Link to="/dashboard" className="operator-link-btn">
            Driver View
          </Link>
        </div>
      </header>

      <section className="operator-metrics" aria-label="Queue metrics">
        <article className="metric-card">
          <p>Total Stations</p>
          <strong>{stationsWithAvailability.length}</strong>
        </article>
        <article className="metric-card">
          <p>Active Sessions</p>
          <strong>{activeSessions.length}</strong>
        </article>
        <article className="metric-card">
          <p>Waiting Vehicles</p>
          <strong>{waitingVehicles}</strong>
        </article>
        <article className="metric-card">
          <p>Available Ports</p>
          <strong>{totalAvailablePorts}</strong>
        </article>
      </section>

      {actionError ? (
        <section className="operator-notif-list" aria-label="Operator action errors">
          <article className="notif-item notif-warning">
            <p>{actionError}</p>
          </article>
        </section>
      ) : null}

      <section className="operator-panels">
        <article className="operator-panel">
          <div className="panel-title">
            <h2>Station Overview</h2>
          </div>
          <div className="station-grid">
            {stationsWithAvailability.map((station) => (
              <article key={station.name} className="station-card">
                <h3>{station.name}</h3>
                <p>Ports Active: {station.activePorts}/{station.totalPorts}</p>
                <p>Waiting Vehicles: {station.waitingVehicles}</p>
                <p>Available Ports: {station.availablePorts}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="operator-panel">
          <div className="panel-title">
            <h2>Current Queue (Priority by Battery %)</h2>
          </div>
          <div className="queue-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Booking ID</th>
                  <th>Driver</th>
                  <th>Battery</th>
                  <th>Station</th>
                  <th>Port</th>
                  <th>Time Slot</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {queueBookings.length === 0 ? (
                  <tr>
                    <td colSpan="9">No active queue items.</td>
                  </tr>
                ) : null}
                {queueBookings.map((item) => (
                  <tr key={item.id}>
                    <td>{item.priority}</td>
                    <td>{item.id}</td>
                    <td>{item.driverName}</td>
                    <td>{item.batteryPercentage}%</td>
                    <td>{item.stationName}</td>
                    <td>{item.port}</td>
                    <td>{item.date} | {item.timeSlot}</td>
                    <td>
                      <span className={`operator-status operator-status-${item.status.toLowerCase().replace(" ", "-")}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="queue-actions">
                        <button
                          type="button"
                          className="mini-btn mini-btn-start"
                          onClick={() => runAction(() => startCharging(item.id))}
                        >
                          Start Charging
                        </button>
                        <button
                          type="button"
                          className="mini-btn mini-btn-danger"
                          onClick={() => runAction(() => cancelBooking(item.id))}
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="operator-panel">
          <div className="panel-title">
            <h2>Current Charging Sessions</h2>
          </div>
          <div className="queue-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Driver</th>
                  <th>Station</th>
                  <th>Port</th>
                  <th>Battery</th>
                  <th>Time Slot</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.length === 0 ? (
                  <tr>
                    <td colSpan="7">No active charging sessions.</td>
                  </tr>
                ) : null}
                {activeSessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.id}</td>
                    <td>{session.driverName}</td>
                    <td>{session.stationName}</td>
                    <td>{session.port}</td>
                    <td>{session.batteryPercentage}%</td>
                    <td>{session.date} | {session.timeSlot}</td>
                    <td>
                      <button
                        type="button"
                        className="mini-btn mini-btn-success"
                        onClick={() => runAction(() => completeSession(session.id))}
                      >
                        Complete Session
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="operator-panel">
          <div className="panel-title">
            <h2>Completed Sessions</h2>
          </div>
          <div className="queue-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Driver</th>
                  <th>Station</th>
                  <th>Port</th>
                  <th>Energy Used (kWh)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {completedSessions.slice(0, 8).map((session) => (
                  <tr key={session.id}>
                    <td>{session.id}</td>
                    <td>{session.driverName}</td>
                    <td>{session.stationName}</td>
                    <td>{session.port}</td>
                    <td>{session.energyUsed || 0}</td>
                    <td>
                      <span className="operator-status operator-status-completed">Completed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}

export default OperatorDashboard;
