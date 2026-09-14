import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import { usersApi, tutorsApi, bookingsApi, coursesApi } from "../../lib/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [pendingTutors, setPendingTutors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [usersRes, tutorsRes, pendingTutorsRes, bookingsRes, coursesRes] = await Promise.all([
          usersApi.getAll().catch(() => ({ users: [] })),
          tutorsApi.getAll().catch(() => ({ tutors: [] })),
          usersApi.getPendingTutors().catch(() => ({ users: [] })),
          bookingsApi.getAll().catch(() => ({ bookings: [] })),
          coursesApi.getAll().catch(() => ({ courses: [] })),
        ]);

        if (usersRes?.users) setUsers(usersRes.users);
        if (tutorsRes?.tutors) setTutors(tutorsRes.tutors);
        if (pendingTutorsRes?.users) setPendingTutors(pendingTutorsRes.users);
        if (bookingsRes?.bookings) setBookings(bookingsRes.bookings);
        if (coursesRes?.courses) setCourses(coursesRes.courses);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalUsers = users.length;
  const totalTutors = tutors.length;
  const totalCourses = courses.length;
  const totalBookings = bookings.length;

  const recentUsers = [...users].reverse().slice(0, 4);
  const recentBookings = [...bookings].reverse().slice(0, 4);
  const recentCourses = [...courses].reverse().slice(0, 4);

  // Platform Metrics
  const stats = [
    { label: "Total Users", value: totalUsers, icon: "🎓", colorClass: "icon-blue" },
    { label: "Active Tutors", value: totalTutors, icon: "👨‍🏫", colorClass: "icon-teal" },
    { label: "Total Courses", value: totalCourses, icon: "📚", colorClass: "icon-purple" },
    { label: "Total Bookings", value: totalBookings, icon: "📅", colorClass: "icon-amber" },
  ];

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>Platform Overview</h1>
          <p>Monitor and manage ABUGIDA operations.</p>
        </div>
        <div className="status-badge-live">
          <span>●</span> All Systems Operational
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="admin-stat-card">
            <div className={`stat-icon ${stat.colorClass}`}>{stat.icon}</div>
            <div className="stat-info">
              <span className="stat-value">{loading ? "..." : stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-dashboard-sections">
        {/* Left Column */}
        <div className="admin-col-left">
          
          {/* Pending Verifications */}
          <section className="admin-section card">
            <div className="section-header">
              <h2>Pending Tutor Verifications</h2>
              <Link to="/admin/tutors/verification" className="view-all-link">View All</Link>
            </div>
            {pendingTutors.length > 0 ? (
              <div className="verification-list">
                {pendingTutors.map(tutor => (
                  <div key={tutor.id} className="verification-item">
                    <div className="v-info">
                      <span className="v-icon">👨‍🏫</span>
                      <div>
                        <h4>{tutor.name}</h4>
                        <p>{tutor.subject || "Pending Approval"}</p>
                      </div>
                    </div>
                    <button className="btn-review" onClick={() => navigate('/admin/tutors/verification')}>Review</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No pending verifications.</p>
            )}
          </section>

          {/* Recent Courses */}
          <section className="admin-section card">
            <div className="section-header">
              <h2>Recently Uploaded Courses</h2>
              <Link to="/admin/courses" className="view-all-link">Manage Courses</Link>
            </div>
            <div className="admin-list-group">
              {recentCourses.map(course => (
                <div key={course.id} className="admin-list-item">
                  <img src={course.thumbnail} alt="" className="item-thumb" />
                  <div className="item-details">
                    <h4>{course.title}</h4>
                    <p>{course.tutor} • {course.subject}</p>
                  </div>
                  <span className="item-meta">{course.price > 0 ? `$${course.price}` : 'Free'}</span>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column */}
        <div className="admin-col-right">
          
          {/* Recent Bookings */}
          <section className="admin-section card">
            <div className="section-header">
              <h2>Recent Bookings</h2>
              <Link to="/admin/bookings" className="view-all-link">Manage Bookings</Link>
            </div>
            <div className="admin-list-group">
              {recentBookings.length > 0 ? (
                recentBookings.map(booking => (
                  <div key={booking.booking_id || booking.id} className="admin-list-item">
                    <div className="item-details">
                      <h4>{booking.student_name || 'Student'} <span className="text-muted">booked</span> {booking.tutor_name}</h4>
                      <p>{booking.date} • {booking.topic || booking.subject}</p>
                    </div>
                    <span className={`status-pill ${(booking.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                      {booking.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="empty-state">No recent bookings recorded.</p>
              )}
            </div>
          </section>

          {/* Recent Users */}
          <section className="admin-section card">
            <div className="section-header">
              <h2>Recent Users</h2>
              <Link to="/admin/users" className="view-all-link">Manage Users</Link>
            </div>
            <div className="admin-list-group">
              {recentUsers.map(u => (
                <div key={u.id} className="admin-list-item">
                  <img
                    src={
                      u.avatar ||
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                    }
                    alt=""
                    className="item-avatar"
                  />
                  <div className="item-details">
                    <h4>{u.name}</h4>
                    <p>{u.email}</p>
                  </div>
                  <span className="role-badge">{u.role}</span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
