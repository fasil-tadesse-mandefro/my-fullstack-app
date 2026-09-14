import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { bookingsApi } from "../../lib/api";
import "./TutorBookings.css";

const baseBookingMock = [
  {
    id: "ABG-2052",
    bookingId: "ABG-2052",
    student: "Tigist Alemu",
    studentName: "Tigist Alemu",
    studentEmail: "tigist.alemu@example.com",
    studentPhone: "+251 91 345 6789",
    initials: "TA",
    subject: "Grade 12 National Exam Math Prep",
    topic: "Calculus Limits & Past Matriculation Questions",
    date: "Aug 30, 2026",
    time: "3:00 PM",
    duration: "60 min",
    price: "$25.00",
    totalPrice: 25,
    status: "Pending",
    paymentMethod: "Telebirr",
    transactionRef: "TLB98234812",
    receiptImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    receiptUploadedAt: "2026-08-29T10:15:00Z",
    note: "I would like to focus on calculus and past national exam questions.",
  },
  {
    id: "ABG-2051",
    bookingId: "ABG-2051",
    student: "Robel Tadesse",
    studentName: "Robel Tadesse",
    studentEmail: "robel.t@example.com",
    studentPhone: "+251 92 888 1234",
    initials: "RT",
    subject: "Linear Algebra & Matrix Theory",
    topic: "Matrix Row Reduction & Inverses",
    date: "Aug 31, 2026",
    time: "10:00 AM",
    duration: "60 min",
    price: "$25.00",
    totalPrice: 25,
    status: "Pending",
    paymentMethod: "Commercial Bank of Ethiopia (CBE)",
    transactionRef: "CBE20481948",
    receiptImage: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80",
    receiptUploadedAt: "2026-08-29T14:30:00Z",
    note: "Please help me prepare for my first university quiz.",
  },
  {
    id: "ABG-2049",
    bookingId: "ABG-2049",
    student: "Nahom Tadesse",
    studentName: "Nahom Tadesse",
    studentEmail: "nahom.student@abugida.edu.et",
    studentPhone: "+251 91 234 5678",
    initials: "NT",
    subject: "Calculus I: Limits & Derivatives",
    topic: "Calculus I: Limits, Continuity & Chain Rule",
    date: "Today",
    time: "4:00 PM",
    duration: "60 min",
    price: "$25.00",
    totalPrice: 25,
    status: "Upcoming",
    paymentMethod: "Telebirr",
    transactionRef: "TLB48102948",
    note: "Review limits and the derivative rules covered this week.",
  },
  {
    id: "ABG-2050",
    bookingId: "ABG-2050",
    student: "Bethelhem Assefa",
    studentName: "Bethelhem Assefa",
    studentEmail: "bethelhem@example.com",
    studentPhone: "+251 91 555 4321",
    initials: "BA",
    subject: "Linear Algebra & Matrices",
    topic: "Eigenvalues and Diagonalization",
    date: "Today",
    time: "6:30 PM",
    duration: "90 min",
    price: "$37.50",
    totalPrice: 37.5,
    status: "Upcoming",
    paymentMethod: "Awash Bank",
    transactionRef: "AWA9812498",
    note: "Practice matrix multiplication and systems of linear equations.",
  },
  {
    id: "ABG-2048",
    bookingId: "ABG-2048",
    student: "Meron Getachew",
    studentName: "Meron Getachew",
    studentEmail: "meron@example.com",
    initials: "MG",
    subject: "Algebra II",
    date: "Aug 27, 2026",
    time: "5:00 PM",
    duration: "60 min",
    price: "$25.00",
    status: "Completed",
    note: "Completed successfully. Student requested practice material for the next lesson.",
  },
  {
    id: "ABG-2045",
    bookingId: "ABG-2045",
    student: "Saron Fikru",
    studentName: "Saron Fikru",
    studentEmail: "saron@example.com",
    initials: "SF",
    subject: "Calculus I",
    date: "Aug 22, 2026",
    time: "11:00 AM",
    duration: "60 min",
    price: "$25.00",
    status: "Cancelled",
    note: "Cancelled by student due to a schedule conflict.",
  },
];

const tabs = ["Pending", "Upcoming", "Completed", "Cancelled"];

function TutorBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Pending");
  const [detailId, setDetailId] = useState(null);
  const [receiptModalBooking, setReceiptModalBooking] = useState(null);
  const [rejectModalBooking, setRejectModalBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState("Transaction reference not found in account statement");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Load and merge bookings from localStorage with initial mock bookings
  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem("abugida_student_bookings");
      if (saved) {
        const studentBookings = JSON.parse(saved);
        if (Array.isArray(studentBookings)) {
          // Normalize student bookings into tutor booking format
          const formatted = studentBookings.map((b) => {
            const rawStatus = b.status || "Pending";
            let tutorStatus = "Upcoming";
            if (rawStatus === "Pending Approval" || rawStatus === "Payment Pending" || rawStatus === "Pending") {
              tutorStatus = "Pending";
            } else if (rawStatus === "Confirmed" || rawStatus === "Scheduled" || rawStatus === "Upcoming") {
              tutorStatus = "Upcoming";
            } else if (rawStatus === "Completed") {
              tutorStatus = "Completed";
            } else if (rawStatus === "Cancelled" || rawStatus === "Receipt Rejected") {
              tutorStatus = "Cancelled";
            }

            const name = b.studentName || "Nahom Tadesse";
            const initials = name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return {
              id: b.bookingId,
              bookingId: b.bookingId,
              student: name,
              studentName: name,
              studentEmail: b.studentEmail || "student@abugida.edu.et",
              studentPhone: b.studentPhone || "+251 91 234 5678",
              initials,
              subject: b.subject || "Mathematics",
              topic: b.topic || b.subject || "Tutoring Session",
              date: b.date || "Today",
              time: b.time || "04:00 PM",
              duration: b.duration || "60 min",
              price: `$${b.totalPrice || b.price || 25}.00`,
              totalPrice: b.totalPrice || b.price || 25,
              status: tutorStatus,
              rawStatus: b.status,
              paymentMethod: b.paymentMethod || "Telebirr",
              transactionRef: b.transactionRef || "",
              receiptImage: b.receiptImage || "",
              receiptUploadedAt: b.receiptUploadedAt || b.bookedAt,
              note: b.notes || b.receiptNote || "Please review session materials.",
            };
          });

          // Merge without duplicating IDs
          const existingIds = new Set(formatted.map((f) => f.id));
          const combined = [
            ...formatted,
            ...baseBookingMock.filter((b) => !existingIds.has(b.id)),
          ];
          return combined;
        }
      }
    } catch (err) {
      console.error("Failed to load tutor bookings:", err);
    }
    return baseBookingMock;
  });

  const visibleBookings = useMemo(() => {
    return bookings.filter((booking) => booking.status === activeTab);
  }, [bookings, activeTab]);

  const countFor = (status) => bookings.filter((booking) => booking.status === status).length;
  const nextLiveBooking = bookings.find((booking) => booking.status === "Upcoming");

  // Synchronize status changes back to localStorage so student immediately sees approval
  const syncToLocalStorage = (bookingId, newStatus, extraData = {}) => {
    try {
      const saved = localStorage.getItem("abugida_student_bookings");
      if (saved) {
        const studentBookings = JSON.parse(saved);
        if (Array.isArray(studentBookings)) {
          const updated = studentBookings.map((b) => {
            if (String(b.bookingId) === String(bookingId)) {
              return {
                ...b,
                status: newStatus,
                ...extraData,
              };
            }
            return b;
          });
          localStorage.setItem("abugida_student_bookings", JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error("Failed to sync status to localStorage:", err);
    }
  };

  // Approve Payment Action
  const handleApprovePayment = (booking) => {
    const approvedStatus = "Upcoming"; // for tutor tab
    const studentStatus = "Confirmed"; // for student portal

    setBookings((current) =>
      current.map((b) =>
        b.id === booking.id
          ? {
              ...b,
              status: approvedStatus,
              rawStatus: studentStatus,
              approvedAt: new Date().toISOString(),
            }
          : b
      )
    );

    // Sync to backend API
    bookingsApi.approveReceipt(booking.id || booking.bookingId).catch((err) => {
      console.warn("Backend receipt approve notice:", err.message);
    });

    syncToLocalStorage(booking.id, studentStatus, {
      approvedAt: new Date().toISOString(),
      paymentStatus: "paid",
    });

    setReceiptModalBooking(null);
    showToast(`✓ Payment approved! Booking #${booking.id} is confirmed and added to your upcoming schedule.`);
  };

  // Reject Payment Action
  const handleConfirmReject = () => {
    if (!rejectModalBooking) return;

    const cancelledStatus = "Cancelled";
    const targetId = rejectModalBooking.id || rejectModalBooking.bookingId;

    setBookings((current) =>
      current.map((b) =>
        b.id === targetId
          ? {
              ...b,
              status: cancelledStatus,
              rawStatus: "Cancelled",
              rejectReason,
              cancelledAt: new Date().toISOString(),
            }
          : b
      )
    );

    // Sync to backend API
    bookingsApi.rejectReceipt(targetId, rejectReason).catch((err) => {
      console.warn("Backend receipt reject notice:", err.message);
    });

    syncToLocalStorage(targetId, "Cancelled", {
      cancelReason: `Payment Rejected: ${rejectReason}`,
      cancelledAt: new Date().toISOString(),
    });

    showToast(`Booking #${targetId} payment rejected.`);
    setRejectModalBooking(null);
    setReceiptModalBooking(null);
  };

  const updateStatus = (id, status) => {
    setBookings((current) =>
      current.map((booking) => (booking.id === id ? { ...booking, status } : booking))
    );
    setDetailId(null);
    const studentStatus = status === "Upcoming" ? "Confirmed" : status === "Cancelled" ? "Cancelled" : status;
    syncToLocalStorage(id, studentStatus);
  };

  return (
    <Layout>
      <main className="tutor-bookings-page">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="tutor-toast-banner" role="status">
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="container tutor-bookings-container">
          <div className="bookings-heading">
            <div>
              <p className="bookings-kicker">Tutor workspace</p>
              <h1>Manage Bookings & Payment Approvals</h1>
              <p>Review student requests, verify uploaded transfer receipts, and manage your teaching schedule.</p>
            </div>
            <Link to="/tutor/dashboard" className="bookings-back">
              Back to dashboard
            </Link>
          </div>

          {nextLiveBooking && (
            <section className="next-live-class">
              <div>
                <span className="live-kicker">Next live class</span>
                <strong className="live-title">{nextLiveBooking.subject}</strong>
                <p className="live-meta">
                  {nextLiveBooking.student} · {nextLiveBooking.date} at {nextLiveBooking.time}
                </p>
              </div>
              <button
                type="button"
                className="join-button"
                onClick={() => navigate(`/live-class/${nextLiveBooking.id}`)}
              >
                🎥 Join Live Classroom
              </button>
            </section>
          )}

          <div className="booking-tabs" role="tablist" aria-label="Booking status">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={activeTab === tab ? "active" : ""}
                onClick={() => {
                  setActiveTab(tab);
                  setDetailId(null);
                }}
              >
                {tab === "Pending" && countFor("Pending") > 0 && <span className="tab-alert-dot" />}
                {tab}
                <span>{countFor(tab)}</span>
              </button>
            ))}
          </div>

          <section className="bookings-list-card">
            <div className="booking-list-heading">
              <div>
                <p className="bookings-kicker">{activeTab} bookings</p>
                <h2>
                  {visibleBookings.length
                    ? `${visibleBookings.length} booking${visibleBookings.length > 1 ? "s" : ""} ${
                        activeTab === "Pending" ? "requiring review / receipt verification" : "listed"
                      }`
                    : "No bookings here yet"}
                </h2>
              </div>
              {activeTab === "Pending" && (
                <span className="request-note">
                  ⚡ Check receipts & confirm to unlock student classroom link
                </span>
              )}
            </div>

            {visibleBookings.length ? (
              <div className="booking-cards">
                {visibleBookings.map((booking) => {
                  const hasReceipt = !!booking.receiptImage || !!booking.transactionRef;

                  return (
                    <article className="tutor-booking-card" key={booking.id}>
                      <div className="booking-student">
                        <div className="student-initials">{booking.initials}</div>
                        <div>
                          <h3>{booking.student}</h3>
                          <span className="student-phone-sub">
                            {booking.studentPhone || booking.id}
                          </span>
                          {hasReceipt && booking.status === "Pending" && (
                            <span className="receipt-attached-chip">
                              📸 Receipt Attached
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="booking-course">
                        <p>Subject & Topic</p>
                        <strong>{booking.subject}</strong>
                        {booking.topic && <small className="topic-sub">{booking.topic}</small>}
                      </div>

                      <div className="booking-date">
                        <p>Date & time</p>
                        <strong>{booking.date}</strong>
                        <span>
                          {booking.time} · {booking.duration}
                        </span>
                      </div>

                      <div className="booking-price">
                        <p>Tuition Fee</p>
                        <strong>{booking.price}</strong>
                        <span className={`status-pill ${booking.status.toLowerCase()}`}>
                          {booking.status === "Pending" ? "Pending Approval" : booking.status}
                        </span>
                      </div>

                      <div className="booking-actions">
                        {/* 1. View Details Toggle */}
                        <button
                          type="button"
                          className="details-button"
                          onClick={() => setDetailId(detailId === booking.id ? null : booking.id)}
                        >
                          {detailId === booking.id ? "Hide details" : "Details"}
                        </button>

                        {/* 2. Pending Review Actions: Review Receipt & Approve / Reject */}
                        {booking.status === "Pending" && (
                          <>
                            {hasReceipt ? (
                              <button
                                type="button"
                                className="review-receipt-button"
                                onClick={() => setReceiptModalBooking(booking)}
                              >
                                🔍 Review Receipt
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="accept-button"
                                onClick={() => handleApprovePayment(booking)}
                              >
                                Accept
                              </button>
                            )}

                            <button
                              type="button"
                              className="reject-button"
                              onClick={() => {
                                setRejectModalBooking(booking);
                                setRejectReason("Transaction reference not found in account statement");
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* 3. Upcoming Live Class Join Button */}
                        {booking.status === "Upcoming" && (
                          <button
                            type="button"
                            className="join-button"
                            onClick={() => navigate(`/live-class/${booking.id}`)}
                          >
                            Join Class
                          </button>
                        )}
                      </div>

                      {/* Expandable Details Pane */}
                      {detailId === booking.id && (
                        <div className="booking-details">
                          <div className="details-sub-grid">
                            <div>
                              <strong>Student Contact:</strong>
                              <p>
                                {booking.student} ({booking.studentEmail} • {booking.studentPhone})
                              </p>
                            </div>
                            <div>
                              <strong>Payment Method Used:</strong>
                              <p>
                                {booking.paymentMethod || "Telebirr"}{" "}
                                {booking.transactionRef && (
                                  <span className="font-mono text-primary font-bold">
                                    (Ref: {booking.transactionRef})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {booking.note && (
                            <div className="details-note-block">
                              <strong>Student Learning Note:</strong>
                              <p>{booking.note}</p>
                            </div>
                          )}

                          {hasReceipt && (
                            <div className="details-receipt-preview-row">
                              <span className="receipt-tag">Uploaded Payment Proof:</span>
                              <button
                                type="button"
                                className="view-receipt-inline-btn"
                                onClick={() => setReceiptModalBooking(booking)}
                              >
                                🖼️ View Full Receipt Image & Details
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="bookings-empty">
                <div className="empty-icon">📅</div>
                <h3>No {activeTab.toLowerCase()} bookings</h3>
                <p>New student bookings and payment receipts will appear here when submitted.</p>
              </div>
            )}
          </section>
        </div>

        {/* ────── PAYMENT RECEIPT INSPECTION & APPROVAL MODAL ────── */}
        {receiptModalBooking && (
          <div className="modal-backdrop" onClick={() => setReceiptModalBooking(null)}>
            <div
              className="modal-card receipt-modal-dialog"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="modal-kicker">Payment Verification</span>
                  <h3>Inspect Student Payment Receipt</h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setReceiptModalBooking(null)}
                >
                  ✕
                </button>
              </div>

              <div className="receipt-modal-body">
                <div className="receipt-meta-grid">
                  <div className="meta-tile">
                    <span className="tile-label">Student Name:</span>
                    <strong className="tile-val">{receiptModalBooking.student}</strong>
                  </div>
                  <div className="meta-tile">
                    <span className="tile-label">Contact:</span>
                    <span className="tile-val">
                      {receiptModalBooking.studentPhone} • {receiptModalBooking.studentEmail}
                    </span>
                  </div>
                  <div className="meta-tile">
                    <span className="tile-label">Payment Service:</span>
                    <strong className="tile-val text-primary">
                      {receiptModalBooking.paymentMethod || "Telebirr"}
                    </strong>
                  </div>
                  <div className="meta-tile">
                    <span className="tile-label">Transaction Reference:</span>
                    <strong className="tile-val font-mono code-box">
                      {receiptModalBooking.transactionRef || "N/A"}
                    </strong>
                  </div>
                  <div className="meta-tile">
                    <span className="tile-label">Session Topic:</span>
                    <strong className="tile-val">{receiptModalBooking.subject}</strong>
                  </div>
                  <div className="meta-tile">
                    <span className="tile-label">Amount Transferred:</span>
                    <strong className="tile-val price-highlight">
                      {receiptModalBooking.price} (~{Math.round(receiptModalBooking.totalPrice * 125)} ETB)
                    </strong>
                  </div>
                </div>

                {receiptModalBooking.note && (
                  <div className="modal-student-note">
                    <span className="note-title">Student Message:</span>
                    <p>{receiptModalBooking.note}</p>
                  </div>
                )}

                {/* Receipt Image Display */}
                <div className="receipt-image-inspection-box">
                  <div className="image-box-header">
                    <span>📄 Attached Receipt Screenshot</span>
                    {receiptModalBooking.receiptImage && (
                      <a
                        href={receiptModalBooking.receiptImage}
                        target="_blank"
                        rel="noreferrer"
                        className="open-full-link"
                      >
                        Open Full Image ↗
                      </a>
                    )}
                  </div>
                  {receiptModalBooking.receiptImage ? (
                    <div className="img-frame">
                      <img
                        src={receiptModalBooking.receiptImage}
                        alt="Receipt proof"
                        className="receipt-inspect-img"
                      />
                    </div>
                  ) : (
                    <div className="no-receipt-img">
                      <p>No receipt image attached. Reference ID: {receiptModalBooking.transactionRef}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="receipt-modal-footer">
                <button
                  type="button"
                  className="btn-reject-receipt"
                  onClick={() => {
                    setRejectModalBooking(receiptModalBooking);
                    setReceiptModalBooking(null);
                  }}
                >
                  ✕ Reject Receipt
                </button>
                <button
                  type="button"
                  className="btn-approve-payment"
                  onClick={() => handleApprovePayment(receiptModalBooking)}
                >
                  ✓ Approve Payment & Confirm Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ────── REJECT PAYMENT MODAL ────── */}
        {rejectModalBooking && (
          <div className="modal-backdrop" onClick={() => setRejectModalBooking(null)}>
            <div
              className="modal-card reject-dialog"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header danger-header">
                <div>
                  <span className="modal-kicker text-danger">Payment Rejection</span>
                  <h3>Reject Receipt for #{rejectModalBooking.id}?</h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setRejectModalBooking(null)}
                >
                  ✕
                </button>
              </div>

              <div className="reject-modal-body">
                <p>
                  Please specify why the payment receipt for <strong>{rejectModalBooking.student}</strong> is being rejected. The student will be notified and asked to re-upload.
                </p>

                <label className="field-label mt-3">
                  <span>Rejection Reason:</span>
                  <select
                    className="custom-select"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  >
                    <option value="Transaction reference not found in account statement">
                      Transaction reference not found in account statement
                    </option>
                    <option value="Transferred amount does not match session fee">
                      Transferred amount does not match session fee
                    </option>
                    <option value="Receipt image is blurry or unreadable">
                      Receipt image is blurry or unreadable
                    </option>
                    <option value="Transferred to wrong account number">
                      Transferred to wrong account number
                    </option>
                    <option value="Other / Need re-upload">Other / Need re-upload</option>
                  </select>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setRejectModalBooking(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-confirm-reject"
                  onClick={handleConfirmReject}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}

export default TutorBookings;
