import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "./Button";
import "./Navbar.css";

function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavClick = () => {
    setIsMobileOpen(false);
  };

  const getDashboardPath = () => {
    if (!user) return "/";
    switch (user.role) {
      case "student":
        return "/student/dashboard";
      case "tutor":
        return "/tutor/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  const handleLogout = () => {
    logout();
    setIsMobileOpen(false);
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" onClick={handleNavClick}>
          <span className="brand-icon">አ</span>
          <span className="brand-text">ABUGIDA</span>
          <span className="brand-badge">Tutors</span>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main Navigation">
          <ul className="navbar-nav">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/tutors"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Find Tutors
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/courses"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Courses
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          {isAuthenticated && user ? (
            <div className="navbar-user-menu">
              <Link
                to={getDashboardPath()}
                className="user-profile-btn"
                title={`Go to ${user.role} dashboard`}
              >
                <img
                  src={
                    user.avatar ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                  }
                  alt={user.name}
                  className="navbar-avatar"
                />
                <div className="user-text-info">
                  <span className="user-name">{user.name}</span>
                  <span className={`user-role-badge badge-${user.role}`}>
                    {user.role}
                  </span>
                </div>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/register")}
              >
                Register
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className={`mobile-toggle ${isMobileOpen ? "open" : ""}`}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Mobile Dropdown Menu */}
        {isMobileOpen && (
          <div className="mobile-menu">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
              onClick={handleNavClick}
            >
              Home
            </NavLink>
            <NavLink
              to="/tutors"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
              onClick={handleNavClick}
            >
              Find Tutors
            </NavLink>
            <NavLink
              to="/courses"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
              onClick={handleNavClick}
            >
              Courses
            </NavLink>

            {isAuthenticated && user && (
              <NavLink
                to={getDashboardPath()}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                onClick={handleNavClick}
              >
                📊 My {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)} Dashboard
              </NavLink>
            )}

            <div className="mobile-actions">
              {isAuthenticated && user ? (
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={handleLogout}
                >
                  Logout ({user.name})
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    onClick={() => {
                      handleNavClick();
                      navigate("/login");
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => {
                      handleNavClick();
                      navigate("/register");
                    }}
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
