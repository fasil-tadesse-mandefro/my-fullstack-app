import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import Layout from "../../layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { bookingsApi, tutorsApi } from "../../lib/api";
import "./Booking.css";

const SESSION_TYPES = [
  {
    id: "1-on-1",
    title: "1-on-1 Private Live Session",
    desc: "Personalized lesson tailored 100% to your curriculum and pace",
    badge: "Most Popular",
    icon: "🎯",
  },
  {
    id: "exam-sprint",
    title: "Exam Sprint & Homework Help",
    desc: "Intensive problem-solving and rapid concept review before exams",
    badge: "Fast Track",
    icon: "🚀",
  },
  {
    id: "small-group",
    title: "Small Group / Pair Study",
    desc: "Collaborative learning session with up to 3 peers (20% discount)",
    badge: "Group Save",
    icon: "👥",
  },
];

const DURATION_OPTIONS = [
  { id: "60", label: "60 Minutes", hrs: 1.0, sub: "Standard Lesson", multiplier: 1.0 },
  { id: "90", label: "90 Minutes", hrs: 1.5, sub: "Deep Dive Session", multiplier: 1.5 },
  { id: "120", label: "120 Minutes", hrs: 2.0, sub: "Mastery Class (10% off)", multiplier: 1.8 },
];

const groupAvailabilityByDate = (availability = []) => availability
  .filter((item) => item.status === "available")
  .reduce((groups, item) => {
    const dateKey = String(item.date).slice(0, 10);
    let group = groups.find((entry) => entry.dateKey === dateKey);
    if (!group) {
      group = {
        dateKey,
        day: item.day,
        date: new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        slots: [],
      };
      groups.push(group);
    }
    group.slots.push(String(item.startTime).slice(0, 5));
    return groups;
  }, []);

