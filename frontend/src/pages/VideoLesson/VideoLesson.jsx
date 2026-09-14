import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Layout from "../../layout/Layout";
import Button from "../../components/common/Button";
import { coursesApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import "./VideoLesson.css";

// Format durationMinutes → human readable e.g. "28 min"
function formatDuration(mins) {
  if (!mins) return "";
  const m = Number(mins);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
  }
  return `${m} min`;
}

function VideoLesson() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(null); // { message, accessStatus, tutorId }
  const [completedLessonIds, setCompletedLessonIds] = useState([]);

  // Not logged in → require Login/Sign In, then return here after auth.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
    }
  }, [authLoading, isAuthenticated, navigate, location]);

  useEffect(() => {
    if (!courseId || !isAuthenticated) return;
    setLoading(true);
    setError(null);
    setAccessDenied(null);
    // Protected endpoint: backend verifies auth + booking/payment access
    // before returning lesson video content — this cannot be bypassed by
    // opening a lesson URL directly.
    coursesApi
      .getForLearning(courseId)
      .then((res) => {
        setCourse(res?.course || res || null);
      })
      .catch((err) => {
        if (err.status === 401) {
          navigate("/login", { state: { from: location } });
          return;
        }
        if (err.status === 403) {
          const denial = {
            message: err.data?.message || "You don't have access to this course yet.",
            accessStatus: err.data?.accessStatus,
            tutorId: err.data?.tutorId,
          };
          if (denial.accessStatus === "no_booking" && denial.tutorId) {
            navigate(`/booking/${denial.tutorId}?courseId=${encodeURIComponent(courseId)}`, {
              state: { fromCourse: courseId },
            });
            return;
          }
          setAccessDenied(denial);
          return;
        }
        console.error("VideoLesson: Failed to load course:", err);
        setError(err.message || "Failed to load course.");
      })
      .finally(() => setLoading(false));
  }, [courseId, isAuthenticated, navigate, location]);

  // Lessons from API (already ordered by lesson_number)
  const lessons = useMemo(() => {
    if (!course?.lessons) return [];
    return course.lessons.map((l) => ({
      ...l,
      duration: formatDuration(l.durationMinutes),
      // Fallback demo video when no real URL is stored
      videoUrl:
        l.videoUrl ||
        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    }));
  }, [course]);

  const activeIndex = useMemo(() => {
    if (!lessonId) return 0;
    const idx = lessons.findIndex((l) => String(l.id) === String(lessonId));
    return idx >= 0 ? idx : 0;
  }, [lessons, lessonId]);

  const activeLesson = lessons[activeIndex] || lessons[0];

  const progress =
    lessons.length > 0
      ? Math.round((completedLessonIds.length / lessons.length) * 100)
      : 0;

  const goToLesson = (index) => {
    if (lessons[index]) {
      navigate(`/courses/${courseId}/lessons/${lessons[index].id}`);
    }
  };

  const isCompleted = activeLesson
    ? completedLessonIds.includes(activeLesson.id)
    : false;

  const markCompleted = () => {
    if (!activeLesson) return;
    setCompletedLessonIds((ids) =>
      isCompleted
        ? ids.filter((id) => id !== activeLesson.id)
        : [...ids, activeLesson.id]
    );
  };

  if (authLoading || !isAuthenticated || loading) {
    return (
      <Layout>
        <div className="video-lesson-page">
          <div className="container" style={{ paddingTop: "4rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
            <p>Loading lesson…</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (accessDenied) {
    return (
      <Layout>
        <div className="course-not-found container">
          <h1>Course Access Required</h1>
          <p>{accessDenied.message}</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1rem" }}>
            {accessDenied.accessStatus === "no_booking" && accessDenied.tutorId ? (
              <Button onClick={() => navigate(`/booking/${accessDenied.tutorId}`)}>
                Book This Tutor
              </Button>
            ) : (
              <Button onClick={() => navigate("/student/bookings")}>View My Bookings</Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>
              Back to Course
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !course || !activeLesson) {
    return (
      <Layout>
        <div className="course-not-found container">
          <h1>{error ? "Error Loading Lesson" : "Lesson not found"}</h1>
          {error && <p style={{ color: "var(--color-error, #ef4444)" }}>{error}</p>}
          <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="video-lesson-page">
        <div className="container">
          <button
            className="video-back-link"
            type="button"
            onClick={() => navigate(`/courses/${courseId}`)}
          >
            ← Back to course
          </button>
          <div className="video-lesson-layout">
            {/* ── MAIN VIDEO AREA ── */}
            <main className="video-lesson-main">
              <div className="video-player-wrap">
                <video
                  controls
                  poster={course.thumbnail || course.thumbnailUrl}
                  src={
                    activeLesson.videoUrl &&
                      (activeLesson.videoUrl.startsWith("http") || activeLesson.videoUrl.startsWith("/"))
                      ? activeLesson.videoUrl
                      : undefined
                  }
                  key={activeLesson.id}
                >
                  <track kind="captions" />
                  {/* If no valid URL, show a friendly message inside the video element */}
                  {(!activeLesson.videoUrl ||
                    (!activeLesson.videoUrl.startsWith("http") && !activeLesson.videoUrl.startsWith("/"))) && (
                      <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                        Video not available.
                      </p>
                    )}
                </video>
              </div>
              {/* Show informational banner only when the URL is genuinely playable */}
              {activeLesson.videoUrl &&
                (activeLesson.videoUrl.startsWith("http") || activeLesson.videoUrl.startsWith("/")) ? (
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem", background: "var(--bg-subtle, #f0fdf4)", padding: "0.45rem 0.75rem", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                  🎬 Streaming lesson video
                </div>
              ) : activeLesson.videoUrl ? (
                <div style={{ fontSize: "0.8rem", color: "#92400e", marginTop: "0.5rem", background: "#fffbeb", padding: "0.45rem 0.75rem", borderRadius: "6px", border: "1px solid #fde68a" }}>
                  ⚠️ This lesson's video has not been uploaded yet. Please contact your tutor.
                </div>
              ) : null}
              <div className="video-lesson-copy">
                <p className="video-lesson-eyebrow">{course.title}</p>
                <h1>{activeLesson.title}</h1>
                <p>{activeLesson.description}</p>
              </div>
              <div className="video-lesson-actions">
                <Button
                  variant="outline"
                  disabled={activeIndex === 0}
                  onClick={() => goToLesson(activeIndex - 1)}
                >
                  ← Previous Lesson
                </Button>
                <Button
                  variant={isCompleted ? "outline" : "primary"}
                  onClick={markCompleted}
                >
                  {isCompleted ? "Completed ✓" : "Mark as Completed"}
                </Button>
                <Button
                  variant="outline"
                  disabled={activeIndex === lessons.length - 1}
                  onClick={() => goToLesson(activeIndex + 1)}
                >
                  Next Lesson →
                </Button>
              </div>
            </main>

            {/* ── LESSON SIDEBAR ── */}
            <aside className="video-course-panel">
              <div className="video-course-panel-header">
                <div>
                  <span>Course progress</span>
                  <strong>{progress}% complete</strong>
                </div>
                <div className="video-progress-track">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="video-lesson-list">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => goToLesson(index)}
                    className={`video-lesson-item ${lesson.id === activeLesson.id ? "active" : ""
                      }`}
                  >
                    <span
                      className={completedLessonIds.includes(lesson.id) ? "done" : ""}
                    >
                      {completedLessonIds.includes(lesson.id) ? "✓" : index + 1}
                    </span>
                    <div>
                      <strong>{lesson.title}</strong>
                      <small>{lesson.duration}</small>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default VideoLesson;
