import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";

export default function Vehicles() {
  const { currentUser, addVehicle, removeVehicle } = useAppData();
  const [actionError, setActionError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    make: "",
    model: "",
    plate: "",
    batteryCapacity: "",
  });

  const vehicles = currentUser?.vehicles || [];

  const runAction = async (action) => {
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error.message || "Action failed.");
    }
  };

  const handleAddVehicle = async (event) => {
    event.preventDefault();

    if (!newVehicle.make.trim() || !newVehicle.model.trim() || !newVehicle.plate.trim()) {
      setActionError("Make, model and number plate are required.");
      return;
    }

    await addVehicle(currentUser.id, {
      make: newVehicle.make.trim(),
      model: newVehicle.model.trim(),
      plate: newVehicle.plate.trim().toUpperCase(),
      batteryCapacity: newVehicle.batteryCapacity ? Number(newVehicle.batteryCapacity) : null,
    });

    setNewVehicle({ make: "", model: "", plate: "", batteryCapacity: "" });
    setShowAddForm(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div className="page-heading" style={{ marginBottom: 4 }}>My Vehicles</div>
          <div style={{ color: "var(--text-secondary)", fontSize: ".9rem" }}>{vehicles.length} vehicle(s) linked</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm((current) => !current)}>
          {showAddForm ? "Close" : "+ Add vehicle"}
        </button>
      </div>

      {showAddForm ? (
        <div className="card">
          <div className="card-title">Add vehicle</div>
          <form onSubmit={(event) => runAction(() => handleAddVehicle(event))}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Make (e.g. Tesla)"
                value={newVehicle.make}
                onChange={(event) =>
                  setNewVehicle((current) => ({ ...current, make: event.target.value }))
                }
              />
              <input
                type="text"
                className="form-input"
                placeholder="Model (e.g. Model 3)"
                value={newVehicle.model}
                onChange={(event) =>
                  setNewVehicle((current) => ({ ...current, model: event.target.value }))
                }
              />
              <input
                type="text"
                className="form-input"
                placeholder="Number plate"
                value={newVehicle.plate}
                onChange={(event) =>
                  setNewVehicle((current) => ({ ...current, plate: event.target.value }))
                }
              />
              <input
                type="number"
                className="form-input"
                placeholder="Battery Capacity (kWh)"
                value={newVehicle.batteryCapacity}
                onChange={(event) =>
                  setNewVehicle((current) => ({ ...current, batteryCapacity: event.target.value }))
                }
              />
            </div>
            <div style={{ marginTop: 10 }}>
              <button type="submit" className="btn btn-primary">Save vehicle</button>
            </div>
          </form>
        </div>
      ) : null}

      {actionError ? (
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--red)" }}>{actionError}</div>
        </div>
      ) : null}

      <div>
        {vehicles.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🚗</div>
            <p>No vehicles yet.</p>
          </div>
        ) : null}
        {vehicles.map((v) => (
          <div key={v.id} className="card" style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{v.make} {v.model}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: ".85rem" }}>{v.plate}</div>
                </div>
              </div>
              <button
                  className="btn btn-danger"
                  title={vehicles.length <= 1 ? "you must have at least one car" : "Delete vehicle"}
                  style={vehicles.length <= 1 ? { opacity: 0.75, cursor: "not-allowed" } : undefined}
                  onClick={() => {
                    if (vehicles.length <= 1) {
                      setActionError("you must have at least one car");
                      return;
                    }
                    runAction(() => removeVehicle(currentUser.id, v.id));
                  }}
                >
                  Remove
              </button>
            </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              fontSize: 13,
            }}
          >
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Model: </span>
              {v.model}
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Plate: </span>
              {v.plate}
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Battery: </span>
              {v.batteryCapacity ? `${v.batteryCapacity} kWh` : "-"}
            </div>
          </div>
          </div>
        ))}
      </div>
    </div>
  );
}
