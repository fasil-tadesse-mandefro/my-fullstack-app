import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { validateEmail } from "../../utils/validateEmail";
import "./Auth.css";

const DEMO_EMAILS = [
  { label: "Student", email: "nahom.student@abugida.edu.et", role: "Grade 11 Student" },
  { label: "Tutor", email: "abebe.math@abugida.edu.et", role: "Mathematics Tutor" },
  { label: "Parent", email: "marta.parent@abugida.edu.et", role: "Parent Account" },
];

const DEFAULT_MOCK_CODE = "849201";

function ForgotPassword() {
  const navigate = useNavigate();

  // Multi-step flow: 1: 'email' -> 2: 'code' -> 3: 'reset' -> 4: 'success'
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [generatedCode, setGeneratedCode] = useState(DEFAULT_MOCK_CODE);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for code resend
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Step 1: Send Verification Code
  const handleSendCode = (e) => {
    e?.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address (e.g., student@abugida.edu.et).");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Generate a new 6-digit code or use standard mock
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(newCode);
      setLoading(false);
      setStep(2);
      setTimer(60);
      setCanResend(false);
      setSuccessMsg(`Verification code sent to ${email}`);
    }, 800);
  };

  // Handle single digit input change
  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError("");

    // Auto-focus next input if filled
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = (e) => {
    e?.preventDefault();
    setError("");
    const enteredCode = code.join("");

    if (enteredCode.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (enteredCode === generatedCode || enteredCode === DEFAULT_MOCK_CODE) {
        setStep(3);
        setSuccessMsg("Code verified! You can now set your new password.");
      } else {
        setError("Invalid verification code. Please check and try again.");
      }
    }, 600);
  };

  // Resend code handler
  const handleResendCode = () => {
    if (!canResend) return;
    setLoading(true);
    setError("");

    setTimeout(() => {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(newCode);
      setCode(["", "", "", "", "", ""]);
      setTimer(60);
      setCanResend(false);
      setLoading(false);
      setSuccessMsg(`A new code was sent to ${email}`);
    }, 600);
  };

  // Quick autofill demo code
  const handleFillDemoCode = () => {
    const digits = generatedCode.split("");
    setCode(digits);
    setError("");
  };

  // Password strength checker
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: "", color: "" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, text: "Weak", color: "#ef4444" };
      case 2:
        return { score: 50, text: "Fair", color: "#f59e0b" };
      case 3:
        return { score: 75, text: "Good", color: "#3b82f6" };
      case 4:
        return { score: 100, text: "Strong", color: "#10b981" };
      default:
        return { score: 10, text: "Too short", color: "#ef4444" };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Step 3: Reset Password
  const handleResetPassword = (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep(4);
    }, 800);
  };

  return (
    <div className="auth-page">
      {/* Standalone Header */}
      <header className="auth-standalone-header">
        <Link to="/" className="auth-brand-logo" title="Back to Abugida Home">
          <span className="auth-brand-icon">አ</span>
          <span className="auth-brand-name">ABUGIDA</span>
          <span className="auth-brand-tag">Tutors</span>
        </Link>
        <div className="auth-header-actions">
          <Link to="/login" className="auth-back-link">
            ← Back to Login
          </Link>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="auth-main-content">
        <div className="auth-container forgot-container">
          {/* Left Branding Showcase */}
          <div className="auth-branding-side">
            <div className="branding-top">
              <div className="brand-badge-pill">
                <span>🔐 Account Security</span>
              </div>
              <h1 className="branding-title">
                Password Recovery & Access Support
              </h1>
              <p className="branding-description">
                Fast, secure verification designed to get you back to your
                classes, tutoring bookings, and lessons in seconds.
              </p>

              <ul className="branding-features">
                <li className="branding-feature-item">
                  <span className="feature-check-icon">✓</span>
                  <span>Instant 6-Digit Email Verification</span>
                </li>
                <li className="branding-feature-item">
                  <span className="feature-check-icon">✓</span>
                  <span>End-to-End Encrypted Credential Reset</span>
                </li>
                <li className="branding-feature-item">
                  <span className="feature-check-icon">✓</span>
                  <span>Protected Student & Tutor Portals</span>
                </li>
              </ul>
            </div>

            {/* Support Note */}
            <div className="branding-testimonial forgot-note">
              <p className="testimonial-quote">
                "Need urgent help? Our Ethiopian student support team is online 7 days a week to help recover lost accounts."
              </p>
              <div className="testimonial-author">
                <div className="support-badge-icon">🎧</div>
                <div className="author-info">
                  <h4>Abugida Helpdesk</h4>
                  <p>support@abugida.edu.et • +251 911 000 000</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Side */}
          <div className="auth-form-side">
            {/* Step Progress Indicators */}
            <div className="forgot-steps-indicator">
              <div className={`step-dot-item ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
                <span className="step-num">{step > 1 ? "✓" : "1"}</span>
                <span className="step-name">Email</span>
              </div>
              <div className={`step-connector ${step >= 2 ? "active" : ""}`} />
              <div className={`step-dot-item ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
                <span className="step-num">{step > 2 ? "✓" : "2"}</span>
                <span className="step-name">Verify</span>
              </div>
              <div className={`step-connector ${step >= 3 ? "active" : ""}`} />
              <div className={`step-dot-item ${step >= 3 ? "active" : ""} ${step > 3 ? "completed" : ""}`}>
                <span className="step-num">{step > 3 ? "✓" : "3"}</span>
                <span className="step-name">Reset</span>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="auth-banner error-banner" role="alert">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Success Alert */}
            {successMsg && step < 4 && (
              <div className="auth-banner success-banner" role="status">
                <span>✓ {successMsg}</span>
              </div>
            )}

            {/* ── STEP 1: ENTER EMAIL ── */}
            {step === 1 && (
              <div className="forgot-step-content">
                <div className="auth-header">
                  <span className="auth-header-tag">Step 1 of 3</span>
                  <h2>Forgot Your Password?</h2>
                  <p>
                    Enter your registered email address and we'll send you a 6-digit verification code to reset your password.
                  </p>
                </div>

                {/* Quick Demo Emails Selector */}
                <div className="demo-accounts-bar">
                  <div className="demo-title-row">
                    <span className="title-label">
                      <span>⚡</span> Quick Select Demo Account:
                    </span>
                  </div>
                  <div className="demo-grid-selector">
                    {DEMO_EMAILS.map((demo) => (
                      <button
                        key={demo.email}
                        type="button"
                        className={`demo-card-btn ${email === demo.email ? "active" : ""}`}
                        onClick={() => {
                          setEmail(demo.email);
                          setError("");
                        }}
                      >
                        <span className="demo-role-name">{demo.label}</span>
                        <span className="demo-email-hint">{demo.email}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form className="auth-form" onSubmit={handleSendCode}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="reset-email">
                      Account Email Address <span className="required-star">*</span>
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon-left">✉️</span>
                      <input
                        type="email"
                        id="reset-email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="e.g. nahom.student@abugida.edu.et"
                        className={`input-field ${error ? "error" : ""}`}
                        autoComplete="email"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? "Sending Verification Code..." : "Send Verification Code →"}
                  </button>
                </form>
              </div>
            )}

            {/* ── STEP 2: ENTER VERIFICATION CODE ── */}
            {step === 2 && (
              <div className="forgot-step-content">
                <div className="auth-header">
                  <span className="auth-header-tag">Step 2 of 3</span>
                  <h2>Check Your Inbox</h2>
                  <p>
                    We've sent a 6-digit code to <strong>{email}</strong>. Enter it below to proceed.
                  </p>
                </div>

                {/* Mock Code Preview Toast */}
                <div className="mock-code-helper">
                  <div className="helper-top">
                    <span className="helper-badge">🧪 Demo Simulator</span>
                    <button
                      type="button"
                      className="helper-autofill-btn"
                      onClick={handleFillDemoCode}
                    >
                      Autofill Code ({generatedCode})
                    </button>
                  </div>
                  <p className="helper-text">
                    In development mode, your mock verification code is:{" "}
                    <strong className="code-highlight">{generatedCode}</strong>
                  </p>
                </div>

                <form className="auth-form" onSubmit={handleVerifyCode}>
                  <div className="input-group">
                    <label className="input-label">
                      6-Digit Security Code <span className="required-star">*</span>
                    </label>
                    <div className="code-inputs-container">
                      {code.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`code-input-${idx}`}
                          type="text"
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handleCodeChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          className={`digit-box ${digit ? "filled" : ""} ${error ? "error" : ""}`}
                          autoFocus={idx === 0}
                          inputMode="numeric"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="code-resend-row">
                    {canResend ? (
                      <button
                        type="button"
                        className="resend-btn active"
                        onClick={handleResendCode}
                        disabled={loading}
                      >
                        🔄 Resend Verification Code
                      </button>
                    ) : (
                      <span className="resend-countdown">
                        ⏱️ Resend code in <strong>{timer}s</strong>
                      </span>
                    )}
                    <button
                      type="button"
                      className="change-email-btn"
                      onClick={() => {
                        setStep(1);
                        setCode(["", "", "", "", "", ""]);
                        setError("");
                      }}
                    >
                      Change Email
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading || code.join("").length < 6}
                  >
                    {loading ? "Verifying Code..." : "Verify & Continue →"}
                  </button>
                </form>
              </div>
            )}

            {/* ── STEP 3: SET NEW PASSWORD ── */}
            {step === 3 && (
              <div className="forgot-step-content">
                <div className="auth-header">
                  <span className="auth-header-tag">Step 3 of 3</span>
                  <h2>Set New Password</h2>
                  <p>
                    Create a strong, secure password for <strong>{email}</strong>.
                  </p>
                </div>

                <form className="auth-form" onSubmit={handleResetPassword}>
                  {/* New Password */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="new-password">
                      New Password <span className="required-star">*</span>
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon-left">🔒</span>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="new-password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="At least 8 characters"
                        className={`input-field ${error ? "error" : ""}`}
                        autoFocus
                        required
                      />
                      <button
                        type="button"
                        className="input-icon-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? "👁️" : "🙈"}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="password-strength-box">
                        <div className="strength-bar-track">
                          <div
                            className="strength-bar-fill"
                            style={{
                              width: `${passwordStrength.score}%`,
                              background: passwordStrength.color,
                            }}
                          />
                        </div>
                        <span
                          className="strength-text"
                          style={{ color: passwordStrength.color }}
                        >
                          Strength: {passwordStrength.text}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="confirm-password">
                      Confirm New Password <span className="required-star">*</span>
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon-left">🔒</span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Re-enter your new password"
                        className={`input-field ${error ? "error" : ""}`}
                        required
                      />
                      <button
                        type="button"
                        className="input-icon-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? "👁️" : "🙈"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading || !newPassword || !confirmPassword}
                  >
                    {loading ? "Updating Password..." : "Reset Password & Sign In →"}
                  </button>
                </form>
              </div>
            )}

            {/* ── STEP 4: SUCCESS CONFIRMATION ── */}
            {step === 4 && (
              <div className="forgot-step-content success-step">
                <div className="success-icon-circle">
                  <span>✓</span>
                </div>
                <div className="auth-header text-center">
                  <span className="auth-header-tag tag-success">Password Updated</span>
                  <h2>All Done!</h2>
                  <p>
                    Your password for <strong>{email}</strong> has been successfully reset. You can now sign in with your new credentials.
                  </p>
                </div>

                <div className="success-action-box">
                  <button
                    type="button"
                    className="auth-submit-btn"
                    onClick={() => navigate("/login", { state: { resetSuccess: true, email } })}
                  >
                    Proceed to Login →
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="auth-footer">
              Remember your password?
              <Link to="/login" className="auth-switch-link">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;
