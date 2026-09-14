import React from "react";
import "./HomeSections.css";

function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Find Tutor",
      description:
        "Browse tutors based on your subject, level, availability, and preferences.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      ),
    },
    {
      number: "02",
      title: "Choose Tutor",
      description:
        "Review tutor profiles, qualifications, experience, ratings, and pricing.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
    {
      number: "03",
      title: "Book Session",
      description:
        "Choose an available time and book your tutoring session.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
    },
    {
      number: "04",
      title: "Learn",
      description:
        "Meet your tutor, learn, and continue building your skills.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
      ),
    },
  ];

  return (
    <section className="section section-alt">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Simple Process</span>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Getting started with ABUGIDA is simple and fast. Follow four easy steps
            to start learning.
          </p>
        </div>

        <div className="how-it-works-grid">
          {steps.map((step) => (
            <div key={step.number} className="step-card">
              <div className="step-header">
                <div className="step-icon-box">{step.icon}</div>
                <span className="step-number">{step.number}</span>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
