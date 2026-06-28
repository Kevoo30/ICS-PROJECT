import React, { useRef, useState } from "react";
import { Badge, Btn } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

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

function formatSlot(start, end, preferredTime) {
  if (!start) return preferredTime || "TBD";
  const s = new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const e = new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${s} - ${e}`;
}

export default function Bookings() {
  const { bookingsDisplay, vehicles, ports, createBooking, cancelUserBooking } = useAppData();
  const [actionError, setActionError] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const bookingSubmitLockRef = useRef(false);
  const [bookingForm, setBookingForm] = useState({
    vehicle_id: "",
    booking_date: "",
    booking_time: getCurrentTimeValue(),
    battery_level: "20",
  });

  const runAction = async (action) => {
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error.message || "Action failed.");
    }
  };

  const handleCreateBooking = async (event) => {
    event.preventDefault();

    if (bookingSubmitLockRef.current) {
      return;
    }

    bookingSubmitLockRef.current = true;
    setIsSubmittingBooking(true);

    try {
      if (!bookingForm.vehicle_id) {
        throw new Error("Please select a vehicle name.");
      }

      if (!bookingForm.booking_date || !bookingForm.booking_time) {
        throw new Error("Please select your preferred charging time.");
      }

      const battery = Number(bookingForm.battery_level);
      if (Number.isNaN(battery) || battery < 1 || battery > 100) {
        throw new Error("Battery level must be between 1 and 100.");
      }

      const bookingDateTime = parseBookingDateTime(bookingForm.booking_date, bookingForm.booking_time);
      if (!bookingDateTime || Number.isNaN(bookingDateTime.getTime()) || bookingDateTime.getTime() <= Date.now()) {
        throw new Error("Pick a valid future date and time.");
      }

      await createBooking({
        vehicle_id: bookingForm.vehicle_id,
        battery_level: battery,
        preferred_time: formatDateTimeForBooking(bookingDateTime),
      });
      setShowBookingForm(false);
      setBookingForm({ vehicle_id: "", booking_date: "", booking_time: getCurrentTimeValue(), battery_level: "20" });
    } finally {
      bookingSubmitLockRef.current = false;
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="page animate-in">
      <div className="flex justify-between items-center">
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Bookings</div>
          <div className="text-muted">{bookingsDisplay.length} total</div>
        </div>
        <Btn variant="primary" onClick={() => setShowBookingForm((current) => !current)}>
          {showBookingForm ? "Close" : "+ Add booking"}
        </Btn>
      </div>

      {showBookingForm ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Create booking</div>
            <div className="text-muted">Choose your vehicle, date, time and battery level</div>
          </div>
          <form onSubmit={(event) => runAction(() => handleCreateBooking(event))}>
            {vehicles.length === 0 ? (
              <div className="text-muted" style={{ marginBottom: 8 }}>
                No vehicles found. Add one first in My Vehicles.
              </div>
            ) : null}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div className="text-muted" style={{ marginBottom: 4 }}>Vehicle name</div>
                <select
                  value={bookingForm.vehicle_id}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, vehicle_id: event.target.value }))
                  }
                  disabled={isSubmittingBooking}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--bg-base)",
                    color: "var(--text-primary)",
                  }}
                  required
                >
                  <option value="">Select vehicle name</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                      {vehicle.vehicle_model || vehicle.number_plate || vehicle.vehicle_id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-muted" style={{ marginBottom: 4 }}>Date</div>
                <input
                  type="date"
                  className="booking-picker-input"
                  value={bookingForm.booking_date}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, booking_date: event.target.value }))
                  }
                  min={new Date().toISOString().slice(0, 10)}
                  disabled={isSubmittingBooking}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--bg-base)",
                    color: "var(--text-primary)",
                  }}
                  required
                />
                <div className="text-muted" style={{ marginTop: 4 }}>Use the calendar picker</div>
              </div>

              <div>
                <div className="text-muted" style={{ marginBottom: 4 }}>Time</div>
                <input
                  type="time"
                  className="booking-picker-input"
                  value={bookingForm.booking_time}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, booking_time: event.target.value }))
                  }
                  disabled={isSubmittingBooking}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--bg-base)",
                    color: "var(--text-primary)",
                  }}
                  required
                />
              </div>

              <div>
                <div className="text-muted" style={{ marginBottom: 4 }}>Battery level (%)</div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bookingForm.battery_level}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, battery_level: event.target.value }))
                  }
                  disabled={isSubmittingBooking}
                  placeholder="battery_level"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--bg-base)",
                    color: "var(--text-primary)",
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <Btn type="submit" variant="primary" disabled={isSubmittingBooking}>
                {isSubmittingBooking ? "Saving booking..." : "Save booking"}
              </Btn>
            </div>
          </form>
        </div>
      ) : null}

      {actionError ? (
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--red)" }}>{actionError}</div>
        </div>
      ) : null}

      <div className="card">
        <div className="card-header">
          <div className="card-title">All bookings</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {["Vehicle", "Port", "Requested Time", "Slot", "Status", "Priority", "Date", ""].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookingsDisplay.map((b) => {
                const vehicle = vehicles.find((v) => v.vehicle_id === b.vehicle_id);
                const port = ports.find((p) => p.port_id === b.port_id);
                return (
                  <tr key={b.booking_id}>
                    <td>{vehicle?.vehicle_model || b.vehicle_id}</td>
                    <td>{port?.port_name || b.port_id}</td>
                    <td>{b.preferred_time || "-"}</td>
                    <td>{formatSlot(b.assigned_slot_start, b.assigned_slot_end, b.preferred_time)}</td>
                    <td><Badge status={b.status} /></td>
                    <td>
                      {b.is_priority ? (
                        <Badge status="priority" label="Yes" />
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="text-muted">{b.created_at}</td>
                    <td>
                      {(b.status === "pending" || b.status === "confirmed") && (
                        <Btn size="sm" variant="danger" onClick={() => runAction(() => cancelUserBooking(b.booking_id))}>
                          Cancel
                        </Btn>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
