import React, { useMemo, useState } from "react";
import { Badge, Btn } from "../../components/ui";
import { useAppData } from "../../context/AppDataContext";

export default function Profile() {
  const { currentUser, violations, submitNoShowReason } = useAppData();
  const [reasons, setReasons] = useState({});
  const [actionError, setActionError] = useState("");

  const currentUid = currentUser?.uid || currentUser?.id;
  const myViolations = useMemo(
    () => (violations || []).filter((item) => item.user_id === currentUid && item.is_deleted !== true),
    [currentUid, violations],
  );

  const runAction = async (action) => {
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error.message || "Action failed.");
    }
  };

  const handleSubmitReason = async (violationId) => {
    const reason = String(reasons[violationId] || "").trim();
    if (!reason) {
      setActionError("Please add a reason before submitting.");
      return;
    }

    await submitNoShowReason(violationId, reason);
    setReasons((current) => ({ ...current, [violationId]: "" }));
  };

  return (
    <div className="page animate-in">
      <div className="card">
        <div className="card-header">
          <div className="card-title">My Profile</div>
          <span className="text-muted">{currentUser?.name || "Driver"}</span>
        </div>
        <div className="text-muted" style={{ fontSize: 13 }}>
          Email: {currentUser?.email || "-"}
        </div>
      </div>

      {actionError ? (
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--red)" }}>{actionError}</div>
        </div>
      ) : null}

      <div className="card">
        <div className="card-header">
          <div className="card-title">My Violations</div>
          <span className="text-muted">{myViolations.length} record(s)</span>
        </div>

        {myViolations.length === 0 ? (
          <div className="text-muted" style={{ fontSize: 13 }}>
            No violations found.
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 12 }}>
          {myViolations.map((violation) => {
            const isPendingWithoutReason =
              violation.status === "pending" && !violation.no_show_reason;

            return (
              <article key={violation.violation_id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <strong style={{ fontSize: 14 }}>{violation.reason || "Violation"}</strong>
                  <Badge status={violation.status || "pending"} />
                </div>
                <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>
                  Issued by: {violation.issued_by || "system"}
                </div>
                <div className="text-muted" style={{ fontSize: 12, marginBottom: 8 }}>
                  Date: {violation.created_at ? new Date(violation.created_at).toLocaleString() : "-"}
                </div>

                <div style={{ fontSize: 13, marginBottom: 8 }}>
                  <strong>My reason:</strong> {violation.no_show_reason || "Not submitted"}
                </div>

                {isPendingWithoutReason ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <textarea
                      className="form-textarea"
                      placeholder="Explain why you missed your slot"
                      value={reasons[violation.violation_id] || ""}
                      onChange={(event) =>
                        setReasons((current) => ({
                          ...current,
                          [violation.violation_id]: event.target.value,
                        }))
                      }
                    />
                    <div>
                      <Btn
                        size="sm"
                        variant="primary"
                        onClick={() => runAction(() => handleSubmitReason(violation.violation_id))}
                      >
                        Submit reason
                      </Btn>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}