import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../../layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { tutorsApi } from "../../lib/api";
import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const studentName = user?.name || "Nahom Tadesse";
  const gradeLevel = user?.gradeLevel || "Grade 11 (Natural Science)";
  const avatar =
    user?.avatar ||
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80";

  // Placeholder data — matching exactly the shape the JSX template expects
  const stats = [
    { icon: "📅", label: "Total Sessions", value: "0", subtext: "Tutoring sessions booked", colorClass: "blue" },
    { icon: "⏱️", label: "Hours Learned", value: "0h", subtext: "Total study time", colorClass: "green" },
    { icon: "📚", label: "Courses Enrolled", value: "0", subtext: "Self-paced courses", colorClass: "purple" },
    { icon: "⭐", label: "Avg. Rating Given", value: "—", subtext: "Your tutor feedback", colorClass: "orange" },
  ];
  const upcomingSessions = [];
  const coursesInProgress = [];
  const learningSummary = {
    completedHours: 0,
    weeklyGoalHours: 5,
    subjects: [],
    weeklyActivity: [
      { day: "Mon", hours: 0 },
      { day: "Tue", hours: 0 },
      { day: "Wed", hours: 0 },
      { day: "Thu", hours: 0 },
      { day: "Fri", hours: 0 },
      { day: "Sat", hours: 0 },
      { day: "Sun", hours: 0 },
    ],
    achievements: [
      { icon: "🎓", value: "0", label: "Sessions" },
      { icon: "⏱️", value: "0h", label: "Learned" },
      { icon: "🔥", value: "0", label: "Day Streak" },
      { icon: "✅", value: "0", label: "Completed" },
    ],
  };

  // Live API data for Recommended Tutors
  const [recommendedTutors, setRecommendedTutors] = useState([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const [tutorsError, setTutorsError] = useState(null);

  useEffect(() => {
    setTutorsLoading(true);
    setTutorsError(null);
    tutorsApi
      .getAll()
      .then((res) => {
        const list = res?.tutors || res || [];
        // Show top 3 highest-rated tutors
        const top3 = Array.isArray(list)
          ? [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3)
          : [];
        setRecommendedTutors(top3);
      })
      .catch((err) => {
        console.error("Failed to load recommended tutors:", err);
        setTutorsError("Could not load tutors.");
      })
      .finally(() => setTutorsLoading(false));
  }, []);

  const weeklyPct = Math.round(
    (learningSummary.completedHours / learningSummary.weeklyGoalHours) * 100
  );
  const maxBarHours = Math.max(
    ...learningSummary.weeklyActivity.map((d) => d.hours),
    1
  );

  return (
    <Layout>
      <div className="student-dashboard-page">
        {/* Welcome Hero Banner */}
        <section className="dashboard-hero">
          <div className="container dashboard-hero-content">
            {/* Student Profile Summary */}
            <div className="student-profile-summary">
              <div className="avatar-wrapper">
                <img
                  src={avatar}
                  alt={studentName}
                  className="student-avatar"
                />
                <span className="avatar-status-dot" title="Online" />
              </div>
              <div className="student-title-block">
                <p className="hero-greeting">Good day 👋</p>
                <h1>Welcome back, {studentName}! 🎓</h1>
                <div className="student-meta-badges">
                  <span className="meta-badge">{gradeLevel}</span>
                  <span className="meta-badge">✦ Active Student</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="hero-quick-actions">
              <button
                id="btn-find-tutor"
                className="hero-btn-primary"
                onClick={() => navigate("/tutors")}
              >
                <span>🔍</span> Find a Tutor
              </button>
              <button
                id="btn-my-bookings"
                className="hero-btn-secondary"
                onClick={() => navigate("/student/bookings")}
              >
                <span>📅</span> My Bookings
              </button>
              <button
                id="btn-my-courses"
                className="hero-btn-secondary"
                onClick={() => navigate("/courses")}
              >
                <span>📚</span> My Courses
              </button>
            </div>
          </div>
        </section>

        <div className="container">
          {/* Key Metrics Row */}
          <div className="dashboard-metrics-container">
            <div className="metrics-grid-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="metric-card">
                  <div className={`metric-icon-box ${stat.colorClass}`}>
                    {stat.icon}
                  </div>
                  <div className="metric-details">
                    <span className="metric-label">{stat.label}</span>
                    <span className="metric-value">{stat.value}</span>
                    <span className="metric-subtext">{stat.subtext}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main 2-Column Dashboard Grid */}
          <div className="dashboard-grid-layout">
            {/* Left Column */}
            <div className="dashboard-left-col">
              {/* Upcoming Booking Card */}
              <div className="dashboard-card" id="upcoming-bookings-card">
                <div className="dashboard-card-header">
                  <h3 className="card-header-title">
                    <span>🗓️</span> Upcoming Bookings
                  </h3>
                  <Link to="/student/bookings" className="card-header-link">
                    View All Bookings →
                  </Link>
                </div>

                <div className="upcoming-sessions-list">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`session-item ${session.isLiveSoon ? "live-now" : ""}`}
                    >
                      <div className="session-left-info">
                        <div className="session-date-box">
                          <div className="session-date-month">
                            {session.month}
                          </div>
                          <div className="session-date-day">{session.day}</div>
                        </div>
                        <div className="session-text">
                          <h4>{session.subject}</h4>
                          <div className="session-tutor-meta">
                            <span>👨‍🏫 {session.tutorName}</span>
                            <span>•</span>
                            <span>{session.tutorRole}</span>
                          </div>
                          {session.time && (
                            <span className="session-time-badge">🕐 {session.time}</span>
                          )}
                        </div>
                      </div>

                      <button
                        className={`session-join-btn ${session.isLiveSoon ? "pulse" : ""}`}
                        onClick={() =>
                          navigate(`/live-class/${session.bookingId}`)
                        }
                      >
                        {session.isLiveSoon ? "🔴 Join Live Class" : "Session Details"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recently Accessed Courses */}
              <div className="dashboard-card" id="recent-courses-card">
                <div className="dashboard-card-header">
                  <h3 className="card-header-title">
                    <span>📖</span> Recently Accessed Courses
                  </h3>
                  <Link to="/courses" className="card-header-link">
                    Browse Catalog →
                  </Link>
                </div>

                <div className="enrolled-courses-grid">
                  {coursesInProgress.map((course) => (
                    <div key={course.id} className="enrolled-course-card">
                      <div className="course-thumb-wrapper">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="course-card-thumb"
                        />
                        <span className="course-last-accessed">
                          🕒 {course.lastAccessed}
                        </span>
                      </div>
                      <div className="course-card-body">
                        <h4>{course.title}</h4>
                        <span className="course-instructor">
                          By {course.instructor}
                        </span>
                        <span className="course-lessons-count">
                          {course.lessonsCount}
                        </span>

                        <div className="course-progress-wrapper">
                          <div className="progress-header">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                          <button
                            className="resume-course-btn"
                            onClick={() =>
                              navigate(`/courses/${course.id}/lessons/les-01`)
                            }
                          >
                            Resume Lesson →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Tutors Section */}
              <div className="dashboard-card" id="recommended-tutors-card">
                <div className="dashboard-card-header">
                  <h3 className="card-header-title">
                    <span>⭐</span> Recommended Tutors
                  </h3>
                  <Link to="/tutors" className="card-header-link">
                    Browse All →
                  </Link>
                </div>

                <div className="recommended-tutors-list">
                  {tutorsLoading ? (
                    /* Skeleton rows */
                    [1, 2, 3].map((n) => (
                      <div key={n} className="recommended-tutor-card" style={{ opacity: 0.6 }}>
                        <div className="rec-tutor-avatar" style={{ background: "var(--bg-muted, #e5e7eb)", borderRadius: "50%", flexShrink: 0 }} />
                        <div className="rec-tutor-info" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div style={{ height: 14, width: "55%", borderRadius: 4, background: "var(--bg-muted, #e5e7eb)" }} />
                          <div style={{ height: 11, width: "75%", borderRadius: 4, background: "var(--bg-muted, #e5e7eb)" }} />
                          <div style={{ height: 10, width: "40%", borderRadius: 4, background: "var(--bg-muted, #e5e7eb)" }} />
                        </div>
                      </div>
                    ))
                  ) : tutorsError ? (
                    <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)" }}>
                      <p>⚠️ {tutorsError}</p>
                    </div>
                  ) : recommendedTutors.length === 0 ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                      <p>No tutors available right now.</p>
                    </div>
                  ) : (
                    recommendedTutors.map((tutor) => {
                      // Normalise field names from API response
                      const tutorAvatar = tutor.avatar || tutor.avatarUrl ||
                        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80";
                      const tutorSubject = tutor.subject || tutor.subjectSummary || "";
                      const tutorTags = Array.isArray(tutor.tags)
                        ? tutor.tags
                        : tutor.subjectsTaught?.slice(0, 3) || [];
                      const tutorSessions = tutor.sessions ?? tutor.reviewsCount ?? 0;
                      const tutorRate = tutor.rate ?? tutor.price ?? tutor.hourlyRate ?? 0;
                      const tutorReviews = tutor.reviews ?? tutor.reviewsCount ?? 0;

                      return (
                        <div key={tutor.id} className="recommended-tutor-card">
                          <img
                            src={tutorAvatar}
                            alt={tutor.name}
                            className="rec-tutor-avatar"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80";
                            }}
                          />
                          <div className="rec-tutor-info">
                            <div className="rec-tutor-name-row">
                              <h4>{tutor.name}</h4>
                              <span className="rec-tutor-rating">
                                ★ {Number(tutor.rating || 0).toFixed(1)}
                                <span className="rec-tutor-reviews">({tutorReviews})</span>
                              </span>
                            </div>
                            <p className="rec-tutor-subject">{tutorSubject}</p>
                            {tutorTags.length > 0 && (
                              <div className="rec-tutor-tags">
                                {tutorTags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="rec-tutor-tag">{tag}</span>
                                ))}
                              </div>
                            )}
                            <div className="rec-tutor-meta-row">
                              <span className="rec-tutor-sessions">
                                🎓 {tutorSessions} sessions
                              </span>
                              <span className="rec-tutor-rate">${tutorRate}/hr</span>
                            </div>
                          </div>
                          <button
                            className="rec-book-btn"
                            onClick={() => navigate(`/booking/${tutor.id}`)}
                          >
                            Book Now
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Quick Actions & Widgets */}
            <div className="dashboard-right-col">
              {/* Quick Action Tiles */}
              <div className="dashboard-card" id="quick-actions-card">
                <div className="dashboard-card-header">
                  <h3 className="card-header-title">
                    <span>⚡</span> Quick Actions
                  </h3>
                </div>

                <div className="sidebar-actions-grid">
                  <div
                    className="sidebar-action-tile"
                    id="tile-find-tutor"
                    onClick={() => navigate("/tutors")}
                  >
                    <span className="tile-icon">👨‍🏫</span>
                    <span className="tile-label">Find Tutors</span>
                  </div>

                  <div
                    className="sidebar-action-tile"
                    id="tile-my-bookings"
                    onClick={() => navigate("/student/bookings")}
                  >
                    <span className="tile-icon">📅</span>
                    <span className="tile-label">My Bookings</span>
                  </div>

                  <div
                    className="sidebar-action-tile"
                    id="tile-my-courses"
                    onClick={() => navigate("/courses")}
                  >
                    <span className="tile-icon">📚</span>
                    <span className="tile-label">My Courses</span>
                  </div>

                  <div
                    className="sidebar-action-tile"
                    id="tile-my-profile"
                    onClick={() => navigate("/student/profile")}
                  >
                    <span className="tile-icon">👤</span>
                    <span className="tile-label">My Profile</span>
                  </div>
                </div>
              </div>


              {/* Learning Summary */}
              <div className="dashboard-card" id="learning-summary-card">
                <div className="dashboard-card-header">
                  <h3 className="card-header-title">
                    <span>📊</span> Learning Summary
                  </h3>
                  <span className="card-header-badge">This Week</span>
                </div>

                {/* Weekly Goal Ring */}
                <div className="weekly-goal-section">
                  <div className="goal-ring-wrapper">
                    <svg className="goal-ring-svg" viewBox="0 0 80 80">
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke="var(--border-color)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 34}`}
                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - weeklyPct / 100)
                          }`}
                        transform="rotate(-90 40 40)"
                        className="goal-ring-fill"
                      />
                    </svg>
                    <div className="goal-ring-label">
                      <span className="goal-ring-pct">{weeklyPct}%</span>
                      <span className="goal-ring-sub">of goal</span>
                    </div>
                  </div>
                  <div className="goal-text-info">
                    <h4>Weekly Study Goal</h4>
                    <p>
                      <strong>{learningSummary.completedHours}h</strong> of{" "}
                      {learningSummary.weeklyGoalHours}h completed
                    </p>
                    <div className="goal-subject-bars">
                      {learningSummary.subjects.map((s) => (
                        <div key={s.name} className="subject-bar-row">
                          <span
                            className="subject-dot"
                            style={{ background: s.color }}
                          />
                          <span className="subject-bar-name">{s.name}</span>
                          <div className="subject-bar-track">
                            <div
                              className="subject-bar-fill"
                              style={{ width: `${s.pct}%`, background: s.color }}
                            />
                          </div>
                          <span className="subject-bar-hrs">{s.hours}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Daily Activity Bars */}
                <div className="activity-bars-section">
                  <p className="activity-bars-title">Daily Activity (hrs)</p>
                  <div className="activity-bars-row">
                    {learningSummary.weeklyActivity.map((d) => (
                      <div key={d.day} className="activity-bar-col">
                        <div className="activity-bar-track">
                          <div
                            className="activity-bar-fill"
                            style={{
                              height: `${(d.hours / maxBarHours) * 100}%`,
                              opacity: d.hours > 0 ? 1 : 0.2,
                            }}
                            title={`${d.day}: ${d.hours}h`}
                          />
                        </div>
                        <span className="activity-bar-day">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievement Chips */}
                <div className="achievements-grid">
                  {learningSummary.achievements.map((a) => (
                    <div key={a.label} className="achievement-chip">
                      <span className="achievement-icon">{a.icon}</span>
                      <span className="achievement-value">{a.value}</span>
                      <span className="achievement-label">{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Streak */}
              <div className="streak-widget">
                <div className="streak-flame">🔥</div>
                <div className="streak-text">
                  <h4>5-Day Study Streak!</h4>
                  <p>Keep up the great work! Complete 1 more lesson to hit your weekly goal.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default StudentDashboard;
