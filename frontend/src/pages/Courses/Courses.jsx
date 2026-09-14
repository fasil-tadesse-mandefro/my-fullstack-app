import { useMemo, useState, useEffect, useCallback } from "react";
import Layout from "../../layout/Layout";
import CourseCard from "../../components/common/CourseCard";
import { coursesApi } from "../../lib/api";
import "./Courses.css";

const INITIAL_VISIBLE_COURSES = 6;
const LOAD_MORE_COUNT = 6;

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await coursesApi.getAll();
      const list = response?.courses || response || [];
      setCourses(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load courses:", err);
      setError(err.message || "Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COURSES);

  const educationLevels = useMemo(
    () => ["All", ...new Set(courses.map((course) => course.level).filter(Boolean))],
    [courses]
  );
  const subjects = useMemo(
    () => ["All", ...new Set(courses.map((course) => course.subject || course.category).filter(Boolean))],
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesSearch =
        !query ||
        [course.title, course.tutor, course.subject, course.category, course.level].some((value) =>
          value?.toLowerCase().includes(query)
        );
      const matchesLevel = selectedLevel === "All" || course.level === selectedLevel;
      const matchesSubject =
        selectedSubject === "All" ||
        course.subject === selectedSubject ||
        course.category === selectedSubject;

      return matchesSearch && matchesLevel && matchesSubject;
    });
  }, [courses, searchQuery, selectedLevel, selectedSubject]);

  const displayedCourses = filteredCourses.slice(0, visibleCount);
  const hasMoreCourses = visibleCount < filteredCourses.length;
  const resetVisibleCourses = () => setVisibleCount(INITIAL_VISIBLE_COURSES);
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedLevel("All");
    setSelectedSubject("All");
    resetVisibleCourses();
  };

  return (
    <Layout>
      <div className="courses-page">
        <section className="courses-hero">
          <div className="container courses-hero-content">
            <span className="section-badge">Self-Paced Learning</span>
            <h1>Explore Courses</h1>
            <p>Learn from trusted tutors with recorded lessons designed to help you grow at your own pace.</p>
            <div className="courses-search-wrapper">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="courses-search-icon">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  resetVisibleCourses();
                }}
                placeholder="Search courses, subjects, or tutors"
                aria-label="Search courses"
              />
            </div>
          </div>
        </section>

        <section className="courses-content">
          <div className="container">
            <div className="courses-filter-panel">
              <div className="courses-filter-heading">
                <div>
                  <h2>Find the right course</h2>
                  <p>Filter courses by your learning needs.</p>
                </div>
                {(searchQuery || selectedLevel !== "All" || selectedSubject !== "All") && (
                  <button type="button" className="courses-reset-button" onClick={handleResetFilters}>
                    Clear filters
                  </button>
                )}
              </div>
              <div className="courses-filters-grid">
                <label className="courses-filter-group">
                  <span>Education level</span>
                  <select
                    value={selectedLevel}
                    onChange={(event) => {
                      setSelectedLevel(event.target.value);
                      resetVisibleCourses();
                    }}
                  >
                    {educationLevels.map((level) => (
                      <option key={level} value={level}>
                        {level === "All" ? "All levels" : level}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="courses-filter-group">
                  <span>Subject</span>
                  <select
                    value={selectedSubject}
                    onChange={(event) => {
                      setSelectedSubject(event.target.value);
                      resetVisibleCourses();
                    }}
                  >
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject === "All" ? "All subjects" : subject}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="courses-results-header">
              <p>
                Showing <strong>{displayedCourses.length}</strong> of <strong>{filteredCourses.length}</strong> courses
              </p>
            </div>

            {loading ? (
              <div className="courses-grid">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="section-skeleton-card">
                    <div className="skeleton-shimmer" />
                    <div className="skeleton-thumb" />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="skeleton-line-sub" style={{ width: "30%" }} />
                      <div className="skeleton-line-sub" style={{ width: "20%" }} />
                    </div>
                    <div className="skeleton-line-title" style={{ width: "85%" }} />
                    <div className="skeleton-line-sub" style={{ width: "50%" }} />
                    <div className="skeleton-footer">
                      <div className="skeleton-line-title" style={{ width: "40px" }} />
                      <div className="skeleton-line" style={{ width: "90px", height: "32px", borderRadius: "6px" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="courses-empty-state">
                <h2>Unable to Load Courses</h2>
                <p>{error}</p>
                <button type="button" onClick={fetchCourses}>
                  Try Again
                </button>
              </div>
            ) : displayedCourses.length > 0 ? (
              <div className="courses-grid">
                {displayedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="courses-empty-state">
                <h2>No courses found</h2>
                <p>Try changing your search or filters to see more courses.</p>
                <button type="button" onClick={handleResetFilters}>
                  Reset filters
                </button>
              </div>
            )}

            {hasMoreCourses && (
              <div className="courses-load-more">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + LOAD_MORE_COUNT)}
                >
                  Load More Courses
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Courses;
