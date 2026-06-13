import React, { useState } from "react";
import { Badge, Btn } from "../../components/ui";
import { useAppData } from "../../context/AppDataContext";

export default function OpQueue() {
  const { queueDisplay, cancelBooking } = useAppData();
  const [actionError, setActionError] = useState("");

  const runAction = async (action) => {
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error.message || "Action failed.");
    }
  };

  return (
    <div className="page animate-in">
      {actionError ? (
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--red)" }}>{actionError}</div>
        </div>
      ) : null}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Live queue</div>
          <span className="text-muted">{queueDisplay.length} entries</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {["#", "Driver", "Vehicle", "Port", "Type", "Battery", "Wait", "Status", "Actions"].map(
                  (h) => (
                    <th key={h}>{h}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {queueDisplay.map((q) => (
                <tr key={q.entry_id}>
                  <td>{q.queue_position}</td>
                  <td>
                    {q.user_name}{" "}
                    {q.is_priority && <Badge status="priority" label="P" />}
                  </td>
                  <td>{q.vehicle_model}</td>
                  <td>{q.port_name}</td>
                  <td>{q.entry_type.replace("_", " ")}</td>
                  <td>{q.battery_level != null ? `${q.battery_level}%` : "-"}</td>
                  <td>{q.estimated_wait > 0 ? `~${q.estimated_wait}m` : "-"}</td>
                  <td><Badge status={q.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Btn size="sm" variant="danger" style={{ fontSize: 10 }} onClick={() => runAction(() => cancelBooking(q.entry_id))}>Remove</Btn>
                    </div>
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
