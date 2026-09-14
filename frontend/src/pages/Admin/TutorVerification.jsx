import { useState, useEffect } from "react";
import AdminLayout from "../../layout/AdminLayout";
import { usersApi } from "../../lib/api";
import "./TutorVerification.css";

function TutorVerification() {
  const [pendingTutors, setPendingTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const getDocumentIcon = (type = "") => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("image")) return "🖼️";
    if (type.includes("word") || type.includes("document")) return "📝";
    return "📎";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const refreshList = async () => {
    try {
      setLoading(true);
      const res = await usersApi.getPendingTutors();
      if (res.success && Array.isArray(res.users)) {
        setPendingTutors(res.users);
        if (selectedTutor) {
          const updated = res.users.find((t) => t.id === selectedTutor.id);
          setSelectedTutor(updated || null);
        }
      }
    } catch (err) {
      console.error("Failed to load pending tutors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshList();
  }, []);

  const handleApprove = async (tutorId) => {
    setProcessing(true);
    setActionMessage("");
    setActionError("");
    try {
      const res = await usersApi.updateStatus(tutorId, "approved");
      if (res.success) {
        setActionMessage(
          `✓ Tutor ${selectedTutor?.name || ""} approved successfully! Their profile is now verified and active.`
        );
        setSelectedTutor(null);
        await refreshList();
      } else {
        setActionError(res.message || "Failed to approve tutor.");
      }
    } catch (err) {
      setActionError(err.message || "An error occurred while approving the tutor.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (tutorId) => {
    const reason = prompt("Enter a reason for rejection (optional):", "Qualification documents need further verification");
    if (reason === null) return; // cancelled prompt

    setProcessing(true);
    setActionMessage("");
    setActionError("");
    try {
      const res = await usersApi.updateStatus(tutorId, "rejected", reason);
      if (res.success) {
        setActionMessage(`Tutor registration rejected.`);
        setSelectedTutor(null);
        await refreshList();
      } else {
        setActionError(res.message || "Failed to reject tutor.");
      }
    } catch (err) {
      setActionError(err.message || "An error occurred while rejecting the tutor.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>Tutor Verification</h1>
          <p>Review tutor applications, academic credentials, and uploaded qualification documents.</p>
        </div>
        <div className="status-badge-pending">
          <span>{pendingTutors.length}</span> Pending Applications
        </div>
      </div>

      {actionMessage && (
        <div className="auth-alert auth-alert-success" style={{ marginBottom: "1rem" }}>
          <span>✓</span>
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: "1rem" }}>
          <span>⚠️</span>
          <span>{actionError}</span>
        </div>
      )}

      <div className="verification-container">
        <div className="verification-list-col card">
          <div className="section-header border-bottom">
            <h2>Pending Applications</h2>
          </div>

          <div className="pending-list">
            {loading ? (
              <div className="empty-state">
                <p>Loading applications from database...</p>
              </div>
            ) : pendingTutors.length > 0 ? (
              pendingTutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className={`pending-card ${selectedTutor?.id === tutor.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedTutor(tutor);
                    setActionMessage("");
                    setActionError("");
                  }}
                >
                  <img
                    src={
                      tutor.avatar ||
                      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                    }
                    alt={tutor.name}
                    className="pending-avatar"
                  />
                  <div className="pending-info">
                    <h4>{tutor.name}</h4>
                    <p>{tutor.subject || "General Tutoring"}</p>
                    <span className="pending-date">
                      Applied: {tutor.joinedDate ? new Date(tutor.joinedDate).toLocaleDateString() : "Recently"}
                    </span>
                  </div>
                  <div className="pending-arrow">›</div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <span className="empty-icon">✅</span>
                <p>All caught up! No pending tutor applications.</p>
              </div>
            )}
          </div>
        </div>

        <div className="verification-detail-col card">
          {selectedTutor ? (
            <div className="tutor-detail-view">
              <div className="detail-header">
                <img
                  src={
                    selectedTutor.avatar ||
                    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                  }
                  alt={selectedTutor.name}
                  className="detail-avatar"
                />
                <div className="detail-title">
                  <h2>{selectedTutor.name}</h2>
                  <p className="detail-subtitle">{selectedTutor.subject || "General Tutoring"} Instructor</p>
                </div>
              </div>

              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-box">
                    <span className="box-label">Email</span>
                    <span className="box-value">{selectedTutor.email}</span>
                  </div>
                  <div className="detail-box">
                    <span className="box-label">Phone</span>
                    <span className="box-value">{selectedTutor.phone || "Not provided"}</span>
                  </div>
                  <div className="detail-box">
                    <span className="box-label">Qualification</span>
                    <span className="box-value">{selectedTutor.qualification || "—"}</span>
                  </div>
                  <div className="detail-box">
                    <span className="box-label">Experience</span>
                    <span className="box-value">{selectedTutor.experience || "—"}</span>
                  </div>
                  <div className="detail-box">
                    <span className="box-label">Hourly Rate</span>
                    <span className="box-value">${selectedTutor.hourlyRate || 25}/hr</span>
                  </div>
                  <div className="detail-box">
                    <span className="box-label">Applied On</span>
                    <span className="box-value">
                      {selectedTutor.joinedDate
                        ? new Date(selectedTutor.joinedDate).toLocaleDateString()
                        : "Recently"}
                    </span>
                  </div>
                </div>

                {selectedTutor.bio && (
                  <div className="detail-group" style={{ marginTop: "1rem" }}>
                    <h3>Bio / Introduction</h3>
                    <p style={{ color: "#475569", lineHeight: "1.6", fontSize: "0.95rem" }}>
                      {selectedTutor.bio}
                    </p>
                  </div>
                )}

                <div className="detail-group">
                  <h3>Uploaded Documents ({selectedTutor.documents?.length || 0})</h3>
                  {selectedTutor.documents && selectedTutor.documents.length > 0 ? (
                    <div className="document-list">
                      {selectedTutor.documents.map((doc, idx) => (
                        <div key={doc.id || idx} className="doc-item">
                          <span className="doc-icon">{getDocumentIcon(doc.type || "")}</span>
                          <div className="doc-meta">
                            <span className="doc-name">{doc.name || `Document #${idx + 1}`}</span>
                            <span className="doc-size">{doc.documentType || "Verification Proof"}</span>
                          </div>
                          <a
                            href={doc.dataUrl || doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="doc-link"
                            download={doc.name || "document"}
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No documents uploaded with this registration.</p>
                  )}
                </div>
              </div>

              <div className="detail-actions">
                <button
                  className="btn-reject"
                  onClick={() => handleReject(selectedTutor.id)}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "Reject / Not Approve"}
                </button>
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(selectedTutor.id)}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "✓ Approve & Verify Tutor"}
                </button>
              </div>
            </div>
          ) : (
            <div className="detail-empty-state">
              <div className="empty-icon-large">👆</div>
              <h3>Select an application</h3>
              <p>
                Click on a pending tutor application on the left to review their qualifications,
                teaching subject, and uploaded documents, then approve or reject their account.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default TutorVerification;
