import { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { coursesApi } from "../../lib/api";
import "./TutorCourses.css";

function TutorCourses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tutorId = user?.id || "usr-tutor-01";

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await coursesApi.getAll({ tutor_id: tutorId });
      if (res?.success && Array.isArray(res.courses)) {
        setCourses(res.courses);
      }
    } catch (err) {
      console.error("Failed to fetch tutor courses:", err);
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const summary = useMemo(() => {
    const published = courses.filter((course) => course.status === "Published").length;
    const draft = courses.filter((course) => course.status === "Draft").length;
    const pending = courses.filter((course) => course.status === "Pending Review").length;
    return { total: courses.length, published, draft, pending };
  }, [courses]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError("");
    setActionSuccess("");
    try {
      const res = await coursesApi.delete(deleteTarget.id);
      if (res?.success) {
        setActionSuccess(`✓ Course "${deleteTarget.title}" deleted successfully.`);
        setCourses((current) => current.filter((course) => course.id !== deleteTarget.id));
      } else {
        setActionError(res?.message || "Failed to delete course.");
      }
    } catch (err) {
      setActionError(err.message || "An error occurred while deleting the course.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const viewCourse = (course) => {
    if (course.catalogId || course.catalogCourseId) {
      navigate(`/courses/${course.catalogId || course.catalogCourseId}`);
      return;
    }
    navigate(`/courses/${course.id}`);
  };

  return (
    <Layout>
      <main className="tutor-courses-page">
        <div className="container tutor-courses-container">
          <div className="courses-heading">
            <div>
              <p className="courses-kicker">Tutor workspace</p>
              <h1>My courses</h1>
              <p>View, edit, and manage the courses you have uploaded for students.</p>
            </div>
            <div className="courses-heading-actions">
              <Link to="/tutor/dashboard" className="courses-back">
                Back to dashboard
              </Link>
              <button
                type="button"
                className="add-course-button"
                onClick={() => navigate("/tutor/courses/upload")}
              >
                + Add New Course
              </button>
            </div>
          </div>

          {actionSuccess && (
            <div className="auth-alert auth-alert-success" style={{ marginBottom: "1rem" }}>
              <span>✓</span>
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="auth-alert auth-alert-error" style={{ marginBottom: "1rem" }}>
              <span>⚠️</span>
              <span>{actionError}</span>
            </div>
          )}

          <section className="courses-summary" aria-label="Course summary">
            <article>
              <strong>{summary.total}</strong>
              <span>Total courses</span>
            </article>
            <article>
              <strong>{summary.published}</strong>
              <span>Published</span>
            </article>
            <article>
              <strong>{summary.pending}</strong>
              <span>Pending review</span>
            </article>
            <article>
              <strong>{summary.draft}</strong>
              <span>Drafts</span>
            </article>
          </section>

          <section className="courses-list-card">
            <div className="courses-list-heading">
              <div>
                <p className="courses-kicker">Course list</p>
                <h2>
                  {loading
                    ? "Loading courses..."
                    : courses.length
                    ? `${courses.length} course${courses.length > 1 ? "s" : ""}`
                    : "No courses yet"}
                </h2>
              </div>
              <span className="courses-note">Published courses are visible to students</span>
            </div>

            {loading ? (
              <div className="courses-empty">
                <p>Loading your courses from database...</p>
              </div>
            ) : courses.length ? (
              <>
                <div className="courses-table-head" aria-hidden="true">
                  <span>Course</span>
                  <span>Level</span>
                  <span>Lessons</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                <div className="courses-table-body">
                  {courses.map((course) => (
                    <article className="tutor-course-row" key={course.id}>
                      <div className="course-title-cell">
                        <img
                          src={
                            course.thumbnail ||
                            course.thumbnailUrl ||
                            "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80"
                          }
                          alt=""
                        />
                        <div>
                          <h3>{course.title}</h3>
                          <span>Updated {course.updatedAt || "Recently"}</span>
                        </div>
                      </div>
                      <div className="course-subject-cell">
                        <p>Level</p>
                        <strong>{course.level || "Preparatory"}</strong>
                      </div>
                      <div className="course-lessons-cell">
                        <p>Lessons</p>
                        <strong>{course.lessonsCount || 1}</strong>
                      </div>
                      <div className="course-status-cell">
                        <p>Status</p>
                        <span
                          className={`course-status-pill ${(course.status || "published")
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {course.status || "Published"}
                        </span>
                      </div>
                      <div className="course-actions-cell">
                        <button
                          type="button"
                          className="view-button"
                          onClick={() => viewCourse(course)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => navigate(`/tutor/courses/upload?edit=${course.id}`)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => setDeleteTarget(course)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="courses-empty">
                <h3>No courses uploaded yet</h3>
                <p>Create your first course to start teaching students on Abugida.</p>
                <button
                  type="button"
                  className="add-course-button"
                  onClick={() => navigate("/tutor/courses/upload")}
                >
                  Add New Course
                </button>
              </div>
            )}
          </section>
        </div>

        {deleteTarget && (
          <div
            className="courses-modal-backdrop"
            role="presentation"
            onClick={() => setDeleteTarget(null)}
          >
            <div
              className="courses-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-course-title"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 id="delete-course-title">Delete course?</h3>
              <p>
                Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This action
                will remove all associated lessons and cannot be undone.
              </p>
              <div className="courses-modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="confirm-delete-button"
                  onClick={handleDelete}
                >
                  Delete course
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}

export default TutorCourses;
