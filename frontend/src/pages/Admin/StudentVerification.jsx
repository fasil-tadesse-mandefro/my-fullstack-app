import { useState, useEffect } from "react";
import AdminLayout from "../../layout/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import "./TutorVerification.css";

function StudentVerification() {
  const { user, getPendingStudents, updateStudentStatus } = useAuth();
  const [pendingStudents, setPendingStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  const refreshList = () => {
    const pending = getPendingStudents();
    setPendingStudents(pending);
    if (selectedStudent && !pending.some((s) => s.id === selectedStudent.id)) {
      setSelectedStudent(null);
    }
  };

  useEffect(() => {
    refreshList();
  }, []);

  const handleApprove = (studentId) => {
    const result = updateStudentStatus(studentId, "approved", user?.email);
    if (result.success) {
      setActionMessage("Student approved successfully. They can now sign in.");
      refreshList();
    }
  };

  const handleReject = (studentId) => {
    const result = updateStudentStatus(studentId, "rejected", user?.email);
    if (result.success) {
      setActionMessage("Student registration was not approved.");
      refreshList();
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>Student Registration Approval</h1>
          <p>Review and approve new student registration requests.</p>
        </div>
        <div className="status-badge-pending">
          <span>{pendingStudents.length}</span> Pending Registrations
        </div>
      </div>

      {actionMessage && (
        <div className="auth-alert auth-alert-success" style={{ marginBottom: "1rem" }}>
          <span>✓</span>
          <span>{actionMessage}</span>
        </div>
      )}

      <div className="verification-container">
        <div className="verification-list-col card">
          <div className="section-header border-bottom">
            <h2>Pending Registrations</h2>
          </div>

          <div className="pending-list">
            {pendingStudents.length > 0 ? (
              pendingStudents.map((student) => (
                <div
                  key={student.id}
                  className={`pending-card ${selectedStudent?.id === student.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedStudent(student);
                    setActionMessage("");
                  }}
                >
                  <img src={student.avatar} alt={student.name} className="pending-avatar" />
                  <div className="pending-info">
                    <h4>{student.name}</h4>
                    <p>{student.gradeLevel || "Student"}</p>
                    <span className="pending-date">
                      Applied: {new Date(student.joinedDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="pending-arrow">›</div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <span className="empty-icon">✅</span>
                <p>All caught up! No pending student registrations.</p>
              </div>
            )}
          </div>
        </div>

        <div className="verification-detail-col card">
          {selectedStudent ? (
            <div className="tutor-detail-view">
              <div className="detail-header">
                <img
                  src={selectedStudent.avatar}
                  alt={selectedStudent.name}
                  className="detail-avatar"
                />
                <div className="detail-title">
                  <h2>{selectedStudent.name}</h2>
                  <p className="detail-subtitle">Student Registration Request</p>
                </div>
              </div>

              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-box">
                    <span className="box-label">Email</span>
                    <span className="box-value">{selectedStudent.email}</span>
                  </div>
                  <div className="detail-box">
                    <span className="box-label">Phone</span>
                    <span className="box-value">{selectedStudent.phone || "Not provided"}</span>
                  </div>
                  <div className="detail-box">
                    <span className="box-label">Grade / Level</span>
                    <span className="box-value">{selectedStudent.gradeLevel || "—"}</span>
                  </div>
                  <div className="detail-box">
                    <span className="box-label">Applied On</span>
                    <span className="box-value">
                      {new Date(selectedStudent.joinedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="detail-group">
                  <h3>Learning Focus</h3>
                  <p>{selectedStudent.learningFocus || "Not specified"}</p>
                </div>
              </div>

              <div className="detail-actions">
                <button
                  className="btn-reject"
                  onClick={() => handleReject(selectedStudent.id)}
                >
                  Not Approve
                </button>
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(selectedStudent.id)}
                >
                  Approve
                </button>
              </div>
            </div>
          ) : (
            <div className="detail-empty-state">
              <div className="empty-icon-large">👆</div>
              <h3>Select a registration</h3>
              <p>
                Click on a pending student registration to review their details and
                approve or not approve their account.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default StudentVerification;
