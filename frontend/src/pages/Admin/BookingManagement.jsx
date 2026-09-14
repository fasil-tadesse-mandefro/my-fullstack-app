import { useState } from "react";
import AdminLayout from "../../layout/AdminLayout";
import "./BookingManagement.css";

function BookingManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [bookings] = useState([]);

  const handleView = (bookingId) => {
    alert(`Mock Action: View details for booking ${bookingId}`);
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchString = `${booking.studentName} ${booking.tutorName} ${booking.bookingId}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || booking.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>Booking Management</h1>
          <p>Monitor all scheduled, completed, and cancelled tutoring sessions.</p>
        </div>
      </div>

      <div className="admin-filters-bar">
        <input 
          type="text" 
          placeholder="Search by student, tutor, or Booking ID..." 
          className="admin-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="admin-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="admin-table-container card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Session Details</th>
              <th>Participants</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <tr key={booking.bookingId}>
                  <td>
                    <span className="booking-id-text">{booking.bookingId}</span>
                  </td>
                  <td>
                    <div className="table-session-cell">
                      <strong>{booking.topic}</strong>
                      <span className="text-muted">{booking.subject}</span>
                    </div>
                  </td>
                  <td>
                    <div className="table-participants-cell">
                      <div className="participant">
                        <span className="p-label">S:</span> {booking.studentName || 'Student'}
                      </div>
                      <div className="participant">
                        <span className="p-label">T:</span> {booking.tutorName}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="table-schedule-cell">
                      <span>{booking.date}</span>
                      <span className="text-muted">{booking.time} • {booking.duration}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-action-btns">
                      <button className="btn-icon" onClick={() => handleView(booking.bookingId)} title="View Details">👁️</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-table-state">
                  No bookings found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default BookingManagement;