function Booking() {
  const { tutorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Not logged in → require Login/Sign In first; booking & payment only
  // happen after that. Return here once they've signed in.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
    }
  }, [authLoading, isAuthenticated, navigate, location]);

  const [tutorData, setTutorData] = useState(null);

  const fetchTutor = useCallback(async () => {
    if (!tutorId) return;
    try {
      const [profileRes, availabilityRes] = await Promise.allSettled([
        tutorsApi.getProfile(tutorId),
        tutorsApi.getAvailability(tutorId),
      ]);
      const availableTimeSlots = availabilityRes.status === "fulfilled"
        ? groupAvailabilityByDate(availabilityRes.value?.availability)
        : [];
      const res = profileRes.status === "fulfilled" ? profileRes.value : null;
      if (res?.tutor) {
        setTutorData({ ...res.tutor, availableTimeSlots });
      } else {
        const allRes = await tutorsApi.getAll();
        const list = allRes?.tutors || allRes || [];
        const found = list.find((t) => String(t.id) === String(tutorId)) || list[0];
        setTutorData(found ? { ...found, availableTimeSlots } : null);
      }
    } catch (err) {
      console.warn("Failed to fetch tutor in booking:", err);
    }
  }, [tutorId]);

  useEffect(() => {
    fetchTutor();
  }, [fetchTutor]);

  const tutor = tutorData || {
    id: tutorId,
    name: "Dr. Abebe Bekele",
    subject: "Mathematics",
    price: 25,
    rating: 5.0,
    reviewsCount: 128,
    educationLevel: "Preparatory",
  };

  // Query parameters from previous page
  const initialDay = searchParams.get("day");
  const initialDate = searchParams.get("date");
  const initialTime = searchParams.get("time");

  // Booking Form State
  const [selectedSubject, setSelectedSubject] = useState(
    tutor.subjectsTaught ? tutor.subjectsTaught[0] : tutor.subject
  );
  const [topicFocus, setTopicFocus] = useState("");
  const [sessionType, setSessionType] = useState("1-on-1");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(initialTime || "");
  const [duration, setDuration] = useState("60");

  // Student Details State
  const [studentName, setStudentName] = useState(user?.name || "Nahom Tadesse");
  const [studentEmail, setStudentEmail] = useState(user?.email || "nahom.student@abugida.edu.et");
  const [studentPhone, setStudentPhone] = useState("+251 91 234 5678");
  const [learningNotes, setLearningNotes] = useState("");

  // Promo Code State
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Submission State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Available days & slots from tutor data
  const availableDays = useMemo(() => {
    return Array.isArray(tutor.availableTimeSlots) ? tutor.availableTimeSlots : [];
  }, [tutor]);

  // Set initial selected day if matching initialDay query
  useEffect(() => {
    if (initialDay) {
      const idx = availableDays.findIndex((d) => d.day.toLowerCase() === initialDay.toLowerCase());
      if (idx !== -1) {
        setSelectedDayIndex(idx);
      }
    }
  }, [initialDay, availableDays]);

  const activeDay = availableDays[selectedDayIndex] || availableDays[0];

  // Price calculations
  const durationObj = DURATION_OPTIONS.find((d) => d.id === duration) || DURATION_OPTIONS[0];
  const basePrice = tutor.price || 25;
  const sessionSubtotal = Math.round(basePrice * durationObj.multiplier);
  const serviceFee = 2.0; // Platform fee
  const totalPrice = Math.max(0, sessionSubtotal + serviceFee - promoDiscount);
  const etbEquivalent = Math.round(totalPrice * 125); // ~125 ETB/USD exchange rate

  // Handle Promo Code Apply
  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError("");
    const code = promoCode.trim().toUpperCase();

    if (!code) {
      setPromoError("Please enter a coupon code.");
      return;
    }

    if (code === "ABUGIDA10" || code === "WELCOME10") {
      setPromoDiscount(5);
      setPromoApplied(true);
      setPromoError("");
    } else if (code === "STUDENT50") {
      setPromoDiscount(10);
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError("Invalid promo code. Try 'ABUGIDA10' for $5 off.");
    }
  };

  // Submit Booking
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedTimeSlot) {
      setErrorMsg("Please select an available time slot for your class.");
      return;
    }

    if (!studentName.trim() || !studentEmail.trim()) {
      setErrorMsg("Please provide your name and email address.");
      return;
    }

    setLoading(true);

    const newBookingId = `bk-${Date.now().toString().slice(-6)}`;
    const bookingPayload = {
      bookingId: newBookingId,
      tutorId: tutor.id,
      tutorName: tutor.name,
      tutorAvatar: tutor.avatar,
      tutorSubject: tutor.subject,
      subject: selectedSubject,
      topic: topicFocus || `${tutor.subject} Tutoring Session`,
      sessionType: SESSION_TYPES.find((s) => s.id === sessionType)?.title || "1-on-1 Live Class",
      date: `${activeDay?.day}, ${activeDay?.date}`,
      time: selectedTimeSlot,
      duration: durationObj.label,
      price: totalPrice,
      serviceFee: 2,
      totalPrice: totalPrice,
      studentName,
      studentEmail,
      studentPhone,
      notes: learningNotes,
      meetingLink: `/live-class/${newBookingId}`,
      status: "Payment Pending",
      paymentStatus: "unpaid",
      bookedAt: new Date().toISOString(),
      scheduledStartAt: activeDay?.dateKey
        ? new Date(`${activeDay.dateKey}T${selectedTimeSlot}:00`).toISOString()
        : new Date().toISOString(),
    };

    bookingsApi.create(bookingPayload)
      .then((res) => {
        const savedBooking = res?.booking ? { ...bookingPayload, ...res.booking } : bookingPayload;
        try {
          const existing = localStorage.getItem("abugida_student_bookings");
          const currentBookings = existing ? JSON.parse(existing) : [];
          localStorage.setItem("abugida_student_bookings", JSON.stringify([savedBooking, ...currentBookings]));
        } catch (err) {
          console.error("Failed to save booking to localStorage:", err);
        }
        navigate(`/payment-confirmation/${savedBooking.bookingId}`, { state: { booking: savedBooking } });
      })
      .catch((err) => {
        setErrorMsg(err.message || "We could not create your booking. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Initials for avatar
  const initials = tutor.name
    ? tutor.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
    : "T";

  // Not logged in → the redirect effect above sends them to /login; show a
  // brief loading state here instead of flashing the booking form first.
  if (authLoading || !isAuthenticated) {
    return (
      <Layout>
        <div className="container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.5rem" }}>
          <p>Redirecting you to sign in…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="booking-page">
        {/* Top Breadcrumb Bar */}
        <div className="booking-breadcrumb-bar">
          <div className="container breadcrumb-container">
            <Link to={`/tutors/${tutor.id}`} className="breadcrumb-back-link">
              ← Back to {tutor.name}'s Profile
            </Link>
            <div className="breadcrumb-trail">
              <Link to="/">Home</Link>
              <span>/</span>
              <Link to="/tutors">Find Tutors</Link>
              <span>/</span>
              <Link to={`/tutors/${tutor.id}`}>{tutor.name}</Link>
              <span>/</span>
              <span className="current">Book Session</span>
            </div>
          </div>
        </div>

        <div className="container booking-main-container">
          <div className="booking-page-header">
            <span className="booking-header-tag">Session Reservation</span>
            <h1>Schedule Your Tutoring Session</h1>
            <p>Customize your subject focus, date, time slot, and session duration below.</p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="booking-alert-banner" role="alert">
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleBookingSubmit} className="booking-form-grid">
            {/* ────── LEFT COLUMN: BOOKING CONFIGURATION ────── */}
            <div className="booking-config-col">
              {/* 1. TUTOR SUMMARY CARD */}
              <div className="booking-card tutor-summary-card">
                <div className="summary-avatar-box">
                  <img
                    src={tutor.avatar}
                    alt={tutor.name}
                    className="summary-avatar"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="summary-avatar-fallback" style={{ display: "none" }}>
                    {initials}
                  </div>
                  {tutor.verified && (
                    <span className="summary-verified-dot" title="Verified Tutor">✓</span>
                  )}
                </div>

                <div className="summary-tutor-info">
                  <div className="summary-name-row">
                    <h3>{tutor.name}</h3>
                    <span className="summary-badge-sub">{tutor.subject}</span>
                  </div>
                  <p className="summary-tagline">{tutor.tagline}</p>
                  <div className="summary-badges-row">
                    <span className="summary-rating">★ {tutor.rating ? tutor.rating.toFixed(1) : "5.0"} ({tutor.reviewsCount || 100}+ reviews)</span>
                    <span className="summary-bullet">•</span>
                    <span className="summary-rate">${tutor.price}/hr Base Rate</span>
                    <span className="summary-bullet">•</span>
                    <span className="summary-level">{tutor.educationLevel}</span>
                  </div>
                </div>
              </div>

              {/* 2. SUBJECT & TOPIC INFORMATION */}
              <div className="booking-card">
                <div className="card-section-header">
                  <span className="section-num">1</span>
                  <h3>Subject & Topic Information</h3>
                </div>

                <div className="form-group-block">
                  <label className="field-label" htmlFor="subject-select">
                    Select Subject Focus <span className="req">*</span>
                  </label>
                  <select
                    id="subject-select"
                    className="custom-select"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    {tutor.subjectsTaught ? (
                      tutor.subjectsTaught.map((sub, idx) => (
                        <option key={idx} value={sub}>
                          {sub}
                        </option>
                      ))
                    ) : (
                      <option value={tutor.subject}>{tutor.subject}</option>
                    )}
                  </select>
                </div>

                <div className="form-group-block mt-3">
                  <label className="field-label" htmlFor="topic-focus">
                    Specific Topic or Chapter (Optional)
                  </label>
                  <input
                    type="text"
                    id="topic-focus"
                    className="custom-input"
                    placeholder="e.g. Calculus Limits & Continuity, Unit 3 Optics, Exam Practice"
                    value={topicFocus}
                    onChange={(e) => setTopicFocus(e.target.value)}
                  />
                  <span className="field-hint">
                    Helps {tutor.name.split(" ")[0]} prepare personalized notes and exercises before class.
                  </span>
                </div>
              </div>

              {/* 3. SESSION TYPE */}
              <div className="booking-card">
                <div className="card-section-header">
                  <span className="section-num">2</span>
                  <h3>Select Session Type</h3>
                </div>

                <div className="session-types-grid">
                  {SESSION_TYPES.map((st) => (
                    <div
                      key={st.id}
                      className={`session-type-card ${sessionType === st.id ? "active" : ""}`}
                      onClick={() => setSessionType(st.id)}
                    >
                      <div className="st-header">
                        <span className="st-icon">{st.icon}</span>
                        {st.badge && <span className="st-badge">{st.badge}</span>}
                      </div>
                      <h4 className="st-title">{st.title}</h4>
                      <p className="st-desc">{st.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. DATE PICKER & AVAILABLE TIME SLOTS */}
              <div className="booking-card">
                <div className="card-section-header">
                  <span className="section-num">3</span>
                  <h3>Choose Date & Time Slot</h3>
                </div>

                {/* Day Picker Pills */}
                <label className="field-label">1. Select Day:</label>
                <div className="date-pills-row">
                  {availableDays.map((d, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`date-pill-btn ${selectedDayIndex === idx ? "active" : ""}`}
                      onClick={() => {
                        setSelectedDayIndex(idx);
                        setSelectedTimeSlot("");
                      }}
                    >
                      <span className="date-pill-day">{d.day}</span>
                      <span className="date-pill-date">{d.date}</span>
                    </button>
                  ))}
                </div>

                {/* Time Slots Grid */}
                <label className="field-label mt-4">
                  2. Select Available Time Slot: <span className="req">*</span>
                </label>
                <div className="time-slots-grid">
                  {activeDay?.slots && activeDay.slots.length > 0 ? (
                    activeDay.slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`time-slot-btn ${selectedTimeSlot === slot ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedTimeSlot(slot);
                          setErrorMsg("");
                        }}
                      >
                        <span className="clock-icon">🕐</span>
                        <span>{slot}</span>
                      </button>
                    ))
                  ) : (
                    <p className="no-slots-text">This tutor has not posted any available slots yet.</p>
                  )}
                </div>

                {selectedTimeSlot && (
                  <div className="slot-confirmed-banner">
                    <span>✓ Reserved Slot:</span>
                    <strong>{activeDay?.day}, {activeDay?.date} at {selectedTimeSlot}</strong>
                  </div>
                )}
              </div>

              {/* 5. SESSION DURATION */}
              <div className="booking-card">
                <div className="card-section-header">
                  <span className="section-num">4</span>
                  <h3>Session Duration</h3>
                </div>

                <div className="duration-options-grid">
                  {DURATION_OPTIONS.map((d) => (
                    <div
                      key={d.id}
                      className={`duration-card ${duration === d.id ? "active" : ""}`}
                      onClick={() => setDuration(d.id)}
                    >
                      <span className="duration-label">{d.label}</span>
                      <span className="duration-sub">{d.sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. STUDENT & BOOKING DETAILS */}
              <div className="booking-card">
                <div className="card-section-header">
                  <span className="section-num">5</span>
                  <h3>Student Information & Learning Notes</h3>
                </div>

                <div className="form-row-2">
                  <div className="form-group-block">
                    <label className="field-label" htmlFor="student-name">
                      Student Full Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="student-name"
                      className="custom-input"
                      value={studentName}
                      onChange={(e) => {
                        setStudentName(e.target.value);
                        if (errorMsg) setErrorMsg("");
                      }}
                      required
                    />
                  </div>

                  <div className="form-group-block">
                    <label className="field-label" htmlFor="student-email">
                      Contact Email <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      id="student-email"
                      className="custom-input"
                      value={studentEmail}
                      onChange={(e) => {
                        setStudentEmail(e.target.value);
                        if (errorMsg) setErrorMsg("");
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group-block mt-3">
                  <label className="field-label" htmlFor="student-phone">
                    Phone / Telegram Number (for Class Reminders)
                  </label>
                  <input
                    type="tel"
                    id="student-phone"
                    className="custom-input"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="+251 91 123 4567"
                  />
                </div>

                <div className="form-group-block mt-3">
                  <label className="field-label" htmlFor="learning-notes">
                    Notes or Questions for {tutor.name.split(" ")[0]} (Optional)
                  </label>
                  <textarea
                    id="learning-notes"
                    className="custom-textarea"
                    rows="3"
                    placeholder="e.g. Please focus on Chapter 4 review problems, I struggle with integration formulas..."
                    value={learningNotes}
                    onChange={(e) => setLearningNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ────── RIGHT COLUMN: PRICE SUMMARY & CHECKOUT ────── */}
            <div className="booking-summary-col">
              <div className="sticky-summary-card">
                <h3 className="summary-title">Booking Summary</h3>

                {/* Session Breakdown Mini Info */}
                <div className="summary-session-preview">
                  <div className="preview-row">
                    <span className="p-label">Tutor:</span>
                    <span className="p-val font-bold">{tutor.name}</span>
                  </div>
                  <div className="preview-row">
                    <span className="p-label">Subject:</span>
                    <span className="p-val">{selectedSubject}</span>
                  </div>
                  <div className="preview-row">
                    <span className="p-label">Schedule:</span>
                    <span className="p-val">
                      {selectedTimeSlot ? `${activeDay?.day}, ${selectedTimeSlot}` : "Please pick a slot"}
                    </span>
                  </div>
                  <div className="preview-row">
                    <span className="p-label">Duration:</span>
                    <span className="p-val">{durationObj.label}</span>
                  </div>
                  <div className="preview-row">
                    <span className="p-label">Classroom:</span>
                    <span className="p-val text-primary font-bold">Abugida HD Live Room</span>
                  </div>
                </div>

                {/* Promo Code Box */}
                <div className="promo-code-container">
                  <div className="promo-input-row">
                    <input
                      type="text"
                      className="promo-input"
                      placeholder="Promo / Voucher Code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                    />
                    <button
                      type="button"
                      className="promo-apply-btn"
                      onClick={handleApplyPromo}
                      disabled={promoApplied}
                    >
                      {promoApplied ? "Applied ✓" : "Apply"}
                    </button>
                  </div>
                  {promoError && <span className="promo-error-msg">{promoError}</span>}
                  {promoApplied && (
                    <span className="promo-success-msg">
                      ✓ $5 Promo discount applied!
                    </span>
                  )}
                </div>

                {/* Price Breakdown Calculation */}
                <div className="price-breakdown-box">
                  <div className="price-line">
                    <span>Base Tuition ({durationObj.label})</span>
                    <span>${sessionSubtotal}.00</span>
                  </div>
                  <div className="price-line">
                    <span>Platform Service & Whiteboard</span>
                    <span>${serviceFee.toFixed(2)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="price-line discount-line">
                      <span>Promo Discount</span>
                      <span>-${promoDiscount}.00</span>
                    </div>
                  )}

                  <div className="price-divider" />

                  <div className="price-total-row">
                    <div>
                      <span className="total-label">Total Amount</span>
                      <span className="total-sub">Local: ~{etbEquivalent.toLocaleString()} ETB</span>
                    </div>
                    <div className="total-amount">${totalPrice}.00</div>
                  </div>
                </div>

                {/* Immediate Error Banner directly above Confirm Button */}
                {errorMsg && (
                  <div className="summary-error-banner" role="alert">
                    <span className="summary-error-icon">⚠️</span>
                    <span className="summary-error-text">{errorMsg}</span>
                  </div>
                )}

                {/* Book Session CTA Button */}
                <button
                  type="submit"
                  className="booking-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    "Processing Booking..."
                  ) : (
                    <>
                      <span>Confirm & Book Session →</span>
                      <span className="btn-micro-sub">Safe & Secure 256-bit Checkout</span>
                    </>
                  )}
                </button>

                {/* Guarantee Chips */}
                <div className="summary-guarantees">
                  <div className="g-item">
                    <span>🛡️</span>
                    <span>100% Satisfaction or Free Reschedule</span>
                  </div>
                  <div className="g-item">
                    <span>💳</span>
                    <span>Telebirr, CBE & Local Bank Transfer</span>
                  </div>
                  <div className="g-item">
                    <span>⚡</span>
                    <span>Instant Live Meeting Link Generated</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default Booking;
