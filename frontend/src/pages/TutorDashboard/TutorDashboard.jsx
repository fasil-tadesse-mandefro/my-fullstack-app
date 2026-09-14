import { Link, useNavigate } from "react-router-dom";
import Layout from "../../layout/Layout";
import { useAuth } from "../../context/AuthContext";
import "./TutorDashboard.css";

const dashboardData = {
  stats: [
    { label: "Total bookings", value: "128", detail: "+12 this month", icon: "BK", tone: "blue" },
    { label: "Upcoming sessions", value: "6", detail: "2 sessions today", icon: "UP", tone: "teal" },
    { label: "Total courses", value: "4", detail: "3 published", icon: "CR", tone: "purple" },
    { label: "Average rating", value: "4.9", detail: "128 student reviews", icon: "RT", tone: "amber" },
  ],
  upcomingSessions: [
    { id: "bk-101", date: "Today", day: "28", time: "4:00 PM", subject: "Calculus I: Limits & Derivatives", student: "Nahom Tadesse", level: "Grade 11", live: true },
    { id: "bk-103", date: "Today", day: "28", time: "6:30 PM", subject: "Linear Algebra & Matrices", student: "Bethelhem Assefa", level: "University, Year 2" },
    { id: "bk-108", date: "Tomorrow", day: "29", time: "10:00 AM", subject: "National Exam Mathematics", student: "Tigist Alemu", level: "Grade 12" },
  ],
  recentBookings: [
    { id: "ABG-2048", student: "Meron Getachew", subject: "Algebra II", date: "Aug 27, 2026", time: "5:00 PM", status: "Completed" },
    { id: "ABG-2047", student: "Yonatan Mekonnen", subject: "Differential Equations", date: "Aug 26, 2026", time: "3:30 PM", status: "Completed" },
    { id: "ABG-2046", student: "Saron Fikru", subject: "Calculus I", date: "Aug 25, 2026", time: "4:00 PM", status: "Confirmed" },
  ],
  recentCourses: [
    { id: "crs-01", title: "Complete Calculus & Analytical Geometry", learners: 180, lessons: 24, status: "Published", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80" },
    { id: "crs-03", title: "Differential Equations Simplified", learners: 95, lessons: 18, status: "Published", image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80" },
  ],
};

function TutorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tutorName = user?.name || "Dr. Abebe Bekele";
  const subject = user?.subject || "Mathematics & Calculus";
  const avatar = user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

  // Calculate pending receipts/approvals dynamically
  const pendingCount = (() => {
    try {
      const saved = localStorage.getItem("abugida_student_bookings");
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          return list.filter(
            (b) =>
              b.status === "Pending Approval" ||
              b.status === "Payment Pending" ||
              b.status === "Pending"
          ).length;
        }
      }
    } catch {
      return 2;
    }
    return 2;
  })();

  const stats = [
    { label: "Pending Approvals", value: String(pendingCount), detail: pendingCount > 0 ? "Receipts to verify" : "All clear", icon: "⚡", tone: "amber" },
    { label: "Upcoming sessions", value: "6", detail: "2 sessions today", icon: "UP", tone: "teal" },
    { label: "Total courses", value: "4", detail: "3 published", icon: "CR", tone: "purple" },
    { label: "Average rating", value: "4.9", detail: "128 student reviews", icon: "RT", tone: "blue" },
  ];

  const navigation = [
    { label: "Dashboard", shortLabel: "DB", to: "/tutor/dashboard" }, { label: "My Profile", shortLabel: "PR", to: "/tutor/profile" },
    { label: "Availability", shortLabel: "AV", to: "/tutor/availability" }, { label: "Bookings", shortLabel: "BK", to: "/tutor/bookings" }, { label: "My Courses", shortLabel: "CR", to: "/tutor/courses" },
  ];
  const actions = [
    { label: "Payment & Profile", description: "Manage Telebirr & CBE bank accounts", to: "/tutor/profile", icon: "PR" }, { label: "Review Bookings", description: `${pendingCount} pending payment approvals`, to: "/tutor/bookings", icon: "BK" },
    { label: "Manage Availability", description: "Set your teaching hours", to: "/tutor/availability", icon: "AV" }, { label: "Upload Course", description: "Create a new course", to: "/tutor/courses/upload", icon: "UP" },
  ];

  return <Layout><div className="tutor-dashboard-page"><div className="container tutor-dashboard-shell">
    <aside className="tutor-sidebar" aria-label="Tutor navigation">
      <div className="sidebar-profile"><img className="sidebar-avatar" src={avatar} alt="" /><div><strong>{tutorName}</strong><span>Verified tutor</span></div></div>
      <nav className="sidebar-nav">{navigation.map((item) => <Link key={item.to} to={item.to} className={`sidebar-link ${item.to === "/tutor/dashboard" ? "active" : ""}`}><span className="sidebar-icon" aria-hidden="true">{item.shortLabel}</span>{item.label}</Link>)}</nav>
      <div className="sidebar-help"><strong>Need help?</strong><p>Visit the tutor support centre for guidance.</p><a href="mailto:support@abugida.com">Contact support</a></div>
    </aside>
    <div className="tutor-dashboard-content">
      <section className="tutor-welcome"><div><p className="eyebrow">Tutor workspace</p><h1>Welcome back, {tutorName.split(" ")[0]}!</h1><p>Here is an overview of your tutoring activity and content.</p></div><div className="welcome-profile"><img src={avatar} alt={tutorName} /><div><strong>{subject}</strong><span>Top rated instructor · 4.9/5</span></div></div></section>
      <section className="tutor-stats" aria-label="Tutor activity summary">{stats.map((stat) => <article className="tutor-stat-card" key={stat.label}><span className={`stat-icon ${stat.tone}`} aria-hidden="true">{stat.icon}</span><div><p>{stat.label}</p><strong>{stat.value}</strong><span>{stat.detail}</span></div></article>)}</section>
      <section className="dashboard-section"><div className="section-heading"><div><p className="eyebrow">Get things done</p><h2>Quick actions</h2></div></div><div className="quick-actions-grid">{actions.map((action) => <button className="quick-action" type="button" key={action.label} onClick={() => navigate(action.to)}><span className="quick-action-icon" aria-hidden="true">{action.icon}</span><span><strong>{action.label}</strong><small>{action.description}</small></span><b aria-hidden="true">→</b></button>)}</div></section>
      <div className="dashboard-columns">
        <section className="dashboard-section content-card"><div className="section-heading"><div><p className="eyebrow">Your schedule</p><h2>Upcoming sessions</h2></div><Link to="/tutor/bookings">View all</Link></div><div className="sessions-list">{dashboardData.upcomingSessions.map((session) => <article className="upcoming-session" key={session.id}><div className="session-date"><span>{session.date}</span><strong>{session.day}</strong></div><div className="session-details"><h3>{session.subject}</h3><p>{session.student} · {session.level}</p><span>{session.time}</span></div><button type="button" className={session.live ? "live-button" : "outline-button"} onClick={() => navigate(`/live-class/${session.id}`)}>{session.live ? "Join session" : "View details"}</button></article>)}</div></section>
        <section className="dashboard-section content-card"><div className="section-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent bookings</h2></div><Link to="/tutor/bookings">View all</Link></div><div className="booking-list">{dashboardData.recentBookings.map((booking) => <article className="recent-booking" key={booking.id}><div className="booking-initial">{booking.student.charAt(0)}</div><div><h3>{booking.student}</h3><p>{booking.subject} · {booking.date}</p></div><div className="booking-status"><span className={booking.status.toLowerCase()}>{booking.status}</span><small>{booking.time}</small></div></article>)}</div></section>
      </div>
      <section className="dashboard-section content-card recent-courses-section"><div className="section-heading"><div><p className="eyebrow">Your content</p><h2>Recent courses</h2></div><Link to="/tutor/courses">Manage courses</Link></div><div className="recent-courses-grid">{dashboardData.recentCourses.map((course) => <article className="recent-course" key={course.id}><img src={course.image} alt="" /><div className="course-copy"><span className="course-status">{course.status}</span><h3>{course.title}</h3><p>{course.learners} learners · {course.lessons} lessons</p></div><button type="button" onClick={() => navigate("/tutor/courses")}>Manage</button></article>)}</div></section>
    </div>
  </div></div></Layout>;
}

export default TutorDashboard;
