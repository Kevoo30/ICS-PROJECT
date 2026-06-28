import React, { useState } from "react";
import { Badge, Btn } from "../../components/ui";
import { useAppData } from "../../context/AppDataContext";

export default function OpViolations() {
  const {
    violations,
    pendingViolations,
    queueDisplay,
    issueViolation,
    liftViolation,
    reviewViolation,
    currentUser,
  } = useAppData();
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

  const handleReview = async (violationId, action) => {
    await reviewViolation({
      violationId,
      action,
      reviewedBy: currentUser?.uid || currentUser?.id,
    });
  };

  const visibleViolations = (violations || []).filter((item) => item.is_deleted !== true);
  const visiblePending = (pendingViolations || []).filter((item) => item.is_deleted !== true);

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
          <div className="card-title">Violations Review</div>
          <span className="text-muted">{visiblePending.length} pending</span>
        </div>

        {visiblePending.length === 0 ? (
          <div className="text-muted" style={{ fontSize: 13 }}>
            No pending violations to review.
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 10 }}>
          {visiblePending.map((v) => (
            <article key={v.violation_id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <strong style={{ fontSize: 14 }}>{v.user_name || v.user_id}</strong>
                <Badge status="pending" label="Pending" />
              </div>
              <div className="text-muted" style={{ fontSize: 12, marginBottom: 2 }}>
                Port: {v.port_name || v.port_id || "-"}
              </div>
              <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>
                No-show time: {v.no_show_at ? new Date(v.no_show_at).toLocaleString() : new Date(v.created_at).toLocaleString()}
              </div>

              <div style={{ fontSize: 13, marginBottom: 8 }}>
                <strong>Auto reason:</strong> {v.reason || "-"}
              </div>
              <div style={{ fontSize: 13, marginBottom: 10 }}>
                <strong>Driver reason:</strong> {v.no_show_reason || "awaiting reason"}
              </div>

              <div className="flex gap-8">
                <Btn size="sm" variant="danger" onClick={() => runAction(() => handleReview(v.violation_id, "keep"))}>
                  Keep Violation
                </Btn>
                <Btn size="sm" variant="success" onClick={() => runAction(() => handleReview(v.violation_id, "discard"))}>
                  Discard Violation
                </Btn>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Violations</div>
          <span className="text-muted">{visibleViolations.length} records</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {["User", "Reason", "Issued by", "Date", ""].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleViolations.map((v) => (
                <tr key={v.violation_id}>
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
