import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import "./HomeSections.css";

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          {/* Left: Text & CTAs */}
          <div className="hero-content">
            <div className="hero-pill">
              <span className="hero-pill-dot"></span>
              <span>Empowering Modern Learning in Ethiopia</span>
            </div>

            <h1 className="hero-title">
              Learn from the right tutor.{" "}
              <span className="text-gradient">Grow with ABUGIDA.</span>
            </h1>

            <p className="hero-description">
              Connect with certified, experienced tutors for personalized 1-on-1
              sessions and explore self-paced video courses designed to help you
              excel in school, national exams, and career skills.
            </p>

            <div className="hero-actions">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/tutors")}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                }
              >
                Find a Tutor
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/courses")}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                }
              >
                Explore Courses
              </Button>
            </div>

            {/* Trust highlights */}
            <div className="hero-trust-list">
              <div className="hero-trust-item">
                <svg className="trust-check-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Verified Expert Tutors</span>
              </div>
              <div className="hero-trust-item">
                <svg className="trust-check-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>1-on-1 Live Sessions</span>
              </div>
              <div className="hero-trust-item">
                <svg className="trust-check-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Flexible Schedules</span>
              </div>
            </div>
          </div>

          {/* Right: Visual Card Showcase */}
          <div className="hero-visual">
            <div className="hero-visual-card">
              <div className="visual-card-header">
                <span className="visual-tag">Featured Match</span>
                <div className="live-indicator">
                  <span className="live-dot"></span>
                  <span>Tutors Online</span>
                </div>
              </div>

              <div className="visual-preview-content">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Dr. Abebe Bekele"
                  className="preview-avatar"
                />
                <div className="preview-info">
                  <h4>Dr. Abebe Bekele</h4>
                  <p>Mathematics & Calculus Specialist</p>
                </div>
              </div>

              <div className="visual-stats-grid">
                <div className="stat-box">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Verified Tutors</div>
                </div>
                <div className="stat-box">
                  <div className="stat-number">4.9 ★</div>
                  <div className="stat-label">Average Rating</div>
                </div>
              </div>
            </div>

            {/* Floating Trust Badge */}
            <div className="floating-stat-pill">
              <div className="floating-icon">🎯</div>
              <div className="floating-text">
                <h5>100% Focused</h5>
                <p>Personalized learning plans</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
