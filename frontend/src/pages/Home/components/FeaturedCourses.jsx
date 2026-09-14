import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CourseCard from "../../../components/common/CourseCard";
import Button from "../../../components/common/Button";
import { coursesApi } from "../../../lib/api";
import "./HomeSections.css";

function FeaturedCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await coursesApi.getAll({ status: "Published" });
      const list = response?.courses || response || [];
      // If no published courses returned or filter yields none, fallback to all courses
      if (Array.isArray(list) && list.length > 0) {
        setCourses(list);
      } else {
        const fallbackRes = await coursesApi.getAll();
        const fallbackList = fallbackRes?.courses || fallbackRes || [];
        setCourses(Array.isArray(fallbackList) ? fallbackList : []);
      }
    } catch (err) {
      console.error("Failed to load featured courses:", err);
      setError(err.message || "Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Display up to 4 featured courses from backend
  const featuredList = courses.slice(0, 4);

  return (
    <section className="section section-alt">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Self-Paced Learning</span>
          <h2 className="section-title">Featured Courses</h2>
          <p className="section-subtitle">
            Explore structured courses designed to help you master new subjects
            and skills at your own pace.
          </p>
        </div>

        {loading ? (
          <div className="cards-grid-4">
            {[1, 2, 3, 4].map((n) => (
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
          <div className="section-state-box">
            <span className="section-state-icon">⚠️</span>
            <h3 className="section-state-title">Unable to Load Courses</h3>
            <p className="section-state-desc">{error}</p>
            <button type="button" className="section-retry-btn" onClick={fetchCourses}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Try Again
            </button>
          </div>
        ) : featuredList.length === 0 ? (
          <div className="section-state-box">
            <span className="section-state-icon">📚</span>
            <h3 className="section-state-title">No Courses Available</h3>
            <p className="section-state-desc">
              New self-paced courses will be published soon. Please check back later!
            </p>
          </div>
        ) : (
          <div className="cards-grid-4">
            {featuredList.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        <div className="section-footer-action">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate("/courses")}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            }
            iconPosition="right"
          >
            Browse All Courses
          </Button>
        </div>
      </div>
    </section>
  );
}

export default FeaturedCourses;
