import React, { useState } from "react";
import { Badge, Btn } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

export default function Vehicles() {
  const { vehicles, addVehicle, setDefaultVehicle, deleteVehicle } = useAppData();
  const [actionError, setActionError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicleModel: "",
    numberPlate: "",
    connectorType: "Type 2",
  });

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

    if (!newVehicle.vehicleModel.trim() || !newVehicle.numberPlate.trim()) {
      setActionError("Vehicle model and number plate are required.");
      return;
    }

    await addVehicle({
      vehicleModel: newVehicle.vehicleModel.trim(),
      numberPlate: newVehicle.numberPlate.trim().toUpperCase(),
      connectorType: newVehicle.connectorType,
    });

    setNewVehicle({ vehicleModel: "", numberPlate: "", connectorType: "Type 2" });
    setShowAddForm(false);
  };

  return (
    <div className="page animate-in">
      <div className="flex justify-between items-center">
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{vehicles.length} vehicles</div>
          <div className="text-muted">Connected to your account</div>
        </div>
        <Btn variant="primary" onClick={() => setShowAddForm((current) => !current)}>
          {showAddForm ? "Close" : "+ Add vehicle"}
        </Btn>
      </div>

      {showAddForm ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Add vehicle</div>
          </div>
          <form onSubmit={(event) => runAction(() => handleAddVehicle(event))}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <input
                type="text"
                placeholder="Vehicle model"
                value={newVehicle.vehicleModel}
                onChange={(event) =>
                  setNewVehicle((current) => ({ ...current, vehicleModel: event.target.value }))
                }
                style={{ padding: "8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-base)", color: "var(--text-primary)" }}
              />
              <input
                type="text"
                placeholder="Number plate"
                value={newVehicle.numberPlate}
                onChange={(event) =>
                  setNewVehicle((current) => ({ ...current, numberPlate: event.target.value }))
                }
                style={{ padding: "8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-base)", color: "var(--text-primary)" }}
              />
              <select
                value={newVehicle.connectorType}
                onChange={(event) =>
                  setNewVehicle((current) => ({ ...current, connectorType: event.target.value }))
                }
                style={{ padding: "8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-base)", color: "var(--text-primary)" }}
              >
                <option value="Type 1">Type 1</option>
                <option value="Type 2">Type 2</option>
                <option value="CCS">CCS</option>
                <option value="CHAdeMO">CHAdeMO</option>
              </select>
            </div>
            <div style={{ marginTop: 10 }}>
              <Btn type="submit" variant="primary">Save vehicle</Btn>
            </div>
          </form>
        </div>
      ) : null}

      {actionError ? (
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--red)" }}>{actionError}</div>
        </div>
      ) : null}

      <div className="grid-2">
        {vehicles.map((v) => (
          <div key={v.vehicle_id} className="card">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: "var(--bg-elevated)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  CAR
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{v.vehicle_model}</div>
                  <div className="text-muted">{v.number_plate}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {v.is_default ? (
                  <Badge status="default" label="Default" />
                ) : (
                  <Btn size="sm" onClick={() => runAction(() => setDefaultVehicle(v.vehicle_id))}>Set default</Btn>
                )}
                <Btn size="sm" onClick={() => setActionError("Edit vehicle is not implemented yet.")}>Edit</Btn>
                <Btn
                  size="sm"
                  variant="danger"
                  title={vehicles.length <= 1 ? "you must have at least one car" : "Delete vehicle"}
                  style={vehicles.length <= 1 ? { opacity: 0.75 } : undefined}
                  onClick={() => {
                    if (vehicles.length <= 1) {
                      setActionError("you must have at least one car");
                      return;
                    }
                    runAction(() => deleteVehicle(v.vehicle_id));
                  }}
                >
                  Remove
                </Btn>
              </div>
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
              <span className="text-muted">Connector: </span>
              {v.connector_type}
            </div>
            <div>
              <span className="text-muted">Plate: </span>
              {v.number_plate}
            </div>
            <div>
              <span className="text-muted">Added: </span>
              {v.created_at}
            </div>
          </div>
          </div>
        ))}
      </div>
    </div>
  );
}
