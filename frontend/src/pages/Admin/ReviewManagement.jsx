import { useState } from "react";
import AdminLayout from "../../layout/AdminLayout";
import "./ReviewManagement.css";

function ReviewManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [reviews, setReviews] = useState([]);

  const handleRemove = (reviewId) => {
    alert(`Mock Action: Removed review ${reviewId}`);
    setReviews(reviews.filter(r => r.id !== reviewId));
  };

  const filteredReviews = reviews.filter((review) => {
    const searchString = `${review.studentName} ${review.comment} ${review.topic}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>Review Moderation</h1>
          <p>Monitor student feedback and remove inappropriate reviews.</p>
        </div>
      </div>

      <div className="admin-filters-bar">
        <input 
          type="text" 
          placeholder="Search reviews by student name, topic, or content..." 
          className="admin-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="admin-table-container card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Review ID</th>
              <th>Student</th>
              <th>Review Content</th>
              <th>Rating</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <span className="review-id-text">{review.id}</span>
                  </td>
                  <td>
                    <div className="table-student-cell">
                      {review.studentAvatar ? (
                        <img src={review.studentAvatar} alt={review.studentName} className="table-avatar-sm" />
                      ) : (
                        <div className="table-avatar-sm placeholder">
                          {review.studentName.charAt(0)}
                        </div>
                      )}
                      <span>{review.studentName}</span>
                    </div>
                  </td>
                  <td>
                    <div className="table-review-content">
                      <strong>{review.topic}</strong>
                      <p>{review.comment}</p>
                    </div>
                  </td>
                  <td>
                    <div className="table-rating">
                      <span className="stars">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                      <span className="rating-num">{review.rating}.0</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-muted">{review.date}</span>
                  </td>
                  <td>
                    <div className="admin-action-btns">
                      <button className="btn-icon danger" onClick={() => handleRemove(review.id)} title="Remove Review">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-table-state">
                  No reviews found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default ReviewManagement;
