import React, { useState } from "react";
import { Badge, Btn, Battery } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

export default function Queue() {
  const { myQueueEntry, queueDisplay, currentUser, delayQueueEntry, markQueueNoShow } = useAppData();
  const myEntry = myQueueEntry;
  const myQueueEntries = queueDisplay.filter((entry) => entry.user_id === currentUser?.uid);
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

      {myEntry && (
        <div className="card" style={{ borderColor: "var(--teal)" }}>
          <div className="flex items-center gap-20">
            <div className="queue-position">
              <div className="queue-position-num">{myEntry.queue_position}</div>
              <div className="queue-position-label">position</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-8" style={{ marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>You are in the queue</span>
                <Badge status={myEntry.status} />
              </div>
              <div className="text-muted" style={{ marginBottom: 8 }}>
                {myEntry.vehicle_model} · {myEntry.port_name} · Est. wait {myEntry.estimated_wait} min
              </div>
              {myEntry.battery_level != null ? <Battery level={myEntry.battery_level} /> : null}
            </div>
            <div className="flex gap-8">
              {myEntry.status === "waiting" ? (
                <Btn variant="secondary" size="sm" onClick={() => runAction(() => delayQueueEntry(myEntry.entry_id))}>
                  Delay
                </Btn>
              ) : null}
              <Btn variant="danger" size="sm" onClick={() => runAction(() => markQueueNoShow(myEntry.entry_id))}>
                Leave
              </Btn>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">My Queue Entries</div>
          <span className="text-muted">{myQueueEntries.length} item(s)</span>
        </div>
        {myQueueEntries.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 24 }}>↕</div>
            <div style={{ fontSize: 13 }}>You do not have any queue entries yet.</div>
          </div>
        ) : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Vehicle</th>
                <th>Port</th>
                <th>Battery</th>
                <th>Type</th>
                <th>Wait</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myQueueEntries.map((entry) => (
                <tr key={entry.entry_id}>
                  <td>{entry.queue_position}</td>
                  <td>{entry.vehicle_model}</td>
                  <td>{entry.port_name}</td>
                  <td>{entry.battery_level != null ? `${entry.battery_level}%` : "-"}</td>
                  <td>{entry.entry_type.replace("_", " ")}</td>
                  <td>{entry.estimated_wait > 0 ? `~${entry.estimated_wait}m` : "-"}</td>
                  <td>
                    <Badge status={entry.status} />
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
