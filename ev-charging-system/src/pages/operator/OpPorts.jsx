import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge, Btn } from "../../components/ui";
import { useAppData } from "../../context/AppDataContext";

const statusIcon = { available: "🟢", occupied: "🟠", offline: "⚫" };

export default function OpPorts() {
  const { ports, updatePortStatus } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = (searchParams.get("status") || "all").toLowerCase();
  const [statusFilter, setStatusFilter] = useState(
    ["all", "available", "occupied", "offline"].includes(urlStatus) ? urlStatus : "all",
  );
  const [selectedPortId, setSelectedPortId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const next = ["all", "available", "occupied", "offline"].includes(urlStatus) ? urlStatus : "all";
    setStatusFilter(next);
  }, [urlStatus]);

  const counts = useMemo(
    () => ({
      all: ports.length,
      available: ports.filter((port) => port.status === "available").length,
      occupied: ports.filter((port) => port.status === "occupied").length,
      offline: ports.filter((port) => port.status === "offline").length,
    }),
    [ports],
  );

  const visiblePorts = useMemo(() => {
    if (statusFilter === "all") return ports;
    return ports.filter((port) => port.status === statusFilter);
  }, [ports, statusFilter]);

  const selectedPort = useMemo(
    () => ports.find((port) => port.port_id === selectedPortId) || null,
    [ports, selectedPortId],
  );

  const applyFilter = (nextFilter) => {
    setStatusFilter(nextFilter);
    const nextParams = new URLSearchParams(searchParams);
    if (nextFilter === "all") {
      nextParams.delete("status");
      setSearchParams(nextParams);
      return;
    }

    nextParams.set("status", nextFilter);
    setSearchParams(nextParams);
  };

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

      <div className="card" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <Btn size="sm" variant={statusFilter === "all" ? "primary" : "secondary"} onClick={() => applyFilter("all")}>
          All ({counts.all})
        </Btn>
        <Btn size="sm" variant={statusFilter === "available" ? "primary" : "secondary"} onClick={() => applyFilter("available")}>
          Available ({counts.available})
        </Btn>
        <Btn size="sm" variant={statusFilter === "occupied" ? "primary" : "secondary"} onClick={() => applyFilter("occupied")}>
          Occupied ({counts.occupied})
        </Btn>
        <Btn size="sm" variant={statusFilter === "offline" ? "primary" : "secondary"} onClick={() => applyFilter("offline")}>
          Offline ({counts.offline})
        </Btn>
      </div>

      <div className="ports-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, alignItems: "stretch" }}>
        {visiblePorts.map((port) => (
          <div
            key={port.port_id}
            className="card"
            style={{ opacity: port.status === "offline" ? 0.7 : 1, display: "flex", flexDirection: "column", minHeight: 230, height: "100%" }}
          >
            <div style={{ flex: 1 }}>
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
              <div style={{ fontSize: 10, color: "#888", marginTop: 4, minHeight: 16 }}>
                {port.current_session_id || "-"}
              </div>
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 4, justifyContent: "center" }}>
              <Btn
                size="sm"
                style={{ fontSize: 10, padding: "3px 6px", visibility: port.status === "offline" ? "hidden" : "visible" }}
                disabled={port.status === "offline"}
                onClick={() => setSelectedPortId(port.port_id)}
              >
                Details
              </Btn>
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

        {visiblePorts.length === 0 ? (
          <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--text-secondary)" }}>
            No ports found for this filter.
          </div>
        ) : null}
      </div>

      {selectedPort ? (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title">Port details: {selectedPort.port_name}</div>
            <Btn size="sm" variant="secondary" onClick={() => setSelectedPortId(null)}>
              Close
            </Btn>
          </div>
          <div className="grid-2">
            <div>
              <div className="text-muted">Port ID</div>
              <div>{selectedPort.port_id}</div>
            </div>
            <div>
              <div className="text-muted">Connector</div>
              <div>{selectedPort.connector_type || "-"}</div>
            </div>
            <div>
              <div className="text-muted">Status</div>
              <Badge status={selectedPort.status} />
            </div>
            <div>
              <div className="text-muted">Current Session</div>
              <div>{selectedPort.current_session_id || "-"}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
