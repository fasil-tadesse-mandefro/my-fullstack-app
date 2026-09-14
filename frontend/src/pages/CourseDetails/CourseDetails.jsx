import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../layout/Layout";
import Button from "../../components/common/Button";
import { coursesApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import "./CourseDetails.css";

function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await coursesApi.getById(courseId);
      if (res?.course) {
        setCourseData(res.course);
      } else {
        // Try fallback to getAll
        const allRes = await coursesApi.getAll();
        const list = allRes?.courses || allRes || [];
        const found = list.find((c) => String(c.id) === String(courseId)) || list[0];
        setCourseData(found || null);
      }
    } catch (err) {
      console.warn("Course getById fallback to getAll:", err.message);
      try {
        const allRes = await coursesApi.getAll();
        const list = allRes?.courses || allRes || [];
        const found = list.find((c) => String(c.id) === String(courseId)) || list[0];
        setCourseData(found || null);
      } catch (fallbackErr) {
        setError(fallbackErr.message || "Failed to load course details.");
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const course = courseData;

  const lessons = useMemo(() => {
    if (course?.lessons && Array.isArray(course.lessons) && course.lessons.length > 0) {
      return course.lessons.map((l, idx) => ({
        id: l.id || idx + 1,
        title: l.title || `Lesson ${idx + 1}`,
        duration: l.durationMinutes ? `${l.durationMinutes} min` : "15 min",
        description: l.description || "Video lecture and exercise materials.",
        videoUrl: l.videoUrl || "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      }));
    }
    return [];
  }, [course]);

  if (loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
          <h2>Loading course details...</h2>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="course-not-found container">
          <h1>Course not found</h1>
          <p>{error || "The requested course could not be located."}</p>
          <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
        </div>
      </Layout>
    );
  }

  const progress = lessons.length > 0 ? Math.round((completedLessonIds.length / lessons.length) * 100) : 0;
  const openLesson = (lessonId) => {
    const targetPath = `/courses/${course.id}/lessons/${lessonId || (lessons[0] && lessons[0].id) || 1}`;
    // Frontend-side gate for UX (the backend independently enforces auth +
    // booking/payment access on the lesson content endpoint regardless of
    // this check). Not logged in → send to login and return here afterwards.
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: targetPath } } });
      return;
    }
    navigate(targetPath);
  };

  return (
    <Layout>
      <div className="course-details-page">
        <section className="course-details-hero">
          <div className="container">
            <button className="course-back-link" type="button" onClick={() => navigate("/courses")}>
              ← All courses
            </button>
            <div className="course-details-hero-grid">
              <div>
                <div className="course-details-tags">
                  <span>{course.subject || course.category || "General"}</span>
                  <span>{course.level || "All Levels"}</span>
                </div>
                <h1>{course.title}</h1>
                <p className="course-details-tutor">
                  Created by <strong>{course.tutor || course.tutorName || "Abugida Tutor"}</strong>
                </p>
              </div>
              <img src={course.thumbnail || course.thumbnailUrl} alt="" className="course-details-image" />
            </div>
          </div>
        </section>

        <div className="container course-details-layout">
          <main className="course-details-main">
            <section className="course-description-card">
              <h2>About this course</h2>
              <p>{course.description || "Comprehensive course curriculum designed by qualified educators on Abugida."}</p>
            </section>
            <section className="course-lessons-section">
              <div className="course-section-heading">
                <div>
                  <h2>Course lessons</h2>
                  <p>{lessons.length} recorded lessons</p>
                </div>
                <span>{progress}% complete</span>
              </div>
              <div className="course-progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
              {lessons.length > 0 ? (
                <div className="course-lesson-list">
                  {lessons.map((lesson, index) => {
                    const completed = completedLessonIds.includes(lesson.id);
                    return (
                      <button
                        type="button"
                        className="course-lesson-row"
                        key={lesson.id}
                        onClick={() => openLesson(lesson.id)}
                      >
                        <span className={`course-lesson-number ${completed ? "completed" : ""}`}>
                          {completed ? "✓" : index + 1}
                        </span>
                        <span className="course-lesson-copy">
                          <strong>{lesson.title}</strong>
                          <small>
                            {lesson.duration} · {lesson.description}
                          </small>
                        </span>
                        <span className="course-lesson-action">Watch</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#64748b" }}>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "1.05rem", fontWeight: 600 }}>No video lessons available yet</p>
                  <p style={{ margin: 0, fontSize: "0.88rem" }}>The educator is currently preparing the lesson recordings and materials for this course.</p>
                </div>
              )}
            </section>
          </main>

          <aside className="course-details-sidebar">
            <div className="course-summary-card">
              <div className="course-price-label">Course price</div>
              <div className={`course-summary-price ${course.isFree ? "free" : ""}`}>
                {course.isFree ? "Free" : `$${course.price}`}
              </div>
              <Button fullWidth onClick={() => openLesson(lessons[0]?.id)}>
                Start Learning
              </Button>
              <dl className="course-summary-meta">
                <div>
                  <dt>Subject</dt>
                  <dd>{course.subject || course.category || "General"}</dd>
                </div>
                <div>
                  <dt>Education level</dt>
                  <dd>{course.level || "All Levels"}</dd>
                </div>
                <div>
                  <dt>Lessons</dt>
                  <dd>{course.lessonsCount || lessons.length} lessons</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{course.duration || (course.durationMinutes ? `${Math.round(course.durationMinutes / 60)} hours` : "Self-paced")}</dd>
                </div>
              </dl>
            </div>
            <div className="course-tutor-card">
              <span className="course-tutor-avatar">
                {(course.tutor || course.tutorName || "T").charAt(0)}
              </span>
              <div>
                <span>Course tutor</span>
                <h2>{course.tutor || course.tutorName}</h2>
                <p>Experienced {course.subject || course.category || "Abugida"} educator</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

export default CourseDetails;
