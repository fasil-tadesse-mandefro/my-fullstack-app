import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "../../layout/Layout";
import { tutorsApi, coursesApi } from "../../lib/api";
import "./TutorProfile.css";

function TutorProfile() {
  const { tutorId } = useParams();
  const navigate = useNavigate();

  const [tutorData, setTutorData] = useState(null);
  const [tutorCourses, setTutorCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!tutorId) return;
    setLoading(true);
    setError(null);
    try {
      const [profileRes, coursesRes, availabilityRes] = await Promise.allSettled([
        tutorsApi.getProfile(tutorId),
        coursesApi.getAll({ tutor_id: tutorId }),
        tutorsApi.getAvailability(tutorId),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value?.tutor) {
        const profile = profileRes.value.tutor;
        const availability = availabilityRes.status === "fulfilled"
          ? (availabilityRes.value?.availability || []).filter((item) => item.status === "available")
          : [];
        const groupedSlots = availability.reduce((groups, item) => {
          const date = String(item.date).slice(0, 10);
          const existing = groups.find((group) => group.dateKey === date);
          const group = existing || {
            dateKey: date,
            day: item.day,
            date: new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            slots: [],
          };
          if (!existing) groups.push(group);
          group.slots.push(String(item.startTime).slice(0, 5));
          return groups;
        }, []);
        setTutorData({ ...profile, availableTimeSlots: groupedSlots });
      } else {
        const allTutorsRes = await tutorsApi.getAll();
        const list = allTutorsRes?.tutors || allTutorsRes || [];
        const found = list.find((t) => String(t.id) === String(tutorId));
        if (found) {
          setTutorData(found);
        } else {
          setError("Tutor profile not found.");
        }
      }

      if (coursesRes.status === "fulfilled") {
        const list = coursesRes.value?.courses || coursesRes.value || [];
        setTutorCourses(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error("Failed to fetch tutor profile:", err);
      setError(err.message || "Failed to load tutor profile.");
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const tutor = tutorData;

  // Interactive time slot selection
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const currentDaySlots = useMemo(() => {
    if (tutor?.availableTimeSlots && tutor.availableTimeSlots[selectedDayIndex]) {
      return tutor.availableTimeSlots[selectedDayIndex];
    }
    return { day: "Today", date: "Available", slots: [] };
  }, [tutor, selectedDayIndex]);

  const handleBookNow = () => {
    if (!tutor) return;
    const queryParams = new URLSearchParams();
    if (selectedSlot && currentDaySlots) {
      queryParams.set("day", currentDaySlots.day);
      queryParams.set("date", currentDaySlots.date);
      queryParams.set("time", selectedSlot);
    }
    navigate(`/booking/${tutor.id}?${queryParams.toString()}`);
  };

  const handleViewCourses = () => {
    navigate("/courses");
  };

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: "5rem 0", textAlign: "center" }}>
          <h2>Loading tutor profile...</h2>
          <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Fetching credentials and teaching details from Abugida database.</p>
        </div>
      </Layout>
    );
  }

  if (!tutor) {
    return (
      <Layout>
        <div className="container" style={{ padding: "5rem 0", textAlign: "center" }}>
          <h2>Tutor Not Found</h2>
          <p style={{ color: "#64748b", margin: "1rem 0 2rem" }}>
            {error || "The requested tutor profile could not be located."}
          </p>
          <Link to="/tutors" className="breadcrumb-back-link" style={{ display: "inline-block", padding: "0.75rem 1.5rem", background: "var(--primary)", color: "#fff", borderRadius: "8px" }}>
            ← Browse All Tutors
          </Link>
        </div>
      </Layout>
    );
  }

  // Extract initials for fallback avatar
  const initials = tutor.name
    ? tutor.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
    : "T";

  const reviewsList = Array.isArray(tutor.reviews) ? tutor.reviews : [];
  const reviewsCount = reviewsList.length || tutor.reviewsCount || 0;
  const ratingScore = tutor.rating !== null && tutor.rating !== undefined ? Number(tutor.rating).toFixed(1) : null;

  // Real review star breakdown if reviews exist
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (reviewsList.length > 0) {
    for (const r of reviewsList) {
      const star = Math.round(Number(r.rating || 5));
      if (starCounts[star] !== undefined) starCounts[star]++;
    }
  }

  return (
    <Layout>
      <div className="tutor-profile-page">
        {/* Top Breadcrumb Bar */}
        <div className="profile-breadcrumb-bar">
          <div className="container breadcrumb-container">
            <Link to="/tutors" className="breadcrumb-back-link">
              ← Back to All Tutors
            </Link>
            <div className="breadcrumb-trail">
              <Link to="/">Home</Link>
              <span>/</span>
              <Link to="/tutors">Find Tutors</Link>
              <span>/</span>
              <span className="current">{tutor.name}</span>
            </div>
          </div>
        </div>

        {/* ── TUTOR HERO / HEADER CARD ── */}
        <div className="container">
          <div className="tutor-hero-card">
            <div className="tutor-hero-left">
              <div className="tutor-hero-avatar-wrapper">
                {tutor.avatar ? (
                  <img
                    src={tutor.avatar}
                    alt={tutor.name}
                    className="tutor-hero-avatar"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="tutor-hero-avatar-fallback"
                  style={{ display: tutor.avatar ? "none" : "flex" }}
                >
                  {initials}
                </div>
                {tutor.verified && (
                  <span className="hero-verified-badge" title="Verified Background & Credentials">
                    ✓ Verified
                  </span>
                )}
              </div>

              <div className="tutor-hero-details">
                <div className="tutor-title-row">
                  <h1 className="tutor-profile-name">{tutor.name}</h1>
                  {tutor.subject && <span className="tutor-subject-pill">{tutor.subject}</span>}
                </div>

                {tutor.tagline && <p className="tutor-profile-tagline">{tutor.tagline}</p>}

                <div className="tutor-hero-meta-badges">
                  <div className="meta-badge-item">
                    <span className="star-gold">★</span>
                    <strong>{ratingScore ? ratingScore : "New"}</strong>
                    <span className="meta-muted">
                      ({reviewsCount > 0 ? `${reviewsCount} review${reviewsCount > 1 ? "s" : ""}` : "No reviews yet"})
                    </span>
                  </div>

                  {tutor.experience && (
                    <div className="meta-badge-item">
                      <span>⏱️</span>
                      <span>{tutor.experience} Experience</span>
                    </div>
                  )}

                  <div className="meta-badge-item">
                    <span>📍</span>
                    <span>{tutor.location || "Addis Ababa, Ethiopia"}</span>
                  </div>

                  {tutor.availableTimeSlots?.length > 0 && (
                    <div className="meta-badge-item badge-availability-live">
                      <span className="pulse-dot"></span>
                      <span>Available slots posted</span>
                    </div>
                  )}
                </div>

                {/* Languages Spoken (tutor_languages) */}
                {Array.isArray(tutor.languages) && tutor.languages.length > 0 && (
                  <div className="tutor-languages-row">
                    <span className="lang-label">Languages:</span>
                    {tutor.languages.map((lang) => (
                      <span key={lang} className="lang-chip">
                        🗣️ {lang}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Hero Rate & CTA */}
            <div className="tutor-hero-right">
              <div className="rate-display-box">
                <span className="rate-caption">Hourly Rate</span>
                <div className="rate-amount">
                  ${tutor.price || tutor.hourlyRate || 25}
                  <span className="rate-unit">/{tutor.priceUnit || "hr"}</span>
                </div>
                <span className="rate-sub">100% Satisfaction Guarantee</span>
              </div>
              <button className="hero-book-btn" onClick={handleBookNow}>
                Book 1-on-1 Lesson →
              </button>
            </div>
          </div>

          {/* ── 2-COLUMN MAIN PROFILE CONTENT ── */}
          <div className="profile-layout-grid">
            {/* ────── LEFT COLUMN: DETAILS & SECTIONS ────── */}
            <div className="profile-main-col">

              {/* 1. ABOUT TUTOR SECTION */}
              <section className="profile-card-section" id="about-section">
                <div className="section-header-row">
                  <span className="section-icon">👤</span>
                  <h2>About {tutor.name}</h2>
                </div>

                <div className="bio-text">
                  <p>{tutor.bio || tutor.tagline || "Passionate educator dedicated to helping students excel."}</p>
                </div>

                {/* Teaching Methodology */}
                {tutor.teachingMethod && (
                  <div className="methodology-box">
                    <div className="methodology-header">
                      <span>💡</span>
                      <h3>Teaching Style & Methodology</h3>
                    </div>
                    <p>{tutor.teachingMethod}</p>
                  </div>
                )}

                {/* Key Highlights / Why Book */}
                <div className="why-book-grid">
                  <div className="why-book-item">
                    <span className="why-icon">🎯</span>
                    <div>
                      <h4>Curriculum Aligned</h4>
                      <p>Full coverage of Ethiopian national curriculum & entrance exam blueprints.</p>
                    </div>
                  </div>
                  <div className="why-book-item">
                    <span className="why-icon">💻</span>
                    <div>
                      <h4>Interactive Whiteboard</h4>
                      <p>High-definition live video with real-time screen sharing and digital whiteboard.</p>
                    </div>
                  </div>
                  <div className="why-book-item">
                    <span className="why-icon">📝</span>
                    <div>
                      <h4>Post-Class Notes</h4>
                      <p>Get comprehensive summary notes and practice exercises after every class.</p>
                    </div>
                  </div>
                  <div className="why-book-item">
                    <span className="why-icon">⚡</span>
                    <div>
                      <h4>Personalized Pace</h4>
                      <p>Customized lesson plans suited directly to your learning speed and goals.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. SUBJECTS & EDUCATION LEVELS SECTION (tutor_subjects & tutor_education_levels) */}
              <section className="profile-card-section" id="subjects-section">
                <div className="section-header-row">
                  <span className="section-icon">📚</span>
                  <h2>Subjects & Education Levels</h2>
                </div>

                <div className="subjects-content-block">
                  <h4 className="subsection-title">Subjects & Specializations:</h4>
                  <div className="subjects-tags-grid">
                    {Array.isArray(tutor.subjectsTaught) && tutor.subjectsTaught.length > 0 ? (
                      tutor.subjectsTaught.map((subj, idx) => (
                        <div key={idx} className="subject-tag-chip">
                          <span className="check-dot">✓</span>
                          <span>{subj}</span>
                        </div>
                      ))
                    ) : tutor.subject ? (
                      <div className="subject-tag-chip">
                        <span className="check-dot">✓</span>
                        <span>{tutor.subject}</span>
                      </div>
                    ) : (
                      <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No specific subjects listed yet.</p>
                    )}
                  </div>

                  <h4 className="subsection-title mt-4">Target Education Levels:</h4>
                  <div className="levels-badges-row">
                    {Array.isArray(tutor.educationLevels) && tutor.educationLevels.length > 0 ? (
                      tutor.educationLevels.map((lvl, idx) => (
                        <span key={idx} className="level-badge-pill">
                          🎓 {lvl}
                        </span>
                      ))
                    ) : tutor.educationLevel ? (
                      <span className="level-badge-pill">
                        🎓 {tutor.educationLevel}
                      </span>
                    ) : (
                      <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Open to all education levels.</p>
                    )}
                  </div>

                  {/* Tutor Tags */}
                  {Array.isArray(tutor.tags) && tutor.tags.length > 0 && (
                    <>
                      <h4 className="subsection-title mt-4">Focus Topics & Tags:</h4>
                      <div className="levels-badges-row">
                        {tutor.tags.map((tag, idx) => (
                          <span key={idx} className="tag-chip" style={{ background: "#f1f5f9", padding: "0.35rem 0.75rem", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>
                            🏷️ {tag}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* 3. QUALIFICATIONS & EXPERIENCE SECTION (tutor_education & tutor_certifications) */}
              <section className="profile-card-section" id="qualifications-section">
                <div className="section-header-row">
                  <span className="section-icon">🎓</span>
                  <h2>Qualifications & Experience</h2>
                </div>

                {/* Education Timeline */}
                <h4 className="subsection-title">Academic Background:</h4>
                {Array.isArray(tutor.education) && tutor.education.length > 0 ? (
                  <div className="education-timeline">
                    {tutor.education.map((edu, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-body">
                          <h4 className="degree-title">{edu.degree}</h4>
                          <p className="institution-name">{edu.institution}</p>
                          {edu.year && <span className="grad-year">Class of {edu.year}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : tutor.qualification ? (
                  <div className="education-timeline">
                    <div className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-body">
                        <h4 className="degree-title">{tutor.qualification}</h4>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1rem" }}>
                    No degree or academic records listed yet.
                  </p>
                )}

                {/* Certifications */}
                {Array.isArray(tutor.certifications) && tutor.certifications.length > 0 && (
                  <div className="certifications-block">
                    <h4 className="subsection-title">Certifications & Honors:</h4>
                    <ul className="certifications-list">
                      {tutor.certifications.map((cert, idx) => (
                        <li key={idx} className="cert-item">
                          <span className="cert-badge-icon">🏅</span>
                          <span>{cert}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* 4. STUDENT REVIEWS SECTION */}
              <section className="profile-card-section" id="reviews-section">
                <div className="section-header-row">
                  <span className="section-icon">⭐</span>
                  <h2>Student Reviews & Ratings</h2>
                </div>

                {reviewsList.length > 0 ? (
                  <>
                    <div className="reviews-score-card">
                      <div className="score-big-box">
                        <span className="score-num">{ratingScore || "5.0"}</span>
                        <div className="stars-row">★★★★★</div>
                        <span className="score-count">Based on {reviewsCount} review{reviewsCount > 1 ? "s" : ""}</span>
                      </div>

                      <div className="score-breakdown-bars">
                        {[5, 4, 3, 2, 1].map((s) => {
                          const pct = Math.round((starCounts[s] / reviewsList.length) * 100);
                          return (
                            <div key={s} className="bar-row">
                              <span>{s} Stars</span>
                              <div className="bar-track">
                                <div className="bar-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <span>{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="reviews-list">
                      {reviewsList.map((rev) => (
                        <div key={rev.id} className="review-item-card">
                          <div className="review-header">
                            {rev.avatar && (
                              <img
                                src={rev.avatar}
                                alt={rev.studentName}
                                className="reviewer-avatar"
                              />
                            )}
                            <div className="reviewer-info">
                              <h4>{rev.studentName}</h4>
                              <span className="reviewer-grade">{rev.studentGrade}</span>
                            </div>
                            <div className="review-rating-right">
                              <div className="stars-gold">
                                {"★".repeat(Math.round(rev.rating || 5))}
                              </div>
                              <span className="review-date">{rev.date ? new Date(rev.date).toLocaleDateString() : ""}</span>
                            </div>
                          </div>
                          <p className="review-comment">"{rev.comment}"</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "2rem 1rem", textAlign: "center", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                    <p style={{ margin: "0 0 0.4rem", fontSize: "1.1rem", fontWeight: 600, color: "#475569" }}>
                      💬 No student reviews yet
                    </p>
                    <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                      Be the first student to book a class with {tutor.name} and share your experience!
                    </p>
                  </div>
                )}
              </section>

              {/* 5. COURSES TAUGHT BY TUTOR (IF ANY) */}
              {tutorCourses.length > 0 && (
                <section className="profile-card-section" id="courses-section">
                  <div className="section-header-row">
                    <span className="section-icon">📚</span>
                    <h2>Courses by {tutor.name}</h2>
                  </div>

                  <div className="tutor-courses-grid">
                    {tutorCourses.map((crs) => (
                      <div key={crs.id} className="tutor-course-mini-card">
                        <img
                          src={crs.thumbnail}
                          alt={crs.title}
                          className="course-mini-thumb"
                        />
                        <div className="course-mini-body">
                          <h4>{crs.title}</h4>
                          <div className="course-mini-meta">
                            <span>📖 {crs.lessonsCount} lessons</span>
                            <span>⏱ {crs.duration}</span>
                            <span>★ {crs.rating || 5}</span>
                          </div>
                          <div className="course-mini-footer">
                            <span className="course-mini-price">
                              {crs.isFree ? "FREE" : `$${crs.price}`}
                            </span>
                            <button
                              className="view-course-mini-btn"
                              onClick={() => navigate(`/courses/${crs.id}`)}
                            >
                              Explore Course →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ────── RIGHT COLUMN: STICKY BOOKING CARD ────── */}
            <div className="profile-sidebar-col">
              <div className="sticky-booking-widget">
                <div className="booking-widget-header">
                  <span className="widget-price-label">Tuition Fee</span>
                  <div className="widget-price-val">
                    ${tutor.price || tutor.hourlyRate || 25}
                    <span className="widget-unit"> / hour</span>
                  </div>
                  <div className="guarantee-chip">
                    <span>🛡️</span> Verified Abugida Guarantee
                  </div>
                </div>

                {/* Available Time Slots Section */}
                <div className="time-slots-container">
                  <label className="slots-label">
                    <span>📅</span> Select a Day & Available Time Slot:
                  </label>

                  {/* Day Tabs Selector */}
                  <div className="day-selector-pills">
                    {tutor.availableTimeSlots && tutor.availableTimeSlots.length > 0 ? (
                      tutor.availableTimeSlots.map((d, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`day-pill-btn ${selectedDayIndex === idx ? "active" : ""}`}
                          onClick={() => {
                            setSelectedDayIndex(idx);
                            setSelectedSlot(null);
                          }}
                        >
                          <span className="day-name">{d.day.slice(0, 3)}</span>
                          <span className="day-date">{d.date}</span>
                        </button>
                      ))
                    ) : (
                      <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0.5rem 0" }}>
                        No availability has been posted by this tutor.
                      </p>
                    )}
                  </div>

                  {/* Time Slots Grid */}
                  <div className="slots-grid">
                    {currentDaySlots.slots && currentDaySlots.slots.length > 0 ? (
                      currentDaySlots.slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`slot-pill-btn ${selectedSlot === slot ? "selected" : ""}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <span className="slot-clock">🕐</span>
                          <span>{slot}</span>
                        </button>
                      ))
                    ) : (
                      <p className="no-slots-msg" style={{ margin: "0.5rem 0" }}>
                        No available time slots.
                      </p>
                    )}
                  </div>

                  {selectedSlot && (
                    <div className="selected-slot-banner">
                      <span>✓ Selected: </span>
                      <strong>
                        {currentDaySlots.day}, {selectedSlot}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Main Action Buttons */}
                <div className="widget-actions">
                  <button
                    type="button"
                    className="book-primary-btn"
                    onClick={handleBookNow}
                  >
                    <span>📅 Book 1-on-1 Class</span>
                    <span className="btn-subtext">Instant booking confirmation</span>
                  </button>

                  <button
                    type="button"
                    className="view-courses-secondary-btn"
                    onClick={handleViewCourses}
                  >
                    <span>📚 Browse Recorded Courses</span>
                  </button>
                </div>

                {/* Safety & Perks List */}
                <div className="widget-perks-list">
                  <div className="perk-item">
                    <span>✓</span> 100% money-back guarantee on trial lesson
                  </div>
                  <div className="perk-item">
                    <span>✓</span> Reschedule freely up to 12 hours before class
                  </div>
                  <div className="perk-item">
                    <span>✓</span> Local Ethiopian Telebirr & CBE payment support
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default TutorProfile;
