import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import "./TutorCard.css";

function TutorCard({ tutor }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  if (!tutor) return null;

  const {
    id,
    name,
    subject,
    educationLevel,
    rating,
    reviewsCount,
    experience,
    price,
    priceUnit = "hr",
    availability,
    verified,
    tagline,
    avatar,
  } = tutor;

  // Extract initials for fallback avatar
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
    : "T";

  const handleProfileClick = () => {
    navigate(`/tutors/${id}`);
  };

  return (
    <div className="tutor-card">
      <div className="tutor-card-header">
        <div className="tutor-avatar-wrapper">
          {avatar && !imgError ? (
            <img
              src={avatar}
              alt={name}
              className="tutor-avatar"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="tutor-avatar-placeholder" aria-label={name}>
              {initials}
            </div>
          )}
          {verified && (
            <div className="tutor-verified-badge" title="Verified Tutor">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          )}
        </div>

        <div className="tutor-header-info">
          <h3 className="tutor-name" title={name}>
            {name}
          </h3>
          {subject && <span className="tutor-subject">{subject}</span>}
        </div>
      </div>

      <div className="tutor-meta">
        <div className="tutor-rating">
          <span className="star-icon">★</span>
          <span>{rating ? rating.toFixed(1) : "5.0"}</span>
          {reviewsCount && (
            <span className="rating-count">({reviewsCount})</span>
          )}
        </div>
        {educationLevel && (
          <span className="tutor-level" title={educationLevel}>
            {educationLevel}
          </span>
        )}
      </div>

      {tagline && <p className="tutor-tagline">{tagline}</p>}

      <div className="tutor-badges">
        {experience && (
          <span className="badge-item">{experience} exp</span>
        )}
        {availability && (
          <span className="badge-item badge-availability">{availability}</span>
        )}
      </div>

      <div className="tutor-card-footer">
        <div className="tutor-price-box">
          <span className="price-label">Rate</span>
          <span className="price-amount">
            ${price}
            <span className="price-unit">/{priceUnit}</span>
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleProfileClick}
        >
          View Profile
        </Button>
      </div>
    </div>
  );
}

export default TutorCard;
