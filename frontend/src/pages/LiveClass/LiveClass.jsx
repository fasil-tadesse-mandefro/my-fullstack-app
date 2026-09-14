import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Layout from "../../layout/Layout";
import Button from "../../components/common/Button";
import { bookingsApi } from "../../lib/api";
import "./LiveClass.css";

function LiveClass() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);

    // 1. Try fetching from live backend API
    bookingsApi
      .getById(bookingId)
      .then((res) => {
        if (res?.booking) {
          setBooking(res.booking);
        } else {
          tryFallbackSources();
        }
      })
      .catch(() => {
        tryFallbackSources();
      })
      .finally(() => {
        setLoading(false);
      });

    // Fallback helper: check localStorage only
    function tryFallbackSources() {
      try {
        const saved = localStorage.getItem("abugida_student_bookings");
        if (saved) {
          const list = JSON.parse(saved);
          const found = list.find((b) => (b.bookingId || b.id) === bookingId);
          if (found) {
            setBooking(found);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to parse localStorage bookings:", e);
      }
    }
  }, [bookingId]);

  if (loading) {
    return (
      <Layout>
        <div className="live-class-not-found container">
          <div className="loading-spinner" style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            ⏳
          </div>
          <h2>Connecting to Live Classroom...</h2>
          <p style={{ color: "var(--text-muted)" }}>Fetching session credentials and meeting room details.</p>
        </div>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout>
        <div className="live-class-not-found container">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h1>Session Not Found</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            We could not find an active or scheduled booking with reference ID <strong>#{bookingId}</strong>.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Button onClick={() => navigate("/student/bookings")}>View My Bookings</Button>
            <Button variant="outline" onClick={() => navigate("/tutors")}>Find Tutors</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const leaveClass = () => navigate("/student/bookings");

  const tutorName = booking.tutorName || "Tutor";
  const tutorAvatar =
    booking.tutorAvatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
  const studentName = booking.studentName || "Student";
  const topic = booking.topic || `${booking.subject || "Academic"} Session`;
  const subject = booking.subject || booking.tutorSubject || "General";
  const sessionType = booking.sessionType || "1-on-1 Live Class";
  const dateStr = booking.date || "Scheduled";
  const timeStr = booking.time || "Session";
  const duration = booking.duration || `${booking.durationMinutes || 60} mins`;

  return (
    <Layout>
      <div className="live-class-page">
        <div className="container">
          <button
            type="button"
            className="live-class-back"
            onClick={() => navigate("/student/bookings")}
          >
            ← Back to My Bookings
          </button>

          <div className="live-class-heading">
            <div>
              <span className="live-status">
                <i /> {hasJoined ? "Connected & In Session" : "Live Tutoring Room Ready"}
              </span>
              <h1>{topic}</h1>
              <p>
                {subject} · {sessionType}
              </p>
            </div>
            <div className="live-class-date">
              <strong>{dateStr}</strong>
              <span>
                {timeStr} · {duration}
              </span>
            </div>
          </div>

          <div className="live-class-layout">
            <main className="live-meeting-column">
              <section className="live-meeting-area">
                {hasJoined ? (
                  <div className="live-meeting-connected">
                    <img src={tutorAvatar} alt={tutorName} />
                    <span className="live-meeting-live">
                      <i /> Live Call
                    </span>
                    <div>
                      <h2>{tutorName}</h2>
                      <p>is presenting in this live session</p>
                    </div>
                  </div>
                ) : (
                  <div className="live-meeting-waiting">
                    <div className="live-camera-icon">▹</div>
                    <h2>Ready to join session?</h2>
                    <p>
                      Your educator <strong>{tutorName}</strong> is ready for your 1-on-1 lesson.
                    </p>
                  </div>
                )}
                <div className="live-meeting-controls">
                  <span>◉ Camera: On</span>
                  <span>◉ Microphone: Active</span>
                  <span>◉ Screen Sharing: Ready</span>
                </div>
              </section>

              <div className="live-primary-actions">
                {!hasJoined ? (
                  <Button size="lg" onClick={() => setHasJoined(true)}>
                    Join Meeting Now
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => setHasJoined(false)}
                  >
                    Mute / Return to Waiting Room
                  </Button>
                )}
                <Button size="lg" variant="outline" onClick={leaveClass}>
                  Leave Class
                </Button>
              </div>

              <p className="live-meeting-link">
                Meeting Room Ref: <span>/live-class/{booking.bookingId || booking.id}</span>
              </p>

              {/* Recorded Course Banner if tutor has published courses */}
              {booking.courseId && (
                <div
                  style={{
                    marginTop: "1.5rem",
                    padding: "1.25rem",
                    background: "linear-gradient(135deg, #eff6ff 0%, #f0fdfa 100%)",
                    border: "1.5px solid #bfdbfe",
                    borderRadius: "var(--radius-lg, 14px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 750, color: "#1e40af", fontSize: "0.95rem" }}>
                      📹 Tutor's Recorded Course & Video Lessons Available
                    </div>
                    <div style={{ fontSize: "0.825rem", color: "#334155", marginTop: "0.25rem" }}>
                      Course: <strong>{booking.courseTitle || "Tutoring Lessons"}</strong>. You have confirmed booking access to watch anytime.
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/courses/${booking.courseId}`)}
                  >
                    Watch Recorded Lessons →
                  </Button>
                </div>
              )}
            </main>

            <aside className="live-session-sidebar">
              {/* Recorded Videos Direct Access Card */}
              {booking.courseId ? (
                <section
                  className="live-info-card"
                  style={{
                    background: "#f0fdfa",
                    border: "1.5px solid #99f6e4",
                  }}
                >
                  <h2 style={{ color: "#0f766e", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>🎬</span> Recorded Videos
                  </h2>
                  <p style={{ fontSize: "0.825rem", color: "#134e4a", margin: "0 0 1rem 0" }}>
                    {tutorName} has recorded lessons for this topic. As a confirmed student, you can watch the recordings on-demand.
                  </p>
                  <Button
                    fullWidth
                    onClick={() => navigate(`/courses/${booking.courseId}`)}
                  >
                    Access Video Lessons
                  </Button>
                </section>
              ) : (
                <section className="live-info-card">
                  <h2>Recorded Lessons</h2>
                  <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: "0 0 0.85rem 0" }}>
                    Browse all available video courses by {tutorName}.
                  </p>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => navigate(`/courses?tutor_id=${booking.tutorId}`)}
                  >
                    Explore Tutor Courses
                  </Button>
                </section>
              )}

              {/* Session Details */}
              <section className="live-info-card">
                <h2>Session Details</h2>
                <dl>
                  <div>
                    <dt>Subject</dt>
                    <dd>{subject}</dd>
                  </div>
                  <div>
                    <dt>Session Format</dt>
                    <dd>{sessionType}</dd>
                  </div>
                  <div>
                    <dt>Date & Time</dt>
                    <dd>
                      {dateStr}, {timeStr}
                    </dd>
                  </div>
                  <div>
                    <dt>Allocated Time</dt>
                    <dd>{duration}</dd>
                  </div>
                  <div>
                    <dt>Booking Status</dt>
                    <dd style={{ textTransform: "capitalize", color: "#10b981" }}>
                      ● {booking.status || "Confirmed"}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* In This Class */}
              <section className="live-people-card">
                <h2>Participants</h2>
                <div className="live-person">
                  <img src={tutorAvatar} alt={tutorName} />
                  <div>
                    <strong>{tutorName}</strong>
                    <span>Expert Tutor</span>
                  </div>
                </div>
                <div className="live-person live-student">
                  <span>{studentName.charAt(0).toUpperCase()}</span>
                  <div>
                    <strong>{studentName}</strong>
                    <span>Student</span>
                  </div>
                </div>
              </section>

              {/* Notes */}
              {booking.notes && (
                <section className="live-notes-card">
                  <h2>Session Notes</h2>
                  <p>{booking.notes}</p>
                </section>
              )}
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default LiveClass;
