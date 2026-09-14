import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../../layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { bookingsApi } from "../../lib/api";
import "./MyBookings.css";

function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load bookings from localStorage or start with empty list (API loads live data)
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem("abugida_student_bookings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Error parsing saved bookings:", err);
      }
    }
    return [];
  });

  // Fetch live bookings from backend database
  useEffect(() => {
    bookingsApi
      .getAll()
      .then((res) => {
        if (res?.bookings && Array.isArray(res.bookings) && res.bookings.length > 0) {
          const apiList = res.bookings.map((b) => ({
            ...b,
            bookingId: b.bookingId || b.id,
            status: b.status
              ? b.status.charAt(0).toUpperCase() + b.status.slice(1).toLowerCase()
              : "Confirmed",
          }));

          setBookings((prev) => {
            const merged = [...apiList];
            for (const item of prev) {
              const id = item.bookingId || item.id;
              if (!merged.some((m) => (m.bookingId || m.id) === id)) {
                merged.push(item);
              }
            }
            return merged;
          });
        }
      })
      .catch((err) => {
        console.warn("Could not load bookings from API, using cached data:", err);
      });
  }, [user]);

  // Save to localStorage when bookings update
  useEffect(() => {
    localStorage.setItem("abugida_student_bookings", JSON.stringify(bookings));
  }, [bookings]);

  // Tab State: "upcoming" | "completed" | "cancelled" | "all"
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [sortBy, setSortBy] = useState("date-asc");

  // Modal States
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("Schedule conflict / Need to reschedule");
  const [cancelNotes, setCancelNotes] = useState("");

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  // Extract all available subjects for filter dropdown
  const allSubjects = useMemo(() => {
    const set = new Set(bookings.map((b) => b.subject));
    return Array.from(set);
  }, [bookings]);

  // Tab counts
  const counts = useMemo(() => {
    const upcoming = bookings.filter(
      (b) =>
        b.status === "Confirmed" ||
        b.status === "Scheduled" ||
        b.status === "In Progress" ||
        b.status === "Pending Approval" ||
        b.status === "Payment Pending" ||
        b.status === "Pending"
    ).length;
    const completed = bookings.filter((b) => b.status === "Completed").length;
    const cancelled = bookings.filter((b) => b.status === "Cancelled" || b.status === "Receipt Rejected").length;
    return {
      all: bookings.length,
      upcoming,
      completed,
      cancelled,
    };
  }, [bookings]);

  // Filtered & Sorted Bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        // Tab Filtering
        if (activeTab === "upcoming") {
          const isUp =
            b.status === "Confirmed" ||
            b.status === "Scheduled" ||
            b.status === "In Progress" ||
            b.status === "Pending Approval" ||
            b.status === "Payment Pending" ||
            b.status === "Pending";
          if (!isUp) return false;
        } else if (activeTab === "completed") {
          if (b.status !== "Completed") return false;
        } else if (activeTab === "cancelled") {
          if (b.status !== "Cancelled" && b.status !== "Receipt Rejected") return false;
        }

        // Subject Filter
        if (selectedSubject !== "all" && b.subject !== selectedSubject) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTutor = b.tutorName?.toLowerCase().includes(q);
          const matchSubject = b.subject?.toLowerCase().includes(q);
          const matchTopic = b.topic?.toLowerCase().includes(q);
          const matchId = b.bookingId?.toLowerCase().includes(q);
          return matchTutor || matchSubject || matchTopic || matchId;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-desc") return (b.totalPrice || b.price) - (a.totalPrice || a.price);
        if (sortBy === "price-asc") return (a.totalPrice || a.price) - (b.totalPrice || b.price);
        return 0; // Default order
      });
  }, [bookings, activeTab, selectedSubject, searchQuery, sortBy]);

  // Handle Cancel Booking Submission
  const handleConfirmCancel = () => {
    if (!cancelModalBooking) return;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.bookingId === cancelModalBooking.bookingId) {
          return {
            ...b,
            status: "Cancelled",
            cancelReason: `${cancelReason}${cancelNotes ? ` - ${cancelNotes}` : ""}`,
            cancelledAt: new Date().toISOString(),
          };
        }
        return b;
      })
    );

    showToast(`Booking #${cancelModalBooking.bookingId} has been successfully cancelled.`);
    setCancelModalBooking(null);
    setCancelNotes("");
  };

  // Copy Meeting Link helper
  const handleCopyLink = (bookingId) => {
    const fullUrl = `${window.location.origin}/live-class/${bookingId}`;
    navigator.clipboard.writeText(fullUrl);
    showToast("Classroom link copied to clipboard! 📋");
  };

  return (
    <Layout>
      <div className="my-bookings-page">
        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="bookings-toast-alert" role="status">
            <span className="toast-icon">✓</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Breadcrumb Bar */}
        <div className="my-bookings-breadcrumb-bar">
          <div className="container breadcrumb-container">
            <Link to="/student/dashboard" className="breadcrumb-back-link">
              ← Back to Student Dashboard
            </Link>
            <div className="breadcrumb-trail">
              <Link to="/">Home</Link>
              <span>/</span>
              <Link to="/student/dashboard">Student Portal</Link>
              <span>/</span>
              <span className="current">My Bookings</span>
            </div>
          </div>
        </div>

        {/* Page Hero Header */}
        <header className="my-bookings-header">
          <div className="container header-inner">
            <div className="header-text-block">
              <span className="header-badge">Student Portal • Sessions</span>
              <h1>My Tutoring Bookings</h1>
              <p>
                Manage your scheduled live sessions, join active classrooms, review past tutoring notes, and track your learning progress.
              </p>
            </div>

            <div className="header-actions">
              <button
                id="btn-find-tutor-header"
                className="header-cta-btn"
                onClick={() => navigate("/tutors")}
              >
                <span>🔍</span> Find New Tutor
              </button>
              <button
                id="btn-dashboard-header"
                className="header-secondary-btn"
                onClick={() => navigate("/student/dashboard")}
              >
                <span>📊</span> Dashboard
              </button>
            </div>
          </div>
        </header>

        <div className="container main-content-layout">
          {/* Quick Metrics Bar */}
          <div className="bookings-metrics-grid">
            <div
              className={`metric-stat-card ${activeTab === "all" ? "highlight" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              <div className="stat-icon-circle blue">📅</div>
              <div className="stat-info">
                <span className="stat-value">{counts.all}</span>
                <span className="stat-label">Total Reservations</span>
              </div>
            </div>

            <div
              className={`metric-stat-card ${activeTab === "upcoming" ? "highlight" : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              <div className="stat-icon-circle emerald">🚀</div>
              <div className="stat-info">
                <span className="stat-value">{counts.upcoming}</span>
                <span className="stat-label">Upcoming Sessions</span>
              </div>
            </div>

            <div
              className={`metric-stat-card ${activeTab === "completed" ? "highlight" : ""}`}
              onClick={() => setActiveTab("completed")}
            >
              <div className="stat-icon-circle purple">🎓</div>
              <div className="stat-info">
                <span className="stat-value">{counts.completed}</span>
                <span className="stat-label">Completed Classes</span>
              </div>
            </div>

            <div
              className={`metric-stat-card ${activeTab === "cancelled" ? "highlight" : ""}`}
              onClick={() => setActiveTab("cancelled")}
            >
              <div className="stat-icon-circle amber">⚠️</div>
              <div className="stat-info">
                <span className="stat-value">{counts.cancelled}</span>
                <span className="stat-label">Cancelled / Rescheduled</span>
              </div>
            </div>
          </div>

          {/* Controls Bar: Tabs, Search, Filters */}
          <div className="bookings-controls-wrapper">
            {/* Booking Status Tabs */}
            <div className="booking-tabs-nav" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === "upcoming"}
                className={`booking-tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
                onClick={() => setActiveTab("upcoming")}
              >
                <span>Upcoming</span>
                <span className="tab-count-badge">{counts.upcoming}</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === "completed"}
                className={`booking-tab-btn ${activeTab === "completed" ? "active" : ""}`}
                onClick={() => setActiveTab("completed")}
              >
                <span>Completed</span>
                <span className="tab-count-badge">{counts.completed}</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === "cancelled"}
                className={`booking-tab-btn ${activeTab === "cancelled" ? "active" : ""}`}
                onClick={() => setActiveTab("cancelled")}
              >
                <span>Cancelled</span>
                <span className="tab-count-badge">{counts.cancelled}</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === "all"}
                className={`booking-tab-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                <span>All Bookings</span>
                <span className="tab-count-badge">{counts.all}</span>
              </button>
            </div>

            {/* Filter Tools: Search & Subject Selector */}
            <div className="bookings-filter-tools">
              <div className="search-input-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search tutor, subject, topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="filter-search-input"
                />
                {searchQuery && (
                  <button
                    className="clear-search-btn"
                    onClick={() => setSearchQuery("")}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="select-filter-group">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Subjects</option>
                  {allSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="date-asc">Sort: Schedule Order</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bookings Card List */}
          <div className="bookings-list-container">
            {filteredBookings.length > 0 ? (
              <div className="bookings-grid">
                {filteredBookings.map((booking) => {
                  const isPending =
                    booking.status === "Pending Approval" ||
                    booking.status === "Payment Pending" ||
                    booking.status === "Pending";
                  const isUpcoming =
                    booking.status === "Confirmed" ||
                    booking.status === "Scheduled" ||
                    booking.status === "In Progress";
                  const isCompleted = booking.status === "Completed";
                  const isCancelled = booking.status === "Cancelled" || booking.status === "Receipt Rejected";
                  const price = booking.totalPrice || booking.price || 25;
                  const etbPrice = Math.round(price * 125);

                  return (
                    <div
                      key={booking.bookingId}
                      className={`booking-card-item status-${booking.status.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {/* Card Header: Tutor Avatar, Name & Status */}
                      <div className="card-top-row">
                        <div className="tutor-mini-profile">
                          <img
                            src={
                              booking.tutorAvatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                            }
                            alt={booking.tutorName}
                            className="tutor-mini-avatar"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <div className="tutor-avatar-fallback" style={{ display: "none" }}>
                            {booking.tutorName ? booking.tutorName[0] : "T"}
                          </div>

                          <div className="tutor-info-meta">
                            <Link
                              to={`/tutors/${booking.tutorId}`}
                              className="tutor-name-link"
                              title="View Tutor Profile"
                            >
                              {booking.tutorName}
                            </Link>
                            <div className="tutor-sub-details">
                              <span className="subject-chip">{booking.subject}</span>
                              {booking.tutorRating && (
                                <span className="tutor-rating-val">
                                  ★ {booking.tutorRating} ({booking.tutorReviewsCount || 50}+)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="status-badge-container">
                          {isPending && (
                            <span
                              className="status-badge pending-approval"
                              style={{
                                background: "#fef3c7",
                                color: "#92400e",
                                border: "1px solid #fde68a",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                              }}
                            >
                              <span
                                className="pulse-dot"
                                style={{ background: "#f59e0b", boxShadow: "0 0 0 2px rgba(245, 158, 11, 0.3)" }}
                              />
                              ⏳ Awaiting Tutor Approval
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="status-badge upcoming">
                              <span className="pulse-dot" />
                              {booking.status}
                            </span>
                          )}
                          {isCompleted && (
                            <span className="status-badge completed">
                              ✓ Completed
                            </span>
                          )}
                          {isCancelled && (
                            <span className="status-badge cancelled">
                              ✕ Cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Session Main Body Details */}
                      <div className="card-body-content">
                        <div className="topic-header-block">
                          <h3 className="topic-title">{booking.topic}</h3>
                          <span className="session-type-pill">{booking.sessionType}</span>
                        </div>

                        <div className="session-specs-grid">
                          <div className="spec-item">
                            <span className="spec-icon">📅</span>
                            <div>
                              <span className="spec-label">Date</span>
                              <span className="spec-val font-semibold">{booking.date}</span>
                            </div>
                          </div>

                          <div className="spec-item">
                            <span className="spec-icon">🕐</span>
                            <div>
                              <span className="spec-label">Time & Duration</span>
                              <span className="spec-val font-semibold">
                                {booking.time} • {booking.duration}
                              </span>
                            </div>
                          </div>

                          <div className="spec-item">
                            <span className="spec-icon">💳</span>
                            <div>
                              <span className="spec-label">Tuition Fee</span>
                              <span className="spec-val price-highlight">
                                ${price}.00 <span className="etb-sub">({etbPrice.toLocaleString()} ETB)</span>
                              </span>
                            </div>
                          </div>

                          <div className="spec-item">
                            <span className="spec-icon">💻</span>
                            <div>
                              <span className="spec-label">Classroom</span>
                              <span className="spec-val classroom-text">
                                Abugida HD Live Room
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Notes / Special Focus or Cancellation Reason */}
                        {booking.notes && (
                          <div className="booking-notes-preview">
                            <span className="notes-icon">📝</span>
                            <p className="notes-text">
                              <strong>Lesson Focus:</strong> {booking.notes}
                            </p>
                          </div>
                        )}

                        {isCancelled && booking.cancelReason && (
                          <div className="cancellation-reason-box">
                            <span className="cancel-icon">⚠️</span>
                            <p>
                              <strong>Cancellation Reason:</strong> {booking.cancelReason}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="card-actions-footer">
                        <div className="left-meta">
                          <span className="booking-ref-id">ID: #{booking.bookingId}</span>
                        </div>

                        <div className="right-action-buttons">
                          {/* 1. View Details Button (Always available) */}
                          <button
                            type="button"
                            className="btn-view-details"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <span>👁️</span> View Details
                          </button>

                          {/* 2. Live Class / Join Button (When Upcoming / Confirmed) */}
                          {isUpcoming && (
                            <button
                              type="button"
                              className="btn-join-live"
                              onClick={() =>
                                navigate(booking.meetingLink || `/live-class/${booking.bookingId}`)
                              }
                            >
                              <span className="video-icon">🎥</span> Join Live Class
                            </button>
                          )}

                          {/* 2b. Recorded Lessons / Course Button */}
                          {booking.courseId && (
                            <button
                              type="button"
                              className="btn-join-live"
                              style={{
                                backgroundColor: "#0d9488",
                                borderColor: "#0d9488",
                              }}
                              onClick={() => navigate(`/courses/${booking.courseId}`)}
                              title="Watch tutor's recorded course and lesson videos"
                            >
                              <span className="video-icon">🎬</span> Watch Recordings
                            </button>
                          )}

                          {/* 2b. Pending Approval Receipt Button */}
                          {isPending && (
                            <button
                              type="button"
                              className="btn-pending-receipt"
                              style={{
                                padding: "0.55rem 0.95rem",
                                border: "1px solid #f59e0b",
                                background: "#fffbeb",
                                color: "#b45309",
                                borderRadius: "var(--radius-md)",
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                              onClick={() => navigate(`/payment-confirmation/${booking.bookingId}`)}
                            >
                              📄 Receipt / Verification
                            </button>
                          )}

                          {/* 3. Cancel Booking Button (When Upcoming or Pending) */}
                          {(isUpcoming || isPending) && (
                            <button
                              type="button"
                              className="btn-cancel-booking"
                              onClick={() => {
                                setCancelModalBooking(booking);
                                setCancelReason("Schedule conflict / Need to reschedule");
                              }}
                            >
                              Cancel
                            </button>
                          )}

                          {/* 4. Leave Review (When Completed) */}
                          {isCompleted && (
                            <>
                              {booking.reviewed ? (
                                <button
                                  type="button"
                                  className="btn-reviewed-badge"
                                  onClick={() => navigate(`/reviews/${booking.bookingId}`)}
                                >
                                  ★ Rated 5/5
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-leave-review"
                                  onClick={() => navigate(`/reviews/${booking.bookingId}`)}
                                >
                                  <span>✍️</span> Review Tutor
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn-book-again"
                                onClick={() => navigate(`/booking/${booking.tutorId}`)}
                              >
                                Book Again
                              </button>
                            </>
                          )}

                          {/* 5. Rebook (When Cancelled) */}
                          {isCancelled && (
                            <button
                              type="button"
                              className="btn-book-again"
                              onClick={() => navigate(`/booking/${booking.tutorId}`)}
                            >
                              Rebook Session
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="bookings-empty-state">
                <div className="empty-state-icon">📅</div>
                <h3>No {activeTab !== "all" ? activeTab : ""} bookings found</h3>
                <p>
                  {searchQuery || selectedSubject !== "all"
                    ? "Try adjusting your search query or subject filters to see more results."
                    : activeTab === "upcoming"
                      ? "You don't have any scheduled sessions right now. Connect with top Ethiopian tutors and book your next class today!"
                      : "No bookings recorded in this category."}
                </p>

                <div className="empty-actions">
                  {(searchQuery || selectedSubject !== "all") && (
                    <button
                      className="btn-clear-filters"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedSubject("all");
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    className="btn-find-tutors-cta"
                    onClick={() => navigate("/tutors")}
                  >
                    <span>🔍</span> Browse Available Tutors
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ────── DETAILS MODAL ────── */}
        {selectedBooking && (
          <div className="modal-backdrop" onClick={() => setSelectedBooking(null)}>
            <div
              className="modal-content-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="modal-tag">Booking Reference</span>
                  <h2>#{selectedBooking.bookingId} Details</h2>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setSelectedBooking(null)}
                  title="Close Modal"
                >
                  ✕
                </button>
              </div>

              <div className="modal-body-scroll">
                {/* Tutor Profile Mini Card */}
                <div className="modal-tutor-banner">
                  <img
                    src={selectedBooking.tutorAvatar}
                    alt={selectedBooking.tutorName}
                    className="modal-tutor-avatar"
                  />
                  <div className="modal-tutor-details">
                    <h3>{selectedBooking.tutorName}</h3>
                    <p className="modal-tutor-sub">
                      {selectedBooking.subject} Tutor • ★ {selectedBooking.tutorRating || "4.9"} Top Rated
                    </p>
                  </div>
                  <div className="modal-status-badge">
                    <span className={`status-badge ${selectedBooking.status.toLowerCase()}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>

                {/* Session Breakdown Grid */}
                <div className="modal-info-grid">
                  <div className="modal-info-tile">
                    <span className="tile-label">Subject & Topic</span>
                    <span className="tile-value font-bold">{selectedBooking.topic}</span>
                  </div>
                  <div className="modal-info-tile">
                    <span className="tile-label">Session Format</span>
                    <span className="tile-value">{selectedBooking.sessionType}</span>
                  </div>
                  <div className="modal-info-tile">
                    <span className="tile-label">Scheduled Date</span>
                    <span className="tile-value font-bold">{selectedBooking.date}</span>
                  </div>
                  <div className="modal-info-tile">
                    <span className="tile-label">Time & Duration</span>
                    <span className="tile-value">{selectedBooking.time} ({selectedBooking.duration})</span>
                  </div>
                  <div className="modal-info-tile">
                    <span className="tile-label">Student Name</span>
                    <span className="tile-value">{selectedBooking.studentName || user?.name || "Nahom Tadesse"}</span>
                  </div>
                  <div className="modal-info-tile">
                    <span className="tile-label">Student Email</span>
                    <span className="tile-value">{selectedBooking.studentEmail || "nahom.student@abugida.edu.et"}</span>
                  </div>
                </div>

                {/* Notes & Learning Goals */}
                {selectedBooking.notes && (
                  <div className="modal-notes-card">
                    <h4>📝 Student Learning Notes & Objectives</h4>
                    <p>{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Pending Verification Notice */}
                {(selectedBooking.status === "Pending Approval" ||
                  selectedBooking.status === "Payment Pending" ||
                  selectedBooking.status === "Pending") && (
                    <div
                      className="modal-pending-box"
                      style={{
                        padding: "1rem 1.2rem",
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: "var(--radius-lg)",
                        marginBottom: "1rem",
                      }}
                    >
                      <h4 style={{ color: "#92400e", margin: "0 0 0.35rem", fontSize: "0.95rem", fontWeight: 800 }}>
                        ⏳ Payment Receipt Awaiting Tutor Verification
                      </h4>
                      <p style={{ color: "#78350f", margin: 0, fontSize: "0.85rem", lineHeight: 1.5 }}>
                        Your payment details have been sent to <strong>{selectedBooking.tutorName}</strong>. Once your tutor verifies the transfer receipt, your live classroom link will be unlocked.
                      </p>
                      {selectedBooking.transactionRef && (
                        <p style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "#92400e" }}>
                          <strong>Payment Method:</strong> {selectedBooking.paymentMethod || "Telebirr"} • <strong>Ref:</strong> {selectedBooking.transactionRef}
                        </p>
                      )}
                    </div>
                  )}

                {/* Live Class URL & Instructions */}
                {(selectedBooking.status === "Confirmed" || selectedBooking.status === "Scheduled") && (
                  <div className="modal-classroom-box">
                    <h4>🎥 Interactive Live Classroom</h4>
                    <p className="classroom-sub">
                      Your virtual whiteboard, screen share, and video feed will be ready 10 minutes before the scheduled time.
                    </p>
                    <div className="meeting-url-row">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/live-class/${selectedBooking.bookingId}`}
                        className="meeting-url-input"
                      />
                      <button
                        className="btn-copy-url"
                        onClick={() => handleCopyLink(selectedBooking.bookingId)}
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="modal-price-receipt">
                  <h4>💳 Payment & Price Breakdown</h4>
                  <div className="receipt-line">
                    <span>Base Tuition Fee</span>
                    <span>${selectedBooking.price || 25}.00</span>
                  </div>
                  <div className="receipt-line">
                    <span>Platform Whiteboard & Service Fee</span>
                    <span>${selectedBooking.serviceFee || 2}.00</span>
                  </div>
                  <div className="receipt-divider" />
                  <div className="receipt-total-line">
                    <div>
                      <strong>Total Paid</strong>
                      <div className="receipt-local-amt">
                        ~{Math.round((selectedBooking.totalPrice || selectedBooking.price || 27) * 125).toLocaleString()} ETB
                      </div>
                    </div>
                    <div className="receipt-final-usd">
                      ${selectedBooking.totalPrice || selectedBooking.price || 27}.00
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="modal-footer">
                {(selectedBooking.status === "Confirmed" || selectedBooking.status === "Scheduled") && (
                  <button
                    className="modal-btn-primary"
                    onClick={() => {
                      navigate(selectedBooking.meetingLink || `/live-class/${selectedBooking.bookingId}`);
                    }}
                  >
                    <span>🎥</span> Join Live Class Now
                  </button>
                )}
                {selectedBooking.courseId && (
                  <button
                    className="modal-btn-primary"
                    style={{ backgroundColor: "#0d9488", borderColor: "#0d9488" }}
                    onClick={() => {
                      navigate(`/courses/${selectedBooking.courseId}`);
                    }}
                  >
                    <span>🎬</span> Watch Recorded Lessons
                  </button>
                )}
                <button
                  className="modal-btn-secondary"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ────── CANCEL BOOKING MODAL ────── */}
        {cancelModalBooking && (
          <div className="modal-backdrop" onClick={() => setCancelModalBooking(null)}>
            <div
              className="modal-content-card modal-cancel-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header danger-header">
                <div>
                  <span className="modal-tag danger">Cancellation Confirmation</span>
                  <h2>Cancel Booking #{cancelModalBooking.bookingId}?</h2>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setCancelModalBooking(null)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body-scroll">
                <p className="cancel-intro-text">
                  Are you sure you want to cancel your session with <strong>{cancelModalBooking.tutorName}</strong> for <strong>{cancelModalBooking.subject}</strong> on <strong>{cancelModalBooking.date} at {cancelModalBooking.time}</strong>?
                </p>

                <div className="cancel-policy-notice">
                  <span className="policy-icon">🛡️</span>
                  <div>
                    <strong>100% Refund Policy:</strong>
                    <p>Cancellations made more than 2 hours before the session are fully credited back to your Abugida Student Balance or payment method.</p>
                  </div>
                </div>

                <div className="form-group-block mt-4">
                  <label className="field-label" htmlFor="cancel-reason-select">
                    Reason for Cancellation:
                  </label>
                  <select
                    id="cancel-reason-select"
                    className="custom-select"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  >
                    <option value="Schedule conflict / Need to reschedule">Schedule conflict / Need to reschedule</option>
                    <option value="Exam / School commitments">Exam / School commitments</option>
                    <option value="Want to try a different tutor">Want to try a different tutor</option>
                    <option value="Technical or connectivity issues">Technical or connectivity issues</option>
                    <option value="Other personal reason">Other personal reason</option>
                  </select>
                </div>

                <div className="form-group-block mt-3">
                  <label className="field-label" htmlFor="cancel-notes-input">
                    Additional details for {cancelModalBooking.tutorName.split(" ")[0]} (Optional):
                  </label>
                  <textarea
                    id="cancel-notes-input"
                    rows="2"
                    className="custom-textarea"
                    placeholder="Provide any context so your tutor can prepare a future reschedule..."
                    value={cancelNotes}
                    onChange={(e) => setCancelNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="modal-btn-danger"
                  onClick={handleConfirmCancel}
                >
                  Yes, Cancel Booking
                </button>
                <button
                  className="modal-btn-secondary"
                  onClick={() => setCancelModalBooking(null)}
                >
                  Keep Booking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default MyBookings;
