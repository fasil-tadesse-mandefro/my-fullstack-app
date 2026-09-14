import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../../layout/Layout";
import { useAuth } from "../../context/AuthContext";
import "./StudentProfile.css";

// Preset avatars for students
const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
];

// Grade levels available for Ethiopian & international curriculum
const GRADE_LEVEL_OPTIONS = [
  "Grade 9",
  "Grade 10",
  "Grade 11 (Natural Science)",
  "Grade 11 (Social Science)",
  "Grade 12 (Natural Science)",
  "Grade 12 (Social Science)",
  "University / Undergraduate",
  "Postgraduate",
  "Adult Learner / Professional",
];

// Popular subject recommendations
const POPULAR_SUBJECT_PRESETS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Python",
  "SAT Prep",
  "National Exam Prep",
  "Economics",
  "History",
];

// Learning modes
const LEARNING_MODES = [
  { id: "1-on-1 Online", title: "1-on-1 Online", desc: "Live video lessons with private tutor" },
  { id: "Small Group", title: "Small Group", desc: "Interactive classes with 3-5 peers" },
  { id: "Hybrid / In-Person", title: "Hybrid / In-Person", desc: "Flexible online & in-person tutoring" },
];

// Tutoring time preferences
const TUTORING_TIMES = [
  { id: "Weekday Mornings", title: "Weekday Mornings", desc: "8:00 AM - 12:00 PM" },
  { id: "Weekday Evenings", title: "Weekday Afternoons & Evenings", desc: "3:00 PM - 8:00 PM" },
  { id: "Weekends", title: "Weekends (Sat & Sun)", desc: "Flexible morning or afternoon" },
  { id: "Flexible", title: "Fully Flexible", desc: "Any time based on tutor availability" },
];

