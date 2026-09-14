import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { validateEmail } from "../../utils/validateEmail";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Check if redirected from password reset or pending registration
  useEffect(() => {
    if (location.state?.resetSuccess) {
      setAuthSuccess("Password has been successfully updated! You can now sign in.");
      if (location.state?.email) {
        setFormData((prev) => ({ ...prev, email: location.state.email }));
      }
    }
    if (location.state?.registrationPending) {
      const isTutor = location.state?.role === "tutor";
      setAuthSuccess(
        isTutor
          ? "Tutor registration submitted! Please wait for admin approval of your documents before signing in."
          : "Registration submitted! Please wait for admin approval before signing in."
      );
      if (location.state?.email) {
        setFormData((prev) => ({ ...prev, email: location.state.email }));
      }
    }
  }, [location.state]);

  const redirectByRole = useCallback(
    (role) => {
      const fromPath = location.state?.from?.pathname;
      if (fromPath) {
        navigate(fromPath, { replace: true });
        return;
      }

      switch (role) {
        case "student":
          navigate("/student/dashboard");
          break;
        case "tutor":
          navigate("/tutor/dashboard");
          break;
        case "admin":
          navigate("/admin/dashboard");
          break;
        default:
          navigate("/");
      }
    },
    [location.state, navigate]
  );

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      redirectByRole(user.role);
    }
  }, [isAuthenticated, user, redirectByRole]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (authError) {
      setAuthError("");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        setAuthSuccess(`Welcome back, ${result.user.name}! Redirecting...`);
        setTimeout(() => {
          redirectByRole(result.user.role);
        }, 500);
      } else {
        setAuthError(result.message || "Invalid email or password.");
      }
    } catch {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Standalone Top Bar without global Layout */}
      <header className="auth-standalone-header">
        <Link to="/" className="auth-brand-logo" title="Back to Abugida Home">
          <span className="auth-brand-icon">አ</span>
          <span className="auth-brand-name">ABUGIDA</span>
          <span className="auth-brand-tag">Tutors</span>
        </Link>

        <div className="auth-header-actions">
          <Link to="/" className="auth-back-link">
            <span>←</span> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="auth-main-content">
        <div className="auth-container">
          {/* Left Column: Hero Branding Showcase */}
          <div className="auth-branding-side">
            <div className="branding-top">
              <div className="brand-badge-pill">
                <span>✦</span> ABUGIDA Learning Hub
              </div>
              <h1 className="branding-title">
                Empowering Ethiopia's Brightest Minds
              </h1>
              <p className="branding-description">
                Connect with verified tutors for 1-on-1 personalized lessons, 
                high-quality recorded courses, and interactive virtual classrooms.
              </p>

              <ul className="branding-features">
                <li className="branding-feature-item">
                  <span className="feature-check-icon">✓</span>
                  <span>Over 1,200+ Verified Expert Instructors</span>
                </li>
                <li className="branding-feature-item">
                  <span className="feature-check-icon">✓</span>
                  <span>1-on-1 HD Live Classes with Digital Whiteboard</span>
                </li>
                <li className="branding-feature-item">
                  <span className="feature-check-icon">✓</span>
                  <span>Flexible schedules with local Ethiopian payment support</span>
                </li>
              </ul>
            </div>

            {/* Testimonial Quote */}
            <div className="branding-testimonial">
              <p className="testimonial-quote">
                "Finding a calculus tutor who understood my curriculum made all the difference. My scores jumped from 68% to 94%!"
              </p>
              <div className="testimonial-author">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Student testimonial avatar"
                  className="author-avatar"
                />
                <div className="author-info">
                  <h4>Selamawit Girma</h4>
                  <p>Grade 12 Student • Addis Ababa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form Side */}
          <div className="auth-form-side">
            <div className="auth-header">
              <span className="auth-header-tag">Account Login</span>
              <h2>Welcome Back</h2>
              <p>Sign in to continue your personalized learning journey</p>
            </div>

            {/* Alert Notifications */}
            {authError && (
              <div className="auth-alert auth-alert-error" role="alert">
                <span>⚠️</span>
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="auth-alert auth-alert-success" role="alert">
                <span>✓</span>
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Standard Login Form */}
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Email Input */}
              <div className="input-group">
                <label className="input-label" htmlFor="email">
                  Email Address
                </label>
                <div className="input-wrapper">
                  <span className="input-icon-left">✉</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="e.g. student@abugida.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-field ${errors.email ? "error" : ""}`}
                    autoComplete="email"
                    required
                  />
                </div>
                {errors.email && (
                  <span className="input-error-msg">⚠️ {errors.email}</span>
                )}
              </div>

              {/* Password Input */}
              <div className="input-group">
                <label className="input-label" htmlFor="password">
                  Password
                </label>
                <div className="input-wrapper">
                  <span className="input-icon-left">🔒</span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input-field ${errors.password ? "error" : ""}`}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
                {errors.password && (
                  <span className="input-error-msg">⚠️ {errors.password}</span>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="form-extra-options">
                <label className="checkbox-label" htmlFor="rememberMe">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="forgot-link"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Sign In to Account →"}
              </button>
            </form>

            {/* Switch Footer */}
            <div className="auth-footer">
              Don't have an account yet?
              <Link to="/register" className="auth-switch-link">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
