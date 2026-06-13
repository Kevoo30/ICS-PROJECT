import React, { useState } from "react";
import { Badge, Btn } from "../../components/ui";
import { useAppData } from "../../context/AppDataContext";

const statusIcon = { available: "🟢", occupied: "🟠", offline: "⚫" };

export default function OpPorts() {
  const { ports, updatePortStatus } = useAppData();
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
        <div className="card" style={{ marginBottom: 0, color: "var(--red)", fontSize: 12 }}>{actionError}</div>
      ) : null}

      <div className="grid-3">
        {ports.map((port) => (
          <div key={port.port_id} className="card" style={{ opacity: port.status === "offline" ? 0.7 : 1 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>
              {statusIcon[port.status] || "⚙"}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
              {port.port_name}
            </div>
            <div style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>
              {port.connector_type}
            </div>
            <Badge status={port.status} />
            {port.current_session_id && (
              <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
                {port.current_session_id}
              </div>
            )}
              <div style={{ marginTop: 8, display: "flex", gap: 4, justifyContent: "center" }}>
              {port.status !== "offline" && (
                <Btn size="sm" style={{ fontSize: 10, padding: "3px 6px" }}>
                  Details
                </Btn>
              )}
              {port.status === "offline" ? (
                <Btn
                  size="sm"
                  variant="success"
                  style={{ fontSize: 10, padding: "3px 6px" }}
                  onClick={() => runAction(() => updatePortStatus(port.port_id, "available"))}
                >
                  Bring online
                </Btn>
              ) : (
                <Btn
                  size="sm"
                  variant="danger"
                  style={{ fontSize: 10, padding: "3px 6px" }}
                  onClick={() => runAction(() => updatePortStatus(port.port_id, "offline"))}
                >
                  Set offline
                </Btn>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
