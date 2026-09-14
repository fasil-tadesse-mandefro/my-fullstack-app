import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { validateEmail } from "../../utils/validateEmail";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState("student"); // "student" | "tutor"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gradeLevel: "High School (Grade 9-12)",
    learningFocus: "",
    subject: "Mathematics & Calculus",
    qualification: "Bachelor's Degree",
    experience: "3-5 years",
    hourlyRate: "25",
    agreeTerms: true,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [tutorDocuments, setTutorDocuments] = useState([]);

  const MAX_DOCUMENTS = 5;
  const MAX_FILE_SIZE_MB = 2;

  const getDocumentIcon = (type = "") => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("image")) return "🖼️";
    if (type.includes("word") || type.includes("document")) return "📝";
    return "📎";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const calculatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "None", classSuffix: "" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: "Weak (add numbers & uppercase)", classSuffix: "weak" };
    if (score === 2 || score === 3) return { score: 2, label: "Medium strength", classSuffix: "medium" };
    return { score: 3, label: "Strong password", classSuffix: "strong" };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

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

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === "student") {
      setTutorDocuments([]);
      setErrors((prev) => ({ ...prev, documents: "" }));
    }
  };

  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";

    if (files.length === 0) return;

    if (tutorDocuments.length + files.length > MAX_DOCUMENTS) {
      setErrors((prev) => ({
        ...prev,
        documents: `You can upload up to ${MAX_DOCUMENTS} documents.`,
      }));
      return;
    }

    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    const acceptedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const newDocs = [];

    for (const file of files) {
      if (file.size > maxBytes) {
        setErrors((prev) => ({
          ...prev,
          documents: `"${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB limit.`,
        }));
        return;
      }

      if (!acceptedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          documents: `"${file.name}" is not supported. Use PDF, JPG, PNG, or Word documents.`,
        }));
        return;
      }

      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      newDocs.push({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });
    }

    setTutorDocuments((prev) => [...prev, ...newDocs]);
    setErrors((prev) => ({ ...prev, documents: "" }));
  };

  const handleRemoveDocument = (docId) => {
    setTutorDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    setErrors((prev) => ({ ...prev, documents: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "Full name must be at least 2 characters.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (role === "tutor") {
      if (!formData.subject.trim()) {
        newErrors.subject = "Please specify your teaching subject.";
      }
      if (!formData.hourlyRate || Number(formData.hourlyRate) <= 0) {
        newErrors.hourlyRate = "Please specify a valid hourly rate.";
      }
      if (tutorDocuments.length === 0) {
        newErrors.documents = "Please upload at least one qualification document.";
      }
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the Terms of Service & Privacy Policy.";
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
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: role,
        ...(role === "student"
          ? {
              gradeLevel: formData.gradeLevel,
              learningFocus: formData.learningFocus,
            }
          : {
              subject: formData.subject,
              qualification: formData.qualification,
              experience: formData.experience,
              hourlyRate: formData.hourlyRate,
              documents: tutorDocuments,
            }),
      };

      const result = await register(payload);
      if (result.success) {
        if (result.pending) {
          setAuthSuccess(
            role === "tutor"
              ? "Tutor registration submitted! An admin must review your documents before you can sign in."
              : "Registration submitted! An admin must approve your account before you can sign in."
          );
          setTimeout(() => {
            navigate("/login", {
              state: {
                registrationPending: true,
                email: formData.email,
                role,
              },
            });
          }, 1500);
        } else {
          setAuthSuccess("Account created successfully! Preparing your dashboard...");
          setTimeout(() => {
            if (role === "student") {
              navigate("/student/dashboard");
            } else {
              navigate("/tutor/dashboard");
            }
          }, 600);
        }
      } else {
        setAuthError(result.message || "Registration failed. Please try again.");
      }
    } catch {
      setAuthError("An unexpected error occurred during registration.");
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

      {/* Main Container */}
      <main className="auth-main-content">
        <div className="auth-container register-mode">
          {/* Left Column: Hero Branding Showcase */}
          <div className="auth-branding-side">
            <div className="branding-top">
              <div className="brand-badge-pill">
                <span>✦</span> Join ABUGIDA Today
              </div>
              <h1 className="branding-title">
                Start Your Educational Transformation
              </h1>
              <p className="branding-description">
                Join thousands of Ethiopian students and tutors on the most advanced
                learning and tutoring network.
              </p>

              <ul className="branding-features">
                <li className="branding-feature-item">
                  <span className="feature-check-icon">✓</span>
                  <span>Personalized 1-on-1 tutoring matched to your curriculum</span>
                </li>
                <li className="branding-feature-item">
                  <span className="feature-check-icon">✓</span>
                  <span>Earn competitive income teaching subjects you love</span>
                </li>
                <li className="branding-feature-item">
                  <span className="feature-check-icon">✓</span>
                  <span>Instant access to self-paced verified video courses</span>
                </li>
              </ul>
            </div>

            {/* Testimonial */}
            <div className="branding-testimonial">
              <p className="testimonial-quote">
                "Teaching on Abugida helped me reach ambitious students across the country while having total control over my teaching schedule."
              </p>
              <div className="testimonial-author">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                  alt="Tutor avatar"
                  className="author-avatar"
                />
                <div className="author-info">
                  <h4>Yonas Haile</h4>
                  <p>Physics & Engineering Instructor</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="auth-form-side">
            <div className="auth-header">
              <span className="auth-header-tag">Get Started</span>
              <h2>Create Your Account</h2>
              <p>Select your account type to personalize your experience</p>
            </div>

            {/* Role Selection Cards */}
            <div className="role-tabs-grid" role="radiogroup" aria-label="Account Type">
              <button
                type="button"
                className={`role-tab-card ${role === "student" ? "selected" : ""}`}
                onClick={() => handleRoleChange("student")}
                role="radio"
                aria-checked={role === "student"}
              >
                <div className="role-tab-header">
                  <span className="role-tab-icon">🎓</span>
                  <span className="role-check">✓</span>
                </div>
                <div className="role-tab-title">I'm a Student</div>
                <div className="role-tab-desc">
                  Find expert tutors, book classes, and learn at my own pace.
                </div>
              </button>

              <button
                type="button"
                className={`role-tab-card ${role === "tutor" ? "selected" : ""}`}
                onClick={() => handleRoleChange("tutor")}
                role="radio"
                aria-checked={role === "tutor"}
              >
                <div className="role-tab-header">
                  <span className="role-tab-icon">👨‍🏫</span>
                  <span className="role-check">✓</span>
                </div>
                <div className="role-tab-title">I'm a Tutor</div>
                <div className="role-tab-desc">
                  Set hourly rates, conduct live classes, and publish courses.
                </div>
              </button>
            </div>

            {/* Alerts */}
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Full Name & Email Row */}
              <div className="form-row-2">
                <div className="input-group">
                  <label className="input-label" htmlFor="name">
                    Full Name
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon-left">👤</span>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="e.g. Abebe Kebede"
                      value={formData.name}
                      onChange={handleChange}
                      className={`input-field ${errors.name ? "error" : ""}`}
                      required
                    />
                  </div>
                  {errors.name && (
                    <span className="input-error-msg">⚠️ {errors.name}</span>
                  )}
                </div>

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
                      placeholder="e.g. name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`input-field ${errors.email ? "error" : ""}`}
                      required
                    />
                  </div>
                  {errors.email && (
                    <span className="input-error-msg">⚠️ {errors.email}</span>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div className="input-group">
                <label className="input-label" htmlFor="phone">
                  Phone Number <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon-left">📞</span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. +251 91 123 4567"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Dynamic Role-Specific Fields */}
              {role === "student" ? (
                <div className="form-row-2">
                  <div className="input-group">
                    <label className="input-label" htmlFor="gradeLevel">
                      Grade / Level
                    </label>
                    <select
                      id="gradeLevel"
                      name="gradeLevel"
                      value={formData.gradeLevel}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="Primary School (Grade 1-8)">Primary (Grade 1-8)</option>
                      <option value="High School (Grade 9-12)">High School (Grade 9-12)</option>
                      <option value="University / College">University / College</option>
                      <option value="Professional / Adult Learner">Professional / Adult</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="learningFocus">
                      Primary Subject Focus
                    </label>
                    <input
                      id="learningFocus"
                      name="learningFocus"
                      type="text"
                      placeholder="e.g. Math, Physics, English"
                      value={formData.learningFocus}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-row-2">
                    <div className="input-group">
                      <label className="input-label" htmlFor="subject">
                        Subject Expertise
                      </label>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder="e.g. Mathematics & Calculus"
                        value={formData.subject}
                        onChange={handleChange}
                        className={`input-field ${errors.subject ? "error" : ""}`}
                        required
                      />
                      {errors.subject && (
                        <span className="input-error-msg">⚠️ {errors.subject}</span>
                      )}
                    </div>

                    <div className="input-group">
                      <label className="input-label" htmlFor="hourlyRate">
                        Hourly Rate ($/hr)
                      </label>
                      <input
                        id="hourlyRate"
                        name="hourlyRate"
                        type="number"
                        min="5"
                        max="200"
                        placeholder="25"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                        className={`input-field ${errors.hourlyRate ? "error" : ""}`}
                        required
                      />
                      {errors.hourlyRate && (
                        <span className="input-error-msg">⚠️ {errors.hourlyRate}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="input-group">
                      <label className="input-label" htmlFor="qualification">
                        Highest Qualification
                      </label>
                      <select
                        id="qualification"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                        <option value="Master's Degree">Master's Degree</option>
                        <option value="Doctorate (Ph.D.)">Doctorate (Ph.D.)</option>
                        <option value="Certified Teacher">Certified Teacher</option>
                        <option value="University Student">University Student</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label" htmlFor="experience">
                        Teaching Experience
                      </label>
                      <select
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="1-2 years">1-2 years</option>
                        <option value="3-5 years">3-5 years</option>
                        <option value="5-8 years">5-8 years</option>
                        <option value="8+ years">8+ years</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      Qualification Documents <span className="required-mark">*</span>
                    </label>
                    <p className="input-hint">
                      Upload your degree, certificate, ID, or resume (PDF, JPG, PNG, Word — max {MAX_FILE_SIZE_MB}MB each, up to {MAX_DOCUMENTS} files).
                    </p>

                    <div className="document-upload-zone">
                      <input
                        id="tutorDocuments"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleDocumentUpload}
                        className="document-upload-input"
                        disabled={tutorDocuments.length >= MAX_DOCUMENTS}
                      />
                      <label
                        htmlFor="tutorDocuments"
                        className={`document-upload-btn ${tutorDocuments.length >= MAX_DOCUMENTS ? "disabled" : ""}`}
                      >
                        <span className="upload-btn-icon">📤</span>
                        <span>Upload Documents</span>
                      </label>
                    </div>

                    {tutorDocuments.length > 0 && (
                      <ul className="uploaded-documents-list">
                        {tutorDocuments.map((doc) => (
                          <li key={doc.id} className="uploaded-document-item">
                            <span className="uploaded-doc-icon">{getDocumentIcon(doc.type)}</span>
                            <div className="uploaded-doc-info">
                              <span className="uploaded-doc-name">{doc.name}</span>
                              <span className="uploaded-doc-size">{formatFileSize(doc.size)}</span>
                            </div>
                            <button
                              type="button"
                              className="uploaded-doc-remove"
                              onClick={() => handleRemoveDocument(doc.id)}
                              aria-label={`Remove ${doc.name}`}
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {errors.documents && (
                      <span className="input-error-msg">⚠️ {errors.documents}</span>
                    )}
                  </div>
                </>
              )}

              {/* Password & Confirm Password */}
              <div className="form-row-2">
                <div className="input-group">
                  <label className="input-label" htmlFor="password">
                    Create Password
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon-left">🔒</span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className={`input-field ${errors.password ? "error" : ""}`}
                      autoComplete="new-password"
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

                <div className="input-group">
                  <label className="input-label" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon-left">🔒</span>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`input-field ${errors.confirmPassword ? "error" : ""}`}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span className="input-error-msg">⚠️ {errors.confirmPassword}</span>
                  )}
                </div>
              </div>

              {/* Password Strength Meter */}
              {formData.password && (
                <div className="strength-meter-container">
                  <div className="strength-bar-bg">
                    <div
                      className={`strength-bar-fill strength-${passwordStrength.classSuffix}-bg`}
                    ></div>
                  </div>
                  <div className="strength-text">
                    <span className={`strength-${passwordStrength.classSuffix}`}>
                      Strength: {passwordStrength.label}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {passwordStrength.score >= 3 ? "✓ Strong" : "Requires: 8+ chars, capital, number"}
                    </span>
                  </div>
                </div>
              )}

              {/* Agree Terms Checkbox */}
              <div className="input-group">
                <label className="checkbox-label" htmlFor="agreeTerms">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    required
                  />
                  <span>
                    I agree to the <a href="#terms" className="forgot-link">Terms of Service</a> and{" "}
                    <a href="#privacy" className="forgot-link">Privacy Policy</a>
                  </span>
                </label>
                {errors.agreeTerms && (
                  <span className="input-error-msg">⚠️ {errors.agreeTerms}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? "Creating Account..." : `Complete ${role === "student" ? "Student" : "Tutor"} Registration →`}
              </button>
            </form>

            {/* Switch Footer */}
            <div className="auth-footer">
              Already have an account?
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

export default Register;
