import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import { useAppData } from "../context/AppDataContext";

function Dashboard() {
  const navigate = useNavigate();
  const {
    currentDriver,
    stations,
    createBooking,
    logoutUser,
    driverStats,
    driverRecentSessions,
    nearbyStations,
    notifications,
    dismissNotification,
  } = useAppData();

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    stationId: stations[0]?.id || "",
    port: "Port 01",
    date: "",
    timeSlot: "14:00 - 15:00",
    batteryPercentage: "20",
  });
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    if (!bookingForm.stationId && stations[0]?.id) {
      setBookingForm((current) => ({
        ...current,
        stationId: stations[0].id,
      }));
    }
  }, [bookingForm.stationId, stations]);

  const handleBookingField = (event) => {
    const { name, value } = event.target;
    setBookingForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreateBooking = async (event) => {
    event.preventDefault();
    const battery = Number(bookingForm.batteryPercentage);

    if (!bookingForm.stationId || !bookingForm.date || !bookingForm.timeSlot) {
      setBookingError("Please fill station, date, and time slot.");
      return;
    }

    if (Number.isNaN(battery) || battery < 1 || battery > 100) {
      setBookingError("Battery percentage must be between 1 and 100.");
      return;
    }

    setBookingError("");

    try {
      await createBooking({
        stationId: bookingForm.stationId,
        batteryPercentage: battery,
      });

      setShowBookingForm(false);
      setBookingForm((current) => ({
        ...current,
        date: "",
        batteryPercentage: "20",
      }));
    } catch (submitError) {
      setBookingError(submitError.message || "Unable to create booking.");
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-kicker">EV Charging System</p>
          <h1>Driver Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {currentDriver}. Monitor sessions and book your next charge.
          </p>
        </div>
        <div className="dashboard-actions">
          <button className="secondary-btn" type="button" onClick={() => setShowBookingForm(true)}>
            New Booking
          </button>
          <button className="primary-btn" type="button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </header>

      {showBookingForm ? (
        <section className="booking-panel" aria-label="New booking form">
          <div className="panel-heading">
            <h2>Create New Booking</h2>
          </div>
          <form className="booking-form" onSubmit={handleCreateBooking}>
            <label htmlFor="booking-station">Station</label>
            <select
              id="booking-station"
              name="stationId"
              value={bookingForm.stationId}
              onChange={handleBookingField}
            >
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>

            <label htmlFor="booking-port">Port</label>
            <select id="booking-port" name="port" value={bookingForm.port} onChange={handleBookingField}>
              <option value="Port 01">Port 01</option>
              <option value="Port 02">Port 02</option>
              <option value="Port 03">Port 03</option>
              <option value="Port 04">Port 04</option>
              <option value="Port 05">Port 05</option>
            </select>

            <label htmlFor="booking-date">Date</label>
            <input
              id="booking-date"
              name="date"
              type="date"
              value={bookingForm.date}
              onChange={handleBookingField}
              required
            />

            <label htmlFor="booking-time">Time Slot</label>
            <select id="booking-time" name="timeSlot" value={bookingForm.timeSlot} onChange={handleBookingField}>
              <option value="08:00 - 09:00">08:00 - 09:00</option>
              <option value="10:00 - 11:00">10:00 - 11:00</option>
              <option value="12:00 - 13:00">12:00 - 13:00</option>
              <option value="14:00 - 15:00">14:00 - 15:00</option>
              <option value="16:00 - 17:00">16:00 - 17:00</option>
              <option value="18:00 - 19:00">18:00 - 19:00</option>
            </select>

            <label htmlFor="booking-battery">Battery Percentage</label>
            <input
              id="booking-battery"
              name="batteryPercentage"
              type="number"
              min="1"
              max="100"
              value={bookingForm.batteryPercentage}
              onChange={handleBookingField}
              placeholder="20"
              required
            />

            {bookingError ? <p className="booking-error">{bookingError}</p> : null}

            <div className="booking-actions">
              <button type="submit" className="primary-btn">
                Save Booking
              </button>
              <button type="button" className="secondary-btn" onClick={() => setShowBookingForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="stats-grid" aria-label="Dashboard stats">
        <article className="stat-card">
          <p>Active Bookings</p>
          <strong>{driverStats.activeBookings}</strong>
        </article>
        <article className="stat-card">
          <p>Completed Sessions</p>
          <strong>{driverStats.completedSessions}</strong>
        </article>
        <article className="stat-card">
          <p>Energy Used (kWh)</p>
          <strong>{driverStats.energyUsed}</strong>
        </article>
        <article className="stat-card">
          <p>Saved CO2 (kg)</p>
          <strong>{driverStats.savedCo2}</strong>
        </article>
      </section>

      {notifications.length > 0 ? (
        <section className="notif-list" aria-label="Driver notifications">
          {notifications.map((notice) => (
            <article key={notice.id} className={`notif-item notif-${notice.type}`}>
              <p>{notice.message}</p>
              <button type="button" onClick={() => dismissNotification(notice.id)}>
                Dismiss
              </button>
            </article>
          ))}
        </section>
      ) : null}

      <section className="dashboard-content">
        <article className="panel">
          <div className="panel-heading">
            <h2>Recent Sessions</h2>
            <Link to="/operator">Switch to operator view</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Station</th>
                  <th>Port</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {driverRecentSessions.length === 0 ? (
                  <tr>
                    <td colSpan="5">No sessions yet. Create your first booking.</td>
                  </tr>
                ) : null}
                {driverRecentSessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.id}</td>
                    <td>{session.station}</td>
                    <td>{session.port}</td>
                    <td>{session.time}</td>
                    <td>
                      <span className={`status-pill status-${session.status.toLowerCase().replace(" ", "-")}`}>
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="panel side-panel">
          <div className="panel-heading">
            <h2>Nearby Stations</h2>
          </div>
          <ul className="station-list">
            {nearbyStations.map((station) => (
              <li key={station.name}>
                <div>
                  <p className="station-name">{station.name}</p>
                  <p className="station-distance">{station.distance}</p>
                </div>
                <span>{station.availability}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}

export default Dashboard;