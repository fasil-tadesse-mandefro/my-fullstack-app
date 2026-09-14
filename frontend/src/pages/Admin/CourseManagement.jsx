import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import { coursesApi } from "../../lib/api";
import "./CourseManagement.css";

function CourseManagement() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await coursesApi.getAll();
      const list = response?.courses || response || [];
      setCourses(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load courses:", err);
      setError(err.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await coursesApi.delete(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      alert(`Failed to delete course: ${err.message}`);
    }
  };

  const handleApprove = async (courseId) => {
    try {
      await coursesApi.updateStatus(courseId, "Published");
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: "Published" } : c))
      );
    } catch (err) {
      alert(`Failed to approve course: ${err.message}`);
    }
  };

  const handleReject = async (courseId) => {
    try {
      await coursesApi.updateStatus(courseId, "Draft");
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: "Draft" } : c))
      );
    } catch (err) {
      alert(`Failed to reject course: ${err.message}`);
    }
  };

  const handleView = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const filteredCourses = courses.filter((course) => {
    const tutorName =
      typeof course.tutor === "object"
        ? course.tutor?.name || ""
        : course.tutor || "";
    const matchesSearch =
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject =
      subjectFilter === "All" ||
      (course.subject || course.category || "")
        .toLowerCase()
        .includes(subjectFilter.toLowerCase());

    return matchesSearch && matchesSubject;
  });

  const statusClass = (status) => {
    if (!status) return "status-pill";
    const s = status.toLowerCase();
    if (s === "published") return "status-pill active";
    if (s === "draft") return "status-pill inactive";
    return "status-pill pending";
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>Course Management</h1>
          <p>Review, approve, and manage courses uploaded by tutors.</p>
        </div>
      </div>

      <div className="admin-filters-bar">
        <input
          type="text"
          placeholder="Search by course title or tutor name..."
          className="admin-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="admin-filter-select"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          <option value="All">All Subjects</option>
          <option value="mathematics">Mathematics</option>
          <option value="physics">Physics</option>
          <option value="computer science">Computer Science</option>
          <option value="biology">Biology</option>
          <option value="english">English</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-table-container card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Tutor</th>
                <th>Subject</th>
                <th>Stats</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((n) => (
                <tr key={n}>
                  <td colSpan="6" style={{ padding: "1rem" }}>
                    <div
                      style={{
                        height: "24px",
                        background: "var(--color-skeleton, #e5e7eb)",
                        borderRadius: "4px",
                        animation: "shimmer 1.5s infinite",
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-error, #ef4444)" }}>
          <p>⚠️ {error}</p>
          <button className="btn btn-primary" onClick={fetchCourses}>
            Try Again
          </button>
        </div>
      ) : (
        <div className="admin-table-container card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Tutor</th>
                <th>Subject</th>
                <th>Stats</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => {
                  const tutorName =
                    typeof course.tutor === "object"
                      ? course.tutor?.name || "—"
                      : course.tutor || "—";
                  const tutorRating =
                    typeof course.tutor === "object"
                      ? course.tutor?.rating
                      : null;
                  const lessonCount =
                    course.lessons_count ?? course.lessonsCount ?? course.lessons ?? 0;
                  const subjectLabel =
                    course.subject || course.category || "—";
                  const price = Number(course.price ?? 0);

                  return (
                    <tr key={course.id}>
                      <td>
                        <div className="table-course-cell">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="table-course-thumb"
                            />
                          ) : (
                            <div
                              className="table-course-thumb"
                              style={{
                                background: "var(--color-skeleton, #e5e7eb)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.5rem",
                              }}
                            >
                              📚
                            </div>
                          )}
                          <div className="table-course-info">
                            <strong>{course.title}</strong>
                            <span className="text-muted">{lessonCount} Lessons</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="table-tutor-cell">
                          <span>{tutorName}</span>
                          {tutorRating && (
                            <span className="text-muted">⭐ {tutorRating}</span>
                          )}
                        </div>
                      </td>
                      <td>{subjectLabel}</td>
                      <td>
                        <div className="table-stats-cell">
                          <span>{price > 0 ? `$${price}` : "Free"}</span>
                          <span className="text-muted">
                            {course.studentsEnrolled ?? course.students_enrolled ?? 0} enrolled
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={statusClass(course.status)}>
                          {course.status || "Draft"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-btns">
                          <button
                            className="btn-icon"
                            onClick={() => handleView(course.id)}
                            title="View Course"
                          >
                            👁️
                          </button>
                          <button
                            className="btn-icon success"
                            onClick={() => handleApprove(course.id)}
                            title="Publish"
                          >
                            ✅
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleReject(course.id)}
                            title="Set to Draft"
                          >
                            ❌
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => handleDelete(course.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-table-state">
                    No courses found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export default CourseManagement;
