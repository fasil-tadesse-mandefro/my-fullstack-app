import { Link, useLocation } from "react-router-dom";
import Layout from "./Layout";
import { useAuth } from "../context/AuthContext";
import "./AdminLayout.css";

function AdminLayout({ children }) {
  const { user, getPendingStudents, getPendingTutors } = useAuth();
  const location = useLocation();

  const adminName = user?.name || "Abugida Admin";
  const avatar = user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80";

  const pendingTutors = getPendingTutors().length;
  const pendingStudents = getPendingStudents().length;

  const adminLinks = [
    { id: "dashboard", title: "Dashboard", icon: "📊", path: "/admin/dashboard" },
    { id: "users", title: "User Management", icon: "👥", path: "/admin/users" },
    { id: "student-verification", title: "Student Approval", icon: "🎓", path: "/admin/students/verification", badge: pendingStudents },
    { id: "verification", title: "Tutor Verification", icon: "📝", path: "/admin/tutors/verification", badge: pendingTutors },
    { id: "courses", title: "Course Management", icon: "📚", path: "/admin/courses" },
    { id: "bookings", title: "Booking Management", icon: "📅", path: "/admin/bookings" },
    { id: "reviews", title: "Review Moderation", icon: "⭐", path: "/admin/reviews" },
  ];

  return (
    <Layout>
      <div className="admin-layout-wrapper">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <img src={avatar} alt={adminName} className="admin-sidebar-avatar" />
            <div className="admin-sidebar-info">
              <h3>{adminName}</h3>
              <span className="badge-root">Root Admin</span>
            </div>
          </div>
          <nav className="admin-sidebar-nav">
            {adminLinks.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.id} 
                  to={link.path} 
                  className={`admin-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">{link.icon}</span>
                  <span className="nav-text">{link.title}</span>
                  {link.badge > 0 && <span className="nav-badge">{link.badge}</span>}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="admin-main-content">
          {children}
        </main>
      </div>
    </Layout>
  );
}

export default AdminLayout;
