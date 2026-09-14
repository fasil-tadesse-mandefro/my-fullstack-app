import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import "./CourseCard.css";

function CourseCard({ course }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  if (!course) return null;

  const {
    id,
    title,
    tutor,
    level,
    lessonsCount,
    duration,
    rating,
    price,
    isFree,
    category,
    thumbnail,
  } = course;

  const handleCourseClick = () => {
    navigate(`/courses/${id}`);
  };

  return (
    <div className="course-card">
      <div className="course-thumbnail-wrapper">
        {thumbnail && !imgError ? (
          <img
            src={thumbnail}
            alt={title}
            className="course-thumbnail"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="course-thumbnail-placeholder">
            <span>ABUGIDA</span>
            <small>{category || "Course"}</small>
          </div>
        )}

        {category && (
          <span className="course-category-badge">{category}</span>
        )}

        {isFree ? (
          <span className="course-badge-free">Free</span>
        ) : null}
      </div>

      <div className="course-card-body">
        <div className="course-meta-top">
          <span className="course-level">{level || "All Levels"}</span>
          <div className="course-rating">
            <span className="star-icon">★</span>
            <span>{rating ? rating.toFixed(1) : "5.0"}</span>
          </div>
        </div>

        <h3 className="course-title" title={title}>
          {title}
        </h3>

        {tutor && (
          <p className="course-tutor">
            By <span>{tutor}</span>
          </p>
        )}

        <div className="course-stats">
          {lessonsCount && (
            <div className="stat-item">
              <svg className="stat-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>{lessonsCount} lessons</span>
            </div>
          )}
          {duration && (
            <div className="stat-item">
              <svg className="stat-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{duration}</span>
            </div>
          )}
        </div>

        <div className="course-card-footer">
          <div className={`course-price ${isFree ? "free" : ""}`}>
            {isFree ? "Free" : `$${price}`}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCourseClick}
          >
            View Course
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CourseCard;
