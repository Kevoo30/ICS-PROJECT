import React, { useMemo, useState } from "react";
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
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueUserName, setIssueUserName] = useState("");
  const [issueReason, setIssueReason] = useState("No-show after being called to port");
  const [issuing, setIssuing] = useState(false);

  const userOptions = useMemo(() => {
    const map = new Map();

    (queueDisplay || []).forEach((item) => {
      const key = String(item.user_id || "").trim();
      if (!key) return;
      map.set(key, {
        userId: key,
        userName: String(item.user_name || item.user_id || "").trim(),
      });
    });

    (violations || []).forEach((item) => {
      const key = String(item.user_id || "").trim();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          userId: key,
          userName: String(item.user_name || item.user_id || "").trim(),
        });
      }
    });

    return Array.from(map.values());
  }, [queueDisplay, violations]);

  const runAction = async (action) => {
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error.message || "Action failed.");
    }
  };

  const handleIssueViolation = async () => {
    const typedName = String(issueUserName || "").trim();
    const reason = String(issueReason || "").trim();
    if (!typedName || !reason) {
      setActionError("User name and reason are required.");
      return;
    }

    const normalized = typedName.toLowerCase();
    const matched = userOptions.filter((option) => option.userName.toLowerCase() === normalized);
    if (matched.length === 0) {
      setActionError("User name not found. Use the exact user name.");
      return;
    }
    if (matched.length > 1) {
      setActionError("Multiple users have this name. Please use a more specific name.");
      return;
    }

    const userId = matched[0].userId;

    setIssuing(true);
    try {
      await issueViolation({ userId, reason, issuedBy: "operator" });
      setShowIssueForm(false);
      setIssueUserName("");
      setIssueReason("No-show after being called to port");
    } finally {
      setIssuing(false);
    }
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
        <Btn
          variant="primary"
          onClick={() => {
            if (!showIssueForm) {
              setIssueUserName(queueDisplay[0]?.user_name || "");
            }
            setShowIssueForm((current) => !current);
          }}
        >
          {showIssueForm ? "Close" : "+ Issue Violation"}
        </Btn>
      </div>

      {showIssueForm ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Issue Violation</div>
          </div>
          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">User Name</label>
              <input
                className="form-input"
                value={issueUserName}
                onChange={(event) => setIssueUserName(event.target.value)}
                placeholder="Enter exact user name"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Reason</label>
              <input
                className="form-input"
                value={issueReason}
                onChange={(event) => setIssueReason(event.target.value)}
                placeholder="Enter reason"
              />
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <Btn variant="danger" onClick={() => runAction(handleIssueViolation)} disabled={issuing}>
              {issuing ? "Issuing..." : "Issue Violation"}
            </Btn>
          </div>
        </div>
      ) : null}

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
          A violation may be issued when a driver misses a called slot (no-show),
          manipulates queue position, or repeatedly delays charging. Ban lifts are
          handled in a way that removes restrictions while keeping a record of
          what happened for future review.
        </p>
      </div>
    </div>
  );
}
