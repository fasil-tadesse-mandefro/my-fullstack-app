import { useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Layout from "../../layout/Layout";
import "./Reviews.css";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function StarRating({ value, onChange, size = "lg" }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="star-rating-widget">
      <div className={`stars-row stars-${size}`} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className={`star-btn ${star <= active ? "filled" : ""}`}
            onClick={() => onChange && onChange(star)}
            onMouseEnter={() => onChange && setHovered(star)}
            onMouseLeave={() => onChange && setHovered(0)}
          >
            ★
          </button>
        ))}
      </div>
      {onChange && (
        <span className="star-label">{labels[active] || "Select a rating"}</span>
      )}
    </div>
  );
}

function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rating-bar-row">
      <span className="bar-star-label">{star} ★</span>
      <div className="bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="bar-count">{count}</span>
    </div>
  );
}

function ReviewCard({ review, isOwn }) {
  const [helpfulClicked, setHelpfulClicked] = useState(false);
  const initials = review.studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className={`review-card ${isOwn ? "review-card--own" : ""}`}>
      {isOwn && <span className="your-review-badge">Your Review</span>}
      <div className="review-card-header">
        <div className="reviewer-identity">
          {review.studentAvatar ? (
            <img src={review.studentAvatar} alt={review.studentName} className="reviewer-avatar" />
          ) : (
            <div className="reviewer-avatar-fallback">{initials}</div>
          )}
          <div className="reviewer-meta">
            <strong className="reviewer-name">{review.studentName}</strong>
            <span className="review-subject-chip">{review.subject}</span>
          </div>
        </div>
        <div className="review-card-right">
          <StarRating value={review.rating} size="sm" />
          <span className="review-date">{review.date}</span>
        </div>
      </div>

      <p className="review-topic-label">{review.topic}</p>
      <p className="review-body">{review.comment}</p>

      <div className="review-card-footer">
        <button
          type="button"
          className={`helpful-btn ${helpfulClicked ? "helpful-btn--active" : ""}`}
          onClick={() => setHelpfulClicked((v) => !v)}
        >
          👍 Helpful · {helpfulClicked ? review.helpful + 1 : review.helpful}
        </button>
      </div>
    </article>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function Reviews() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  /* ── Resolve booking from localStorage ── */
  const booking = useMemo(() => {
    try {
      const saved = localStorage.getItem("abugida_student_bookings");
      if (saved) {
        const list = JSON.parse(saved);
        return list.find((b) => (b.bookingId || b.id) === bookingId) || null;
      }
    } catch (e) {
      console.error("Failed to parse bookings:", e);
    }
    return null;
  }, [bookingId]);

  const tutorId = booking?.tutorId?.toString() || null;
  const tutorData = null; // will be loaded from live API in future

  /* ── Reviews for this tutor (empty until live API is wired up) ── */
  const tutorReviews = useMemo(() => {
    return [];
  }, []);

  /* ── Rating summary ── */
  const summary = useMemo(() => {
    if (!tutorData) return null;
    const bd = tutorData.ratingBreakdown;
    const total = tutorData.totalReviews;
    return { bd, total, overall: tutorData.overallRating };
  }, [tutorData]);

  /* ── Check if already reviewed ── */
  const alreadyReviewed = booking?.reviewed === true;
  const existingOwnReview = alreadyReviewed
    ? {
        id: "own-rev",
        bookingId: booking.bookingId,
        tutorId: booking.tutorId,
        studentName: booking.studentName,
        studentAvatar: null,
        rating: booking.ratingGiven,
        comment: booking.reviewComment,
        subject: booking.subject,
        topic: booking.topic,
        date: "Oct 18, 2026",
        helpful: 14,
      }
    : null;

  /* ── Form state ── */
  const [rating, setRating] = useState(alreadyReviewed ? booking.ratingGiven : 0);
  const [comment, setComment] = useState(alreadyReviewed ? booking.reviewComment : "");
  const [submitted, setSubmitted] = useState(alreadyReviewed);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
      setToast(true);
      setTimeout(() => setToast(false), 3500);
    }, 900);
  };

  /* ── No booking found ── */
  if (!booking || !tutorData) {
    return (
      <Layout>
        <div className="reviews-page">
          <div className="container reviews-container">
            <div className="reviews-not-found">
              <div className="not-found-icon">🔍</div>
              <h2>Session not found</h2>
              <p>We could not find a completed session for this review link.</p>
              <Link to="/student/bookings" className="back-to-bookings-btn">
                ← Back to My Bookings
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  /* ── Sorted reviews list (own review pinned first) ── */
  const displayedReviews = [
    ...(existingOwnReview ? [{ ...existingOwnReview, _isOwn: true }] : []),
    ...tutorReviews.filter((r) => r.bookingId !== bookingId).map((r) => ({ ...r, _isOwn: false })),
  ];

  return (
    <Layout>
      <div className="reviews-page">
        {/* Toast */}
        {toast && (
          <div className="reviews-toast" role="alert" aria-live="assertive">
            <span className="toast-check">✓</span>
            Review submitted successfully! Thank you.
          </div>
        )}

        {/* ── Breadcrumb ── */}
        <div className="reviews-breadcrumb-bar">
          <div className="container">
            <div className="reviews-breadcrumb-inner">
              <Link to="/student/bookings" className="breadcrumb-back">
                ← My Bookings
              </Link>
              <nav className="breadcrumb-trail" aria-label="Breadcrumb">
                <Link to="/">Home</Link>
                <span>/</span>
                <Link to="/student/bookings">My Bookings</Link>
                <span>/</span>
                <span className="current">Write a Review</span>
              </nav>
            </div>
          </div>
        </div>

        {/* ── Hero Header ── */}
        <header className="reviews-hero">
          <div className="container">
            <div className="reviews-hero-inner">
              <div className="reviews-hero-text">
                <span className="hero-kicker">Session Feedback</span>
                <h1>Rate your experience</h1>
                <p>
                  Your feedback helps other students find great tutors and helps tutors improve their teaching.
                </p>
              </div>
              <div className="reviews-hero-stats">
                <div className="hero-stat">
                  <strong>{tutorData.totalReviews}</strong>
                  <span>Total Reviews</span>
                </div>
                <div className="hero-stat">
                  <strong>{tutorData.overallRating.toFixed(1)}</strong>
                  <span>Avg. Rating</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container reviews-container">
          <div className="reviews-layout">

            {/* ══════════════ LEFT COLUMN ══════════════ */}
            <div className="reviews-left">

              {/* Tutor Card */}
              <section className="tutor-session-card" aria-label="Session info">
                <div className="tutor-session-header">
                  <img
                    src={tutorData.avatar}
                    alt={tutorData.name}
                    className="tutor-session-avatar"
                  />
                  <div className="tutor-session-info">
                    <h2 className="tutor-session-name">{tutorData.name}</h2>
                    <span className="tutor-session-subject">{tutorData.subject} Tutor</span>
                    <div className="tutor-session-rating">
                      <StarRating value={Math.round(tutorData.overallRating)} size="sm" />
                      <span className="tutor-rating-text">
                        {tutorData.overallRating.toFixed(1)} · {tutorData.totalReviews} reviews
                      </span>
                    </div>
                  </div>
                </div>

                <div className="session-details-block">
                  <h3>Session Details</h3>
                  <ul className="session-details-list">
                    <li>
                      <span className="detail-icon">📚</span>
                      <div>
                        <span className="detail-label">Topic</span>
                        <span className="detail-val">{booking.topic}</span>
                      </div>
                    </li>
                    <li>
                      <span className="detail-icon">🏷️</span>
                      <div>
                        <span className="detail-label">Subject</span>
                        <span className="detail-val">{booking.subject}</span>
                      </div>
                    </li>
                    <li>
                      <span className="detail-icon">📅</span>
                      <div>
                        <span className="detail-label">Date</span>
                        <span className="detail-val">{booking.date} · {booking.time}</span>
                      </div>
                    </li>
                    <li>
                      <span className="detail-icon">⏱️</span>
                      <div>
                        <span className="detail-label">Duration</span>
                        <span className="detail-val">{booking.duration}</span>
                      </div>
                    </li>
                    <li>
                      <span className="detail-icon">🎓</span>
                      <div>
                        <span className="detail-label">Session Type</span>
                        <span className="detail-val">{booking.sessionType}</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Rating Summary */}
              {summary && (
                <section className="rating-summary-card" aria-label="Rating summary">
                  <h3>Rating Summary</h3>
                  <div className="summary-overview">
                    <div className="summary-score">
                      <span className="score-number">{summary.overall.toFixed(1)}</span>
                      <StarRating value={Math.round(summary.overall)} size="md" />
                      <span className="score-total">{summary.total} ratings</span>
                    </div>
                    <div className="summary-bars">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <RatingBar
                          key={star}
                          star={star}
                          count={summary.bd[star]}
                          total={summary.total}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* ══════════════ RIGHT COLUMN ══════════════ */}
            <div className="reviews-right">

              {/* Review Form */}
              <section className="review-form-card" aria-label="Write a review">
                {submitted ? (
                  <div className="review-submitted-state">
                    <div className="submitted-icon">🎉</div>
                    <h2>Review submitted!</h2>
                    <p>
                      Thank you for rating{" "}
                      <strong>{tutorData.name}</strong>. Your feedback is now visible to other students.
                    </p>
                    <div className="submitted-rating-display">
                      <StarRating value={rating} size="lg" />
                    </div>
                    {comment && (
                      <blockquote className="submitted-comment">"{comment}"</blockquote>
                    )}
                    <div className="submitted-actions">
                      <Link to="/student/bookings" className="btn-back-bookings">
                        ← Back to My Bookings
                      </Link>
                      <Link to={`/tutors/${booking.tutorId}`} className="btn-view-tutor">
                        View Tutor Profile
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="review-form-heading">
                      <h2>Write Your Review</h2>
                      <p>
                        How was your session with <strong>{tutorData.name}</strong>?
                      </p>
                    </div>

                    <form id="review-form" className="review-form" onSubmit={handleSubmit} noValidate>
                      {/* Rating Selector */}
                      <div className="form-group">
                        <label className="form-label" htmlFor="rating-widget">
                          Overall Rating <span className="required">*</span>
                        </label>
                        <div id="rating-widget" className="rating-selector-box">
                          <StarRating value={rating} onChange={setRating} size="xl" />
                          {rating === 0 && (
                            <p className="rating-hint">Click a star to rate</p>
                          )}
                        </div>
                      </div>

                      {/* Review Text */}
                      <div className="form-group">
                        <label className="form-label" htmlFor="review-comment">
                          Your Review
                          <span className="optional-tag">Optional</span>
                        </label>
                        <textarea
                          id="review-comment"
                          className="review-textarea"
                          placeholder={`Share what made this session with ${tutorData.name} great (or what could be improved)…`}
                          rows={5}
                          maxLength={800}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <div className="char-counter">
                          {comment.length} / 800 characters
                        </div>
                      </div>

                      {/* Quick Tags */}
                      <div className="form-group">
                        <span className="form-label">Quick Tags</span>
                        <div className="quick-tags">
                          {["Clear explanations", "Patient", "Well prepared", "Engaging", "Timely", "Great examples"].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              className={`quick-tag-btn ${comment.includes(tag) ? "quick-tag-btn--active" : ""}`}
                              onClick={() =>
                                setComment((c) =>
                                  c.includes(tag)
                                    ? c.replace(tag, "").trim()
                                    : c
                                    ? `${c.trim()}, ${tag}`
                                    : tag
                                )
                              }
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        id="submit-review-btn"
                        type="submit"
                        className="submit-review-btn"
                        disabled={rating === 0 || submitting}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner" aria-hidden="true" />
                            Submitting…
                          </>
                        ) : (
                          "Submit Review"
                        )}
                      </button>

                      {rating === 0 && (
                        <p className="submit-hint">Please select a star rating to continue.</p>
                      )}
                    </form>
                  </>
                )}
              </section>

              {/* Previous Reviews */}
              {displayedReviews.length > 0 && (
                <section className="previous-reviews-card" aria-label="Previous reviews">
                  <div className="prev-reviews-heading">
                    <h2>
                      Reviews for {tutorData.name}
                      <span className="review-count-chip">{displayedReviews.length}</span>
                    </h2>
                    <p>What other students say about this tutor</p>
                  </div>

                  <div className="reviews-list">
                    {displayedReviews.map((review) => (
                      <ReviewCard key={review.id} review={review} isOwn={review._isOwn} />
                    ))}
                  </div>

                  {tutorReviews.length < tutorData.totalReviews && (
                    <div className="load-more-reviews">
                      <button type="button" className="load-more-btn">
                        View all {tutorData.totalReviews} reviews
                      </button>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
