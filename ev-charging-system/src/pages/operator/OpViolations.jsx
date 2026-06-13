import React, { useState } from "react";
import { Badge, Btn } from "../../components/ui";
import { useAppData } from "../../context/AppDataContext";

export default function OpViolations() {
  const { violations, queueDisplay, issueViolation, liftViolation } = useAppData();
  const [actionError, setActionError] = useState("");

  const runAction = async (action) => {
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error.message || "Action failed.");
    }
  };

  const handleIssueViolation = async () => {
    const defaultUser = queueDisplay[0]?.user_id || "";
    const userId = window.prompt("User ID to issue violation for:", defaultUser);
    if (!userId) return;
    const reason = window.prompt("Reason for violation:", "No-show after being called to port");
    if (!reason) return;
    await issueViolation({ userId, reason, issuedBy: "operator" });
  };

  return (
    <div className="page animate-in">
      {actionError ? (
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--red)" }}>{actionError}</div>
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn variant="primary" onClick={() => runAction(handleIssueViolation)}>+ Issue violation</Btn>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Violations</div>
          <span className="text-muted">{violations.length} records</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {["ID", "User", "Reason", "Issued by", "Date", ""].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {violations.map((v) => (
                <tr key={v.violation_id}>
                  <td className="text-muted">{v.violation_id}</td>
                  <td>{v.user_name}</td>
                  <td>{v.reason}</td>
                  <td><Badge status={v.issued_by} label={v.issued_by} /></td>
                  <td className="text-muted">{new Date(v.created_at).toLocaleString()}</td>
                  <td>
                    <Btn size="sm" variant="success" onClick={() => runAction(() => liftViolation(v.violation_id))}>Lift ban</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">About violations</div>
        </div>
        <p className="text-muted" style={{ lineHeight: 1.6 }}>
          Violations are issued when a driver misses their called slot (no-show), abuses queue
          position, or repeatedly delays. The is_deleted flag is used as a soft ban
          lift - setting it to true lifts the restriction without deleting the record.
        </p>
      </div>
    </div>
  );
}
