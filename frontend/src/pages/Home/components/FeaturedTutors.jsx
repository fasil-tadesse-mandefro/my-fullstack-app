import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TutorCard from "../../../components/common/TutorCard";
import Button from "../../../components/common/Button";
import { tutorsApi } from "../../../lib/api";
import "./HomeSections.css";

function FeaturedTutors() {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTutors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tutorsApi.getAll();
      const list = response?.tutors || response || [];
      setTutors(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load featured tutors:", err);
      setError(err.message || "Failed to load tutors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  // Display up to 4 top tutors from backend
  const featuredList = tutors.slice(0, 4);

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Top Educators</span>
          <h2 className="section-title">Featured Tutors</h2>
          <p className="section-subtitle">
            Learn from experienced tutors ready to help you reach your academic
            and professional goals.
          </p>
        </div>

        {loading ? (
          <div className="cards-grid-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="section-skeleton-card">
                <div className="skeleton-shimmer" />
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div className="skeleton-avatar" />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div className="skeleton-line-title" />
                    <div className="skeleton-line-sub" />
                  </div>
                </div>
                <div className="skeleton-line skeleton-line-full" style={{ marginTop: "1rem" }} />
                <div className="skeleton-line skeleton-line-full" />
                <div className="skeleton-footer">
                  <div className="skeleton-line-sub" />
                  <div className="skeleton-line" style={{ width: "80px", height: "32px", borderRadius: "6px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="section-state-box">
            <span className="section-state-icon">⚠️</span>
            <h3 className="section-state-title">Unable to Load Tutors</h3>
            <p className="section-state-desc">{error}</p>
            <button type="button" className="section-retry-btn" onClick={fetchTutors}>
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
            <span className="section-state-icon">👨‍🏫</span>
            <h3 className="section-state-title">No Tutors Available</h3>
            <p className="section-state-desc">
              We are currently onboarding top educators. Please check back shortly!
            </p>
          </div>
        ) : (
          <div className="cards-grid-4">
            {featuredList.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        )}

        <div className="section-footer-action">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate("/tutors")}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            }
            iconPosition="right"
          >
            Explore All Tutors
          </Button>
        </div>
      </div>
    </section>
  );
}

export default FeaturedTutors;
