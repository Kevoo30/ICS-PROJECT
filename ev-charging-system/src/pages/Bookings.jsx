import React, { useState } from "react";
import { Badge, Btn } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

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
  const [bookingForm, setBookingForm] = useState({
    vehicle_id: "",
    port_id: "",
    battery_level: "20",
    preferred_time: "",
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

    if (!bookingForm.vehicle_id) {
      throw new Error("Please select a vehicle name.");
    }

    if (!bookingForm.port_id) {
      throw new Error("Please select a port.");
    }

    if (!bookingForm.preferred_time) {
      throw new Error("Please select your preferred charging time.");
    }

    const battery = Number(bookingForm.battery_level);
    if (Number.isNaN(battery) || battery < 1 || battery > 100) {
      throw new Error("Battery level must be between 1 and 100.");
    }

    await createBooking({
      vehicle_id: bookingForm.vehicle_id,
      port_id: bookingForm.port_id,
      battery_level: battery,
      preferred_time: bookingForm.preferred_time,
    });
    setShowBookingForm(false);
    setBookingForm({ vehicle_id: "", port_id: "", battery_level: "20", preferred_time: "" });
  };

  const availablePorts = ports.filter((item) => item.status !== "offline");

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
            <div className="text-muted">Choose your vehicle name, port type, charging time and battery level</div>
          </div>
          <form onSubmit={(event) => runAction(() => handleCreateBooking(event))}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div className="text-muted" style={{ marginBottom: 4 }}>Vehicle name</div>
                <select
                  value={bookingForm.vehicle_id}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, vehicle_id: event.target.value }))
                  }
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
                      {vehicle.vehicle_model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-muted" style={{ marginBottom: 4 }}>Port type</div>
                <select
                  value={bookingForm.port_id}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, port_id: event.target.value }))
                  }
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
                  <option value="">Select port type</option>
                  {availablePorts.map((port) => (
                    <option key={port.port_id} value={port.port_id}>
                      {port.connector_type} ({port.port_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-muted" style={{ marginBottom: 4 }}>Charging time</div>
                <input
                  type="time"
                  value={bookingForm.preferred_time}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, preferred_time: event.target.value }))
                  }
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
              <Btn type="submit" variant="primary">Save booking</Btn>
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
