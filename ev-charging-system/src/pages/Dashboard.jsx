import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import { useAppData } from "../context/AppDataContext";
import { Btn } from "../components/ui";

function getCurrentTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function parseBookingDateTime(dateText, timeText) {
  const rawDate = String(dateText || "").trim();
  const rawTime = String(timeText || "").trim().toLowerCase();

  const dmyDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(rawDate);
  const ymdDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawDate);
  const hhmm24 = /^([01]?\d|2[0-3])(?::([0-5]\d))?$/.exec(rawTime);
  const hhmm12 = /^(\d{1,2})(?::([0-5]\d))?\s*(am|pm)$/.exec(rawTime);

  if ((!dmyDate && !ymdDate) || (!hhmm24 && !hhmm12)) {
    return null;
  }

  const day = Number(dmyDate ? dmyDate[1] : ymdDate[3]);
  const month = Number(dmyDate ? dmyDate[2] : ymdDate[2]);
  const year = Number(dmyDate ? dmyDate[3] : ymdDate[1]);
  let hours = 0;
  let minutes = 0;

  if (hhmm12) {
    let parsedHour = Number(hhmm12[1]);
    if (parsedHour < 1 || parsedHour > 12) {
      return null;
    }
    minutes = Number(hhmm12[2] || "0");
    if (hhmm12[3] === "am") {
      hours = parsedHour === 12 ? 0 : parsedHour;
    } else {
      hours = parsedHour === 12 ? 12 : parsedHour + 12;
    }
  } else if (hhmm24) {
    hours = Number(hhmm24[1]);
    minutes = Number(hhmm24[2] || "0");
  }

  const composed = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (
    composed.getFullYear() !== year ||
    composed.getMonth() !== month - 1 ||
    composed.getDate() !== day
  ) {
    return null;
  }

  return composed;
}

function formatDateTimeForBooking(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function Dashboard() {
  const {
    currentDriver,
    vehicles,
    createBooking,
    driverStats,
    driverRecentSessions,
    nearbyStations,
  } = useAppData();

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    vehicleId: "",
    bookingDate: "",
    bookingTime: getCurrentTimeValue(),
    batteryPercentage: "20",
  });
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    if (!bookingForm.vehicleId && vehicles[0]?.vehicle_id) {
      setBookingForm((current) => ({
        ...current,
        vehicleId: vehicles[0].vehicle_id,
      }));
    }
  }, [bookingForm.vehicleId, vehicles]);

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

    if (!bookingForm.vehicleId || !bookingForm.bookingDate || !bookingForm.bookingTime) {
      setBookingError("Please choose vehicle, date, and time.");
      return;
    }

    if (Number.isNaN(battery) || battery < 1 || battery > 100) {
      setBookingError("Battery percentage must be between 1 and 100.");
      return;
    }

    const bookingDateTime = parseBookingDateTime(bookingForm.bookingDate, bookingForm.bookingTime);
    if (!bookingDateTime || Number.isNaN(bookingDateTime.getTime()) || bookingDateTime.getTime() <= Date.now()) {
      setBookingError("Pick a valid future date and time.");
      return;
    }

    setBookingError("");

    try {
      await createBooking({
        vehicleId: bookingForm.vehicleId,
        preferredTime: formatDateTimeForBooking(bookingDateTime),
        batteryPercentage: battery,
      });

      setShowBookingForm(false);
      setBookingForm((current) => ({
        ...current,
        bookingDate: "",
        bookingTime: getCurrentTimeValue(),
        batteryPercentage: "20",
      }));
    } catch (submitError) {
      setBookingError(submitError.message || "Unable to create booking.");
    }
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
          <Btn variant="primary" type="button" onClick={() => setShowBookingForm((current) => !current)}>
            {showBookingForm ? "Close" : "+ Add booking"}
          </Btn>
        </div>
      </header>

      {showBookingForm ? (
        <section className="booking-panel" aria-label="New booking form">
          <div className="panel-heading">
            <h2>Create New Booking</h2>
          </div>
          <form className="booking-form" onSubmit={handleCreateBooking}>
            {vehicles.length === 0 ? (
              <p className="booking-error">No vehicle found. Add a vehicle first in My Vehicles.</p>
            ) : null}

            <label htmlFor="booking-vehicle">Vehicle</label>
            <select
              id="booking-vehicle"
              name="vehicleId"
              value={bookingForm.vehicleId}
              onChange={handleBookingField}
              disabled={vehicles.length === 0}
              required
            >
              <option value="">Select vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                  {vehicle.vehicle_model || vehicle.number_plate || vehicle.vehicle_id}
                </option>
              ))}
            </select>

            <label htmlFor="booking-date">Date</label>
            <input
              id="booking-date"
              name="bookingDate"
              className="booking-picker-input"
              type="date"
              value={bookingForm.bookingDate}
              onChange={handleBookingField}
              min={new Date().toISOString().slice(0, 10)}
              required
            />
            <div className="text-muted" style={{ marginTop: -6, marginBottom: 4 }}>Use the calendar picker</div>

            <label htmlFor="booking-time">Time</label>
            <input
              id="booking-time"
              name="bookingTime"
              className="booking-picker-input"
              type="time"
              value={bookingForm.bookingTime}
              onChange={handleBookingField}
              required
            />

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
              <button type="submit" className="primary-btn" disabled={vehicles.length === 0}>
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

      <section className="dashboard-content">
        <article className="panel">
          <div className="panel-heading">
            <h2>Recent Sessions</h2>
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
