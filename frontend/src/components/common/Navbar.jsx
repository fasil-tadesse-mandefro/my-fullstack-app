import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import Button from "./Button";
import "./Navbar.css";

// ── Icons ──────────────────────────────────────────────────────────
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, switchLang, t } = useLanguage();
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

  // ── Shared toggle UI ──────────────────────────────────────────────
  const ThemeToggle = () => (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? t("theme.toggleLight") : t("theme.toggleDark")}
      title={theme === "dark" ? t("theme.toggleLight") : t("theme.toggleDark")}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );

  const LangSwitcher = () => (
    <div className="lang-switcher" role="group" aria-label="Language switcher">
      <button
        type="button"
        className={`lang-btn${lang === "en" ? " active" : ""}`}
        onClick={() => switchLang("en")}
        aria-pressed={lang === "en"}
      >
        {t("language.english")}
      </button>
      <span className="lang-divider" aria-hidden="true">|</span>
      <button
        type="button"
        className={`lang-btn ethiopic${lang === "am" ? " active" : ""}`}
        onClick={() => switchLang("am")}
        aria-pressed={lang === "am"}
      >
        {t("language.amharic")}
      </button>
    </div>
  );

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
                {t("nav.home")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/tutors"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                {t("nav.findTutors")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/courses"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                {t("nav.courses")}
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          {/* Theme + Language controls */}
          <div className="navbar-controls">
            <ThemeToggle />
            <LangSwitcher />
          </div>

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
                    {t(`role.${user.role}`) || user.role}
                  </span>
                </div>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                {t("nav.logout")}
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
              >
                {t("nav.login")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/register")}
              >
                {t("nav.register")}
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
              {t("nav.home")}
            </NavLink>
            <NavLink
              to="/tutors"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
              onClick={handleNavClick}
            >
              {t("nav.findTutors")}
            </NavLink>
            <NavLink
              to="/courses"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
              onClick={handleNavClick}
            >
              {t("nav.courses")}
            </NavLink>

            {isAuthenticated && user && (
              <NavLink
                to={getDashboardPath()}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                onClick={handleNavClick}
              >
                📊 {t("nav.myDashboard")}
              </NavLink>
            )}

            {/* Mobile Controls Row */}
            <div className="mobile-controls-row">
              <ThemeToggle />
              <LangSwitcher />
            </div>

            <div className="mobile-actions">
              {isAuthenticated && user ? (
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={handleLogout}
                >
                  {t("nav.logout")} ({user.name})
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
                    {t("nav.login")}
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
                    {t("nav.register")}
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