function StudentProfile() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();

  // Storage key for extended preferences
  const storageKey = `abugida_student_ext_${user?.id || "guest"}`;

  // Active navigation tab: 'personal' | 'academic' | 'preferences' | 'security'
  const [activeTab, setActiveTab] = useState("personal");

  // Core database-backed state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [learningFocusList, setLearningFocusList] = useState([]);

  // Extended local preferences state
  const [schoolName, setSchoolName] = useState("");
  const [targetMajor, setTargetMajor] = useState("");
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState("");
  const [bio, setBio] = useState("");
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(10);
  const [preferredLearningMode, setPreferredLearningMode] = useState("1-on-1 Online");
  const [preferredTutoringTime, setPreferredTutoringTime] = useState("Weekday Evenings");
  const [tutorNotes, setTutorNotes] = useState("");

  // Notification toggles
  const [notifications, setNotifications] = useState({
    emailSessionReminders: true,
    smsAlerts: true,
    courseUpdates: true,
    promoOffers: false,
  });

  // UI state
  const [customSubjectInput, setCustomSubjectInput] = useState("");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedModalAvatar, setSelectedModalAvatar] = useState("");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error' | 'warning', message: '' }
  const [isDirty, setIsDirty] = useState(false);

  const fileInputRef = useRef(null);

  // Load existing profile data on mount or when user changes
  useEffect(() => {
    const initialName = user?.name || "Nahom Tadesse";
    const initialPhone = user?.phone || "+251 91 123 4567";
    const initialAvatar =
      user?.avatar ||
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80";
    const initialGrade = user?.gradeLevel || "Grade 11 (Natural Science)";
    
    // Parse learning focus string to list
    const focusRaw = user?.learningFocus || "Mathematics, Physics, Python";
    const parsedFocus = focusRaw
      ? focusRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : ["Mathematics", "Physics", "Python"];

    setName(initialName);
    setPhone(initialPhone);
    setAvatar(initialAvatar);
    setSelectedModalAvatar(initialAvatar);
    setGradeLevel(initialGrade);
    setLearningFocusList(parsedFocus);

    // Load extended preferences from localStorage
    try {
      const savedExt = localStorage.getItem(storageKey);
      if (savedExt) {
        const parsed = JSON.parse(savedExt);
        setSchoolName(parsed.schoolName || "Bole Senior Secondary School");
        setTargetMajor(parsed.targetMajor || "Computer Science / Software Engineering");
        setLocation(parsed.location || "Addis Ababa, Ethiopia");
        setLanguages(parsed.languages || "Amharic, English");
        setBio(
          parsed.bio ||
            "Passionate student aiming for top scores on the Ethiopian National Examination. Dedicated to mastering STEM subjects and problem solving."
        );
        setWeeklyGoalHours(parsed.weeklyGoalHours || 10);
        setPreferredLearningMode(parsed.preferredLearningMode || "1-on-1 Online");
        setPreferredTutoringTime(parsed.preferredTutoringTime || "Weekday Evenings");
        setTutorNotes(
          parsed.tutorNotes ||
            "I learn best with practical examples, step-by-step proofs, and interactive quizzes."
        );
        if (parsed.notifications) {
          setNotifications(parsed.notifications);
        }
      } else {
        // Defaults for first-time view
        setSchoolName("Bole Senior Secondary School");
        setTargetMajor("Computer Science / Software Engineering");
        setLocation("Addis Ababa, Ethiopia");
        setLanguages("Amharic, English");
        setBio(
          "Passionate student aiming for top scores on the Ethiopian National Examination. Dedicated to mastering STEM subjects and problem solving."
        );
      }
    } catch {
      // Ignore JSON parse errors
    }

    setIsDirty(false);
  }, [user, storageKey]);

  // Mark form as dirty on modification
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Calculate profile completeness score
  const completeness = useMemo(() => {
    const fields = [
      name.trim(),
      phone.trim(),
      avatar.trim(),
      gradeLevel.trim(),
      learningFocusList.length > 0,
      schoolName.trim(),
      targetMajor.trim(),
      location.trim(),
      bio.trim(),
      weeklyGoalHours > 0,
    ];
    const filledCount = fields.filter(Boolean).length;
    return Math.round((filledCount / fields.length) * 100);
  }, [
    name,
    phone,
    avatar,
    gradeLevel,
    learningFocusList,
    schoolName,
    targetMajor,
    location,
    bio,
    weeklyGoalHours,
  ]);

  // Handle adding subject pill
  const handleAddSubject = (subjectName) => {
    const clean = subjectName.trim();
    if (!clean) return;
    if (learningFocusList.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setAlert({
        type: "warning",
        message: `"${clean}" is already in your learning focus list.`,
      });
      return;
    }
    setLearningFocusList((prev) => [...prev, clean]);
    setCustomSubjectInput("");
    markDirty();
  };

  // Handle removing subject pill
  const handleRemoveSubject = (subjectToRemove) => {
    setLearningFocusList((prev) => prev.filter((s) => s !== subjectToRemove));
    markDirty();
  };

  // Avatar file upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAlert({ type: "error", message: "Please select a valid image file (PNG, JPG, WebP)." });
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setAlert({ type: "error", message: "Image size must be smaller than 3MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedModalAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Confirm avatar modal selection
  const handleConfirmAvatar = () => {
    const newAvatar = customAvatarUrl.trim() || selectedModalAvatar;
    if (newAvatar) {
      setAvatar(newAvatar);
      markDirty();
    }
    setIsAvatarModalOpen(false);
    setCustomAvatarUrl("");
  };

  // Main save handler
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setAlert(null);

    // Basic validation
    if (!name.trim()) {
      setAlert({ type: "error", message: "Full Name cannot be left blank." });
      setIsSaving(false);
      return;
    }

    try {
      const learningFocusString = learningFocusList.join(", ");

      // 1. Sync core fields with database via updateProfile
      const result = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatar.trim(),
        gradeLevel: gradeLevel.trim(),
        learningFocus: learningFocusString,
      });

      // 2. Persist extended preferences in localStorage
      const extendedData = {
        schoolName: schoolName.trim(),
        targetMajor: targetMajor.trim(),
        location: location.trim(),
        languages: languages.trim(),
        bio: bio.trim(),
        weeklyGoalHours: Number(weeklyGoalHours),
        preferredLearningMode,
        preferredTutoringTime,
        tutorNotes: tutorNotes.trim(),
        notifications,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(extendedData));

      setIsDirty(false);
      setAlert({
        type: "success",
        message: result?.message || "Your student profile has been updated and saved successfully!",
      });

      // Automatically hide alert after 4 seconds
      setTimeout(() => {
        setAlert((prev) => (prev?.type === "success" ? null : prev));
      }, 4000);
    } catch (err) {
      console.error("Save error:", err);
      setAlert({
        type: "error",
        message: err.message || "Failed to save profile changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Discard changes and revert to current saved state
  const handleDiscardChanges = () => {
    if (window.confirm("Are you sure you want to discard your unsaved changes?")) {
      window.location.reload();
    }
  };

  return (
    <Layout>
      <div className="student-profile-page">
        {/* Hero Banner with Completeness Meter */}
        <section className="profile-hero">
          <div className="container profile-hero-content">
            <nav className="profile-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span className="profile-breadcrumb-sep">/</span>
              <Link to="/student/dashboard">Student Dashboard</Link>
              <span className="profile-breadcrumb-sep">/</span>
              <span className="profile-breadcrumb-current">Student Profile</span>
            </nav>

            <div className="profile-hero-main">
              <div className="profile-hero-title">
                <h1>Student Profile & Learning Preferences</h1>
                <p>
                  Customize your academic goals, personal information, and tutoring preferences to get
                  personalized tutor matches and track your learning journey.
                </p>
              </div>

              <div className="profile-completeness-card">
                <div className="completeness-header">
                  <span className="completeness-label">Profile Strength</span>
                  <span className="completeness-value">{completeness}%</span>
                </div>
                <div className="completeness-bar-bg" role="progressbar" aria-valuenow={completeness} aria-valuemin="0" aria-valuemax="100">
                  <div className="completeness-bar-fill" style={{ width: `${completeness}%` }}></div>
                </div>
                <div className="completeness-hint">
                  {completeness >= 90
                    ? "✨ Your profile is complete and optimized!"
                    : "Fill in all fields to unlock prioritized tutor matching."}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <div className="container profile-container">
          <div className="profile-layout-grid">
            {/* Left Column: Identity Sidebar */}
            <aside className="profile-sidebar">
              {/* Identity Card */}
              <div className="profile-card identity-card">
                <div className="identity-card-banner"></div>
                <div className="identity-card-body">
                  <div
                    className="avatar-wrapper"
                    onClick={() => setIsAvatarModalOpen(true)}
                    title="Click to update photo"
                  >
                    <img
                      src={avatar || AVATAR_PRESETS[0]}
                      alt={name || "Student Avatar"}
                      className="avatar-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = AVATAR_PRESETS[0];
                      }}
                    />
                    <div className="avatar-edit-overlay">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </div>
                  </div>

                  <h2 className="identity-name">{name || "Student"}</h2>
                  <div className="identity-role-badge">
                    <span>🎓</span>
                    <span>Student Learner</span>
                  </div>
                  <div className="identity-grade">{gradeLevel || "Grade 11 (Natural Science)"}</div>

                  <div className="identity-meta-list">
                    <div className="meta-row">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      <span>{user?.email || "student@abugida.com"}</span>
                    </div>
                    <div className="meta-row">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{location || "Addis Ababa, Ethiopia"}</span>
                    </div>
                    <div className="meta-row">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <span>{schoolName || "Bole Senior High"}</span>
                    </div>
                    <div className="meta-row">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>Goal: <strong>{weeklyGoalHours} hrs/week</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Summary */}
              <div className="profile-card stats-summary-card">
                <div className="stats-card-title">
                  <span>Learning Stats</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </div>
                <div className="stats-grid-compact">
                  <div className="stat-box">
                    <div className="stat-box-val">12</div>
                    <div className="stat-box-lbl">Sessions Done</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-box-val">28.5</div>
                    <div className="stat-box-lbl">Hours Learned</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-box-val">{learningFocusList.length}</div>
                    <div className="stat-box-lbl">Focus Subjects</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-box-val">4.9</div>
                    <div className="stat-box-lbl">Student Rating</div>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Shortcuts */}
              <div className="profile-card nav-shortcuts-card">
                <div className="nav-shortcuts-title">Quick Actions</div>
                <ul className="shortcut-link-list">
                  <li className="shortcut-link-item">
                    <Link to="/student/dashboard">
                      <span className="shortcut-left">
                        <span>📊</span>
                        <span>Student Dashboard</span>
                      </span>
                      <span>→</span>
                    </Link>
                  </li>
                  <li className="shortcut-link-item">
                    <Link to="/student/bookings">
                      <span className="shortcut-left">
                        <span>📅</span>
                        <span>My Bookings</span>
                      </span>
                      <span>→</span>
                    </Link>
                  </li>
                  <li className="shortcut-link-item">
                    <Link to="/tutors">
                      <span className="shortcut-left">
                        <span>🔍</span>
                        <span>Find Expert Tutors</span>
                      </span>
                      <span>→</span>
                    </Link>
                  </li>
                  <li className="shortcut-link-item">
                    <Link to="/courses">
                      <span className="shortcut-left">
                        <span>📖</span>
                        <span>Browse Courses</span>
                      </span>
                      <span>→</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </aside>

            {/* Right Column: Tabbed Management */}
            <main className="profile-main-content">
              {/* Tabs Navigation */}
              <div className="profile-tabs-card">
                <div className="profile-tabs-nav" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "personal"}
                    className={`profile-tab-btn ${activeTab === "personal" ? "active" : ""}`}
                    onClick={() => setActiveTab("personal")}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Personal Info</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "academic"}
                    className={`profile-tab-btn ${activeTab === "academic" ? "active" : ""}`}
                    onClick={() => setActiveTab("academic")}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <span>Academic & Subjects</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "preferences"}
                    className={`profile-tab-btn ${activeTab === "preferences" ? "active" : ""}`}
                    onClick={() => setActiveTab("preferences")}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>Study Schedule</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "security"}
                    className={`profile-tab-btn ${activeTab === "security" ? "active" : ""}`}
                    onClick={() => setActiveTab("security")}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>Account & Security</span>
                  </button>
                </div>
              </div>

              {/* Tab Panel Form Card */}
              <div className="tab-panel-card">
                {/* Feedback Alerts */}
                {alert && (
                  <div className={`profile-alert profile-alert-${alert.type}`} role="alert">
                    <span>{alert.message}</span>
                    <button
                      type="button"
                      className="profile-alert-close"
                      onClick={() => setAlert(null)}
                      aria-label="Dismiss alert"
                    >
                      ×
                    </button>
                  </div>
                )}

                <form onSubmit={handleSaveProfile}>
                  {/* TAB 1: Personal Information */}
                  {activeTab === "personal" && (
                    <div className="tab-section">
                      <div className="tab-panel-header">
                        <div className="tab-panel-title">
                          <h2>Personal Information</h2>
                          <p>Manage your public identity, contact details, and location.</p>
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">
                            Full Name
                            <span className="form-label-badge">Required</span>
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => {
                              setName(e.target.value);
                              markDirty();
                            }}
                            placeholder="e.g. Nahom Tadesse"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            Registered Email Address
                            <span className="form-label-badge">Verified (Read-only)</span>
                          </label>
                          <input
                            type="email"
                            className="form-input"
                            value={user?.email || "student@abugida.com"}
                            disabled
                            title="Email address cannot be changed directly."
                          />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Phone Number</label>
                          <input
                            type="tel"
                            className="form-input"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              markDirty();
                            }}
                            placeholder="+251 91 123 4567"
                          />
                          <span className="form-hint">Used for important booking updates and SMS session alerts.</span>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Location / City</label>
                          <input
                            type="text"
                            className="form-input"
                            value={location}
                            onChange={(e) => {
                              setLocation(e.target.value);
                              markDirty();
                            }}
                            placeholder="e.g. Addis Ababa, Ethiopia"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Primary Languages</label>
                        <input
                          type="text"
                          className="form-input"
                          value={languages}
                          onChange={(e) => {
                            setLanguages(e.target.value);
                            markDirty();
                          }}
                          placeholder="e.g. Amharic, English, Oromo"
                        />
                        <span className="form-hint">Languages you are comfortable learning and communicating in.</span>
                      </div>

                      <div className="form-group">
                        <label className="form-label">About Me / Bio</label>
                        <textarea
                          className="form-textarea"
                          value={bio}
                          onChange={(e) => {
                            setBio(e.target.value);
                            markDirty();
                          }}
                          placeholder="Share a brief introduction, your learning style, or what drives your academic journey..."
                        ></textarea>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Academic & Subjects */}
                  {activeTab === "academic" && (
                    <div className="tab-section">
                      <div className="tab-panel-header">
                        <div className="tab-panel-title">
                          <h2>Academic Background & Learning Focus</h2>
                          <p>Specify your current level of education and subjects you want to excel in.</p>
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">
                            Grade / Education Level
                            <span className="form-label-badge">Required</span>
                          </label>
                          <select
                            className="form-select"
                            value={gradeLevel}
                            onChange={(e) => {
                              setGradeLevel(e.target.value);
                              markDirty();
                            }}
                          >
                            {GRADE_LEVEL_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Current School / Institution</label>
                          <input
                            type="text"
                            className="form-input"
                            value={schoolName}
                            onChange={(e) => {
                              setSchoolName(e.target.value);
                              markDirty();
                            }}
                            placeholder="e.g. Bole Senior Secondary School"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Target Field of Study / University Dream</label>
                        <input
                          type="text"
                          className="form-input"
                          value={targetMajor}
                          onChange={(e) => {
                            setTargetMajor(e.target.value);
                            markDirty();
                          }}
                          placeholder="e.g. Software Engineering at AAU, Medicine, Architecture..."
                        />
                      </div>

                      {/* Learning Focus Subjects Tag Manager */}
                      <div className="form-group">
                        <label className="form-label">
                          <span>Focus Subjects & Learning Goals</span>
                          <span className="form-label-badge">{learningFocusList.length} Selected</span>
                        </label>

                        {/* Current selected tag chips */}
                        <div className="tags-container">
                          {learningFocusList.length === 0 ? (
                            <span className="form-hint">No focus subjects selected yet. Pick or add below.</span>
                          ) : (
                            learningFocusList.map((subj) => (
                              <span key={subj} className="tag-pill">
                                <span>{subj}</span>
                                <button
                                  type="button"
                                  className="tag-remove-btn"
                                  onClick={() => handleRemoveSubject(subj)}
                                  title={`Remove ${subj}`}
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          )}
                        </div>

                        {/* Tag custom adder input */}
                        <div className="tag-adder-row">
                          <input
                            type="text"
                            className="form-input"
                            value={customSubjectInput}
                            onChange={(e) => setCustomSubjectInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSubject(customSubjectInput);
                              }
                            }}
                            placeholder="Type a subject or topic (e.g. Calculus, SAT Verbal) and press Enter"
                          />
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleAddSubject(customSubjectInput)}
                          >
                            Add
                          </button>
                        </div>

                        {/* Preset Subject suggestions */}
                        <div className="tag-presets-label">Popular Subjects in Abugida:</div>
                        <div className="tag-presets-row">
                          {POPULAR_SUBJECT_PRESETS.filter(
                            (p) => !learningFocusList.includes(p)
                          ).map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              className="preset-chip-btn"
                              onClick={() => handleAddSubject(preset)}
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Study Schedule & Preferences */}
                  {activeTab === "preferences" && (
                    <div className="tab-section">
                      <div className="tab-panel-header">
                        <div className="tab-panel-title">
                          <h2>Study Schedule & Learning Preferences</h2>
                          <p>Set your target study hours, preferred time slots, and learning environment.</p>
                        </div>
                      </div>

                      {/* Weekly Goal Slider */}
                      <div className="slider-group">
                        <div className="slider-header">
                          <div>
                            <span className="form-label">Weekly Tutoring & Study Target</span>
                            <span className="form-hint">Recommended: 8-15 hours for optimal score gains</span>
                          </div>
                          <span className="slider-val-badge">{weeklyGoalHours} Hours / Week</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="30"
                          step="1"
                          className="range-input"
                          value={weeklyGoalHours}
                          onChange={(e) => {
                            setWeeklyGoalHours(e.target.value);
                            markDirty();
                          }}
                        />
                      </div>

                      {/* Preferred Learning Mode */}
                      <div className="form-group">
                        <label className="form-label">Preferred Learning Mode</label>
                        <div className="selection-cards-grid">
                          {LEARNING_MODES.map((mode) => (
                            <div
                              key={mode.id}
                              className={`selection-card ${
                                preferredLearningMode === mode.id ? "selected" : ""
                              }`}
                              onClick={() => {
                                setPreferredLearningMode(mode.id);
                                markDirty();
                              }}
                            >
                              <div className="selection-card-title">{mode.title}</div>
                              <div className="selection-card-desc">{mode.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Preferred Tutoring Times */}
                      <div className="form-group" style={{ marginTop: "1.5rem" }}>
                        <label className="form-label">Preferred Session Time Slot</label>
                        <div className="selection-cards-grid">
                          {TUTORING_TIMES.map((timeSlot) => (
                            <div
                              key={timeSlot.id}
                              className={`selection-card ${
                                preferredTutoringTime === timeSlot.id ? "selected" : ""
                              }`}
                              onClick={() => {
                                setPreferredTutoringTime(timeSlot.id);
                                markDirty();
                              }}
                            >
                              <div className="selection-card-title">{timeSlot.title}</div>
                              <div className="selection-card-desc">{timeSlot.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes for Tutors */}
                      <div className="form-group" style={{ marginTop: "1.5rem" }}>
                        <label className="form-label">Special Notes & Tutor Accommodations</label>
                        <textarea
                          className="form-textarea"
                          value={tutorNotes}
                          onChange={(e) => {
                            setTutorNotes(e.target.value);
                            markDirty();
                          }}
                          placeholder="Let your tutors know how you learn best (e.g., visual diagrams, plenty of practice exercises, fast-paced reviews)..."
                        ></textarea>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: Account & Security */}
                  {activeTab === "security" && (
                    <div className="tab-section">
                      <div className="tab-panel-header">
                        <div className="tab-panel-title">
                          <h2>Account Status & Notification Preferences</h2>
                          <p>Review your account credentials, security preferences, and alert settings.</p>
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Account Verification Status</label>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem" }}>
                            <span style={{ color: "#10b981", fontSize: "1.2rem" }}>●</span>
                            <span style={{ fontWeight: 600, color: "#065f46" }}>Approved & Active Student</span>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Student ID</label>
                          <input
                            type="text"
                            className="form-input"
                            value={user?.id || "usr-student-01"}
                            disabled
                          />
                        </div>
                      </div>

                      {/* Notifications Toggles */}
                      <div style={{ marginTop: "1rem" }}>
                        <div className="form-label" style={{ marginBottom: "0.75rem" }}>
                          Communication & Alerts
                        </div>

                        <div className="toggle-item">
                          <div>
                            <div className="toggle-info-title">Upcoming Session Reminders</div>
                            <div className="toggle-info-desc">
                              Receive email notifications 1 hour before scheduled 1-on-1 tutoring sessions.
                            </div>
                          </div>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={notifications.emailSessionReminders}
                              onChange={(e) => {
                                setNotifications((prev) => ({
                                  ...prev,
                                  emailSessionReminders: e.target.checked,
                                }));
                                markDirty();
                              }}
                            />
                            <span className="slider-round"></span>
                          </label>
                        </div>

                        <div className="toggle-item">
                          <div>
                            <div className="toggle-info-title">SMS Notifications</div>
                            <div className="toggle-info-desc">
                              Get critical booking confirmations and session links via SMS to {phone || "your phone"}.
                            </div>
                          </div>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={notifications.smsAlerts}
                              onChange={(e) => {
                                setNotifications((prev) => ({
                                  ...prev,
                                  smsAlerts: e.target.checked,
                                }));
                                markDirty();
                              }}
                            />
                            <span className="slider-round"></span>
                          </label>
                        </div>

                        <div className="toggle-item">
                          <div>
                            <div className="toggle-info-title">Course & Curriculum Updates</div>
                            <div className="toggle-info-desc">
                              Stay notified when tutors upload new lessons or video materials in your enrolled subjects.
                            </div>
                          </div>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={notifications.courseUpdates}
                              onChange={(e) => {
                                setNotifications((prev) => ({
                                  ...prev,
                                  courseUpdates: e.target.checked,
                                }));
                                markDirty();
                              }}
                            />
                            <span className="slider-round"></span>
                          </label>
                        </div>

                        <div className="toggle-item">
                          <div>
                            <div className="toggle-info-title">Promotional Offers & Workshops</div>
                            <div className="toggle-info-desc">
                              Receive news about weekend workshops, scholarship events, and discount passes.
                            </div>
                          </div>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={notifications.promoOffers}
                              onChange={(e) => {
                                setNotifications((prev) => ({
                                  ...prev,
                                  promoOffers: e.target.checked,
                                }));
                                markDirty();
                              }}
                            />
                            <span className="slider-round"></span>
                          </label>
                        </div>
                      </div>

                      {/* Sign out and session controls */}
                      <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color, #e2e8f0)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.95rem" }}>
                              Session Management
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                              Sign out of your Abugida student account on this device.
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-danger-outline"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to sign out?")) {
                                logout();
                                navigate("/login");
                              }
                            }}
                          >
                            Sign Out of Abugida
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sticky / Bottom Form Action Buttons */}
                  <div className="form-actions-bar">
                    <div className="dirty-state-indicator">
                      {isDirty ? (
                        <>
                          <span className="dirty-dot"></span>
                          <span>You have unsaved profile changes</span>
                        </>
                      ) : (
                        <span style={{ color: "#10b981", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                          ✓ All changes synced
                        </span>
                      )}
                    </div>

                    <div className="form-action-buttons">
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={!isDirty || isSaving}
                        onClick={handleDiscardChanges}
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="16"></circle>
                            </svg>
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                              <polyline points="17 21 17 13 7 13 7 21"></polyline>
                              <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            <span>Save Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </main>
          </div>
        </div>

        {/* Modal: Avatar Picker & Upload */}
        {isAvatarModalOpen && (
          <div
            className="avatar-modal-backdrop"
            onClick={() => setIsAvatarModalOpen(false)}
          >
            <div
              className="avatar-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="avatar-modal-header">
                <h3>Select Student Avatar</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsAvatarModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="avatar-modal-body">
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.65rem", color: "var(--text-primary)" }}>
                    Choose from Curated Presets
                  </div>
                  <div className="avatar-presets-grid">
                    {AVATAR_PRESETS.map((url, idx) => (
                      <div
                        key={idx}
                        className={`avatar-preset-item ${
                          selectedModalAvatar === url ? "selected" : ""
                        }`}
                        onClick={() => setSelectedModalAvatar(url)}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-divider">
                  <span>OR</span>
                </div>

                <div>
                  <label className="form-label" style={{ marginBottom: "0.4rem" }}>
                    Image Web URL
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                <div className="modal-divider">
                  <span>OR</span>
                </div>

                <div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📁 Upload Image from Device
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  <div className="form-hint" style={{ textAlign: "center", marginTop: "0.35rem" }}>
                    Supports PNG, JPG, WebP up to 3MB
                  </div>
                </div>
              </div>

              <div className="avatar-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAvatarModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleConfirmAvatar}
                >
                  Apply Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default StudentProfile;
