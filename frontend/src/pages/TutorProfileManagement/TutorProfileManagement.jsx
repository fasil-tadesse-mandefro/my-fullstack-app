import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { tutorsApi } from "../../lib/api";
import "./TutorProfileManagement.css";

const DEFAULT_SUBJECT_OPTIONS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Computer Science",
  "Economics",
  "History",
];

const DEFAULT_LEVEL_OPTIONS = [
  "Primary (Grade 1 - 8)",
  "Secondary (Grade 9 - 10)",
  "Preparatory (Grade 11 - 12)",
  "University & College",
  "Career & Adult Learning",
];

const COMMON_LANGUAGES = [
  "Amharic (Native)",
  "English (Fluent)",
  "Afaan Oromo",
  "Tigrinya",
  "Somali",
  "French",
  "Arabic",
];

const COMMON_TAGS = [
  "Exam Prep",
  "Grade 12",
  "University Entrance",
  "Calculus",
  "Algebra",
  "Spoken English",
  "Remedial Classes",
];

const PAYMENT_TYPE_OPTIONS = [
  { value: "Telebirr", label: "Telebirr Mobile Money", icon: "📱", color: "#0284c7" },
  { value: "Commercial Bank of Ethiopia (CBE)", label: "Commercial Bank of Ethiopia (CBE)", icon: "🏦", color: "#7c3aed" },
  { value: "Awash Bank", label: "Awash Bank", icon: "🏛️", color: "#d97706" },
  { value: "Bank of Abyssinia (BOA)", label: "Bank of Abyssinia (BOA)", icon: "🏛️", color: "#059669" },
  { value: "CBE Birr", label: "CBE Birr Wallet", icon: "💳", color: "#9333ea" },
  { value: "Dashen Bank / Amole", label: "Dashen Bank / Amole", icon: "🏦", color: "#dc2626" },
  { value: "Other Bank", label: "Other Local Bank / Custom", icon: "🏦", color: "#475569" },
];

function TutorProfileManagement() {
  const { user, updateProfile } = useAuth();

  const [profile, setProfile] = useState({
    fullName: user?.name || "",
    tagline: "",
    bio: user?.bio || "",
    teachingMethod: "",
    qualifications: user?.qualification || user?.qualifications || "",
    experience: user?.experience || "",
    location: "Addis Ababa, Ethiopia",
    subjects: user?.subject ? [user.subject] : [],
    educationLevels: user?.educationLevel ? [user.educationLevel] : [],
    hourlyRate: String(user?.hourlyRate || "25"),
    avatar: user?.avatar_url || user?.avatar || "",
    languages: [],
    education: [],
    certifications: [],
    tags: [],
    paymentMethods: [],
  });

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Sub-detail input states
  const [newLangInput, setNewLangInput] = useState("");
  const [newCertInput, setNewCertInput] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [customSubjectInput, setCustomSubjectInput] = useState("");
  const [newEdu, setNewEdu] = useState({
    degree: "",
    institution: "",
    year: "",
  });

  // Payment Method modal states
  const [editingMethodId, setEditingMethodId] = useState(null);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [methodForm, setMethodForm] = useState({
    type: "Telebirr",
    accountName: user?.name || "",
    accountNumber: "",
    branch: "",
    instructions: "Transfer tuition and write your Booking ID in the note.",
    qrCode: "",
    isPrimary: false,
  });

  // Fetch real profile data from backend on load
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    Promise.allSettled([
      tutorsApi.getProfile(user.id),
      tutorsApi.getPaymentMethods(user.id),
    ])
      .then(([profileRes, paymentsRes]) => {
        const tutor = profileRes.status === "fulfilled" && profileRes.value?.tutor ? profileRes.value.tutor : null;
        const pMethods = paymentsRes.status === "fulfilled" && Array.isArray(paymentsRes.value?.paymentMethods)
          ? paymentsRes.value.paymentMethods
          : [];

        if (tutor) {
          setProfile((prev) => ({
            ...prev,
            fullName: tutor.name || user.name || prev.fullName,
            tagline: tutor.tagline || prev.tagline,
            bio: tutor.bio || prev.bio,
            teachingMethod: tutor.teachingMethod || prev.teachingMethod,
            qualifications: tutor.qualification || prev.qualifications,
            experience: tutor.experience || prev.experience,
            location: tutor.location || prev.location,
            hourlyRate: String(tutor.hourlyRate || tutor.price || prev.hourlyRate),
            avatar: tutor.avatar || tutor.avatar_url || user.avatar_url || prev.avatar,
            subjects: Array.isArray(tutor.subjects) && tutor.subjects.length > 0
              ? tutor.subjects
              : (tutor.subject ? [tutor.subject] : prev.subjects),
            educationLevels: Array.isArray(tutor.educationLevels) && tutor.educationLevels.length > 0
              ? tutor.educationLevels
              : (tutor.educationLevel ? [tutor.educationLevel] : prev.educationLevels),
            languages: Array.isArray(tutor.languages) ? tutor.languages : [],
            education: Array.isArray(tutor.education) ? tutor.education : [],
            certifications: Array.isArray(tutor.certifications) ? tutor.certifications : [],
            tags: Array.isArray(tutor.tags) ? tutor.tags : [],
            paymentMethods: pMethods.map((m) => ({
              id: m.id,
              type: m.type,
              accountName: m.account_name || m.accountName,
              accountNumber: m.account_number || m.accountNumber,
              branch: m.branch,
              instructions: m.instructions,
              qrCode: m.qr_code || m.qrCode,
              isPrimary: Boolean(m.is_primary ?? m.isPrimary),
            })),
          }));
        }
      })
      .catch((err) => {
        console.error("Failed to load tutor profile details:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.id, user?.name, user?.avatar_url]);

  const updateField = (event) => {
    setSaved(false);
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const toggleSelection = (field, value) => {
    setSaved(false);
    setProfile((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSaved(false);
      setProfile((current) => ({ ...current, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // 1. Languages handlers
  const handleAddLanguage = (langToAdd) => {
    const lang = (langToAdd || newLangInput).trim();
    if (!lang) return;
    setSaved(false);
    if (!profile.languages.includes(lang)) {
      setProfile((prev) => ({ ...prev, languages: [...prev.languages, lang] }));
    }
    setNewLangInput("");
  };

  const handleRemoveLanguage = (langToRemove) => {
    setSaved(false);
    setProfile((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== langToRemove),
    }));
  };

  // 2. Education handlers
  const handleAddEducation = (e) => {
    e?.preventDefault();
    if (!newEdu.degree.trim() || !newEdu.institution.trim()) return;
    setSaved(false);
    const item = {
      id: `edu-${Date.now()}`,
      degree: newEdu.degree.trim(),
      institution: newEdu.institution.trim(),
      year: newEdu.year ? parseInt(newEdu.year, 10) : null,
    };
    setProfile((prev) => ({ ...prev, education: [...prev.education, item] }));
    setNewEdu({ degree: "", institution: "", year: "" });
  };

  const handleRemoveEducation = (index) => {
    setSaved(false);
    setProfile((prev) => ({
      ...prev,
      education: prev.education.filter((_, idx) => idx !== index),
    }));
  };

  // 3. Certifications handlers
  const handleAddCertification = (e) => {
    e?.preventDefault();
    const cert = newCertInput.trim();
    if (!cert) return;
    setSaved(false);
    if (!profile.certifications.includes(cert)) {
      setProfile((prev) => ({ ...prev, certifications: [...prev.certifications, cert] }));
    }
    setNewCertInput("");
  };

  const handleRemoveCertification = (index) => {
    setSaved(false);
    setProfile((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, idx) => idx !== index),
    }));
  };

  // 4. Tags handlers
  const handleAddTag = (tagToAdd) => {
    const tag = (tagToAdd || newTagInput).trim();
    if (!tag) return;
    setSaved(false);
    if (!profile.tags.includes(tag)) {
      setProfile((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (index) => {
    setSaved(false);
    setProfile((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, idx) => idx !== index),
    }));
  };

  // 5. Custom Subject handler
  const handleAddCustomSubject = (e) => {
    e?.preventDefault();
    const subj = customSubjectInput.trim();
    if (!subj) return;
    setSaved(false);
    if (!profile.subjects.includes(subj)) {
      setProfile((prev) => ({ ...prev, subjects: [...prev.subjects, subj] }));
    }
    setCustomSubjectInput("");
  };

  // Payment Method handlers
  const handleOpenAddMethod = () => {
    setEditingMethodId(null);
    setMethodForm({
      type: "Telebirr",
      accountName: profile.fullName || user?.name || "",
      accountNumber: "",
      branch: "",
      instructions: "Transfer tuition and write your Booking ID in the note.",
      qrCode: "",
      isPrimary: profile.paymentMethods.length === 0,
    });
    setShowAddMethodModal(true);
  };

  const handleEditMethod = (method) => {
    setEditingMethodId(method.id);
    setMethodForm({ ...method });
    setShowAddMethodModal(true);
  };

  const handleDeleteMethod = (methodId) => {
    setSaved(false);
    setProfile((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((m) => m.id !== methodId),
    }));
  };

  const handleSetPrimaryMethod = (methodId) => {
    setSaved(false);
    setProfile((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((m) => ({
        ...m,
        isPrimary: m.id === methodId,
      })),
    }));
  };

  const handleQrUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMethodForm((prev) => ({ ...prev, qrCode: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMethod = (e) => {
    e.preventDefault();
    setSaved(false);

    if (editingMethodId) {
      setProfile((prev) => ({
        ...prev,
        paymentMethods: prev.paymentMethods.map((m) =>
          m.id === editingMethodId
            ? { ...methodForm, id: editingMethodId }
            : methodForm.isPrimary
            ? { ...m, isPrimary: false }
            : m
        ),
      }));
    } else {
      const newMethod = {
        ...methodForm,
        id: `pm-${Date.now()}`,
      };
      setProfile((prev) => ({
        ...prev,
        paymentMethods: methodForm.isPrimary
          ? [newMethod, ...prev.paymentMethods.map((m) => ({ ...m, isPrimary: false }))]
          : [...prev.paymentMethods, newMethod],
      }));
    }

    setShowAddMethodModal(false);
    setEditingMethodId(null);
  };

  // Submit all changes to Backend API
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaved(false);

    const tutorId = user?.id;
    if (!tutorId) return;

    try {
      // 1. Atomic Profile Update across users, tutor_profiles, and the 6 sub-tables
      const payload = {
        name: profile.fullName,
        bio: profile.bio,
        tagline: profile.tagline,
        teachingMethod: profile.teachingMethod,
        qualification: profile.qualifications,
        experience: profile.experience,
        location: profile.location,
        hourlyRate: Number(profile.hourlyRate),
        avatar: profile.avatar,
        subjects: profile.subjects,
        educationLevels: profile.educationLevels,
        languages: profile.languages,
        education: profile.education,
        certifications: profile.certifications,
        tags: profile.tags,
      };

      await Promise.all([
        tutorsApi.updateProfile(tutorId, payload),
        tutorsApi.savePaymentMethods(tutorId, profile.paymentMethods),
      ]);

      // Update AuthContext session state
      updateProfile({
        name: profile.fullName,
        bio: profile.bio,
        qualification: profile.qualifications,
        experience: profile.experience,
        hourlyRate: Number(profile.hourlyRate),
        avatar: profile.avatar,
        subject: profile.subjects[0] || "",
        subjects: profile.subjects,
        educationLevels: profile.educationLevels,
        languages: profile.languages,
      });

      // Persist fallback in local storage for instant offline / student checkout consistency
      try {
        const storedTutors = localStorage.getItem("abugida_tutor_payment_methods");
        const currentMap = storedTutors ? JSON.parse(storedTutors) : {};
        currentMap[tutorId] = profile.paymentMethods;
        currentMap[profile.fullName.toLowerCase()] = profile.paymentMethods;
        localStorage.setItem("abugida_tutor_payment_methods", JSON.stringify(currentMap));
      } catch (e) {}

      setSaved(true);
      setSaveMessage("Profile and credentials updated successfully!");
      setTimeout(() => setSaved(false), 5000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile: " + (err.message || "Unknown error"));
    }
  };

  return (
    <Layout>
      <main className="tutor-profile-page">
        <div className="container tutor-profile-container">
          <div className="profile-page-heading">
            <div>
              <p className="profile-kicker">Tutor workspace</p>
              <h1>Manage your profile</h1>
              <p>Keep your profile, qualifications, subjects, and payout methods current so students can confidently book with you.</p>
            </div>
            <Link className="back-to-dashboard" to="/tutor/dashboard">
              Back to dashboard
            </Link>
          </div>

          {saved && (
            <div className="save-confirmation" style={{ marginBottom: "1.25rem" }}>
              ✓ {saveMessage || "Profile saved successfully."}
            </div>
          )}

          <form className="tutor-profile-form" onSubmit={handleSubmit}>
            <aside className="profile-photo-card">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile preview" className="profile-photo-preview" />
              ) : (
                <div
                  className="profile-photo-preview"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#e2e8f0",
                    fontSize: "2.5rem",
                    fontWeight: "bold",
                    color: "#475569",
                  }}
                >
                  {(profile.fullName || "T").charAt(0)}
                </div>
              )}
              <h2>Your profile photo</h2>
              <p>Use a clear, professional photo. JPG, PNG, or WebP up to 5 MB.</p>
              <label className="photo-upload-button" htmlFor="profile-photo">
                Upload photo
              </label>
              <input
                id="profile-photo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoChange}
              />
              <span className="photo-note">This photo is visible to students.</span>
            </aside>

            <div className="profile-form-card">
              {/* 1. About You */}
              <section className="form-section">
                <div className="form-section-heading">
                  <h2>About you</h2>
                  <p>Introduce yourself and your teaching background.</p>
                </div>

                <label className="form-field">
                  <span>
                    Full name <b>*</b>
                  </span>
                  <input
                    name="fullName"
                    value={profile.fullName}
                    onChange={updateField}
                    placeholder="e.g. Tadesse Mandefro"
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Professional Tagline / Headline</span>
                  <input
                    name="tagline"
                    value={profile.tagline}
                    onChange={updateField}
                    placeholder="e.g. Certified Senior English Educator with 8+ Years Experience"
                  />
                </label>

                <label className="form-field">
                  <span>
                    Bio / about <b>*</b>
                  </span>
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={updateField}
                    rows="4"
                    maxLength="500"
                    placeholder="Describe your teaching philosophy and how you support your students..."
                    required
                  />
                  <small>{profile.bio.length}/500 characters</small>
                </label>

                <div className="form-row">
                  <label className="form-field">
                    <span>
                      Qualifications <b>*</b>
                    </span>
                    <input
                      name="qualifications"
                      value={profile.qualifications}
                      onChange={updateField}
                      placeholder="e.g. Master's Degree in English Literature, AAU"
                      required
                    />
                  </label>

                  <label className="form-field">
                    <span>
                      Experience <b>*</b>
                    </span>
                    <input
                      name="experience"
                      value={profile.experience}
                      onChange={updateField}
                      placeholder="e.g. 8+ years"
                      required
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label className="form-field">
                    <span>Location</span>
                    <input
                      name="location"
                      value={profile.location}
                      onChange={updateField}
                      placeholder="e.g. Addis Ababa, Ethiopia"
                    />
                  </label>

                  <label className="form-field">
                    <span>Teaching Methodology</span>
                    <input
                      name="teachingMethod"
                      value={profile.teachingMethod}
                      onChange={updateField}
                      placeholder="e.g. Interactive digital whiteboard, structured practice drills"
                    />
                  </label>
                </div>
              </section>

              {/* 2. Languages Spoken (tutor_languages) */}
              <section className="form-section">
                <div className="form-section-heading">
                  <h2>Languages spoken</h2>
                  <p>Specify the languages in which you can communicate and deliver lessons.</p>
                </div>

                <div className="dynamic-items-list">
                  {profile.languages.length === 0 ? (
                    <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                      No languages added yet. Select or type below to add.
                    </span>
                  ) : (
                    profile.languages.map((lang) => (
                      <span key={lang} className="item-chip-removable">
                        🗣️ {lang}
                        <button
                          type="button"
                          className="item-remove-btn"
                          onClick={() => handleRemoveLanguage(lang)}
                          title="Remove language"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="quick-suggestions-row">
                  <span className="quick-suggestion-label">Quick Suggestions:</span>
                  {COMMON_LANGUAGES.map((lang) => (
                    <button
                      type="button"
                      key={lang}
                      className={`quick-suggestion-pill ${profile.languages.includes(lang) ? "is-active" : ""}`}
                      onClick={() => handleAddLanguage(lang)}
                    >
                      + {lang}
                    </button>
                  ))}
                </div>

                <div className="add-input-inline-group">
                  <input
                    type="text"
                    value={newLangInput}
                    onChange={(e) => setNewLangInput(e.target.value)}
                    placeholder="Type another language (e.g. Italian, Wolaytta, Sidama)..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddLanguage();
                      }
                    }}
                  />
                  <button type="button" className="btn-inline-add" onClick={() => handleAddLanguage()}>
                    + Add Language
                  </button>
                </div>
              </section>

              {/* 3. What You Teach: Subjects & Levels */}
              <section className="form-section">
                <div className="form-section-heading">
                  <h2>What you teach</h2>
                  <p>Select every subject and education level you support.</p>
                </div>

                <fieldset>
                  <legend>
                    Subjects <b>*</b>
                  </legend>
                  <div className="selection-grid">
                    {Array.from(new Set([...DEFAULT_SUBJECT_OPTIONS, ...profile.subjects])).map((option) => (
                      <label
                        className={`selection-chip ${profile.subjects.includes(option) ? "selected" : ""}`}
                        key={option}
                      >
                        <input
                          type="checkbox"
                          checked={profile.subjects.includes(option)}
                          onChange={() => toggleSelection("subjects", option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>

                  {/* Add Custom Subject */}
                  <div className="add-input-inline-group" style={{ marginTop: "0.75rem" }}>
                    <input
                      type="text"
                      value={customSubjectInput}
                      onChange={(e) => setCustomSubjectInput(e.target.value)}
                      placeholder="Add custom subject (e.g. Afaan Oromo, SAT Math, Geography)..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomSubject(e);
                        }
                      }}
                    />
                    <button type="button" className="btn-inline-add" onClick={handleAddCustomSubject}>
                      + Add Subject
                    </button>
                  </div>
                </fieldset>

                <fieldset style={{ marginTop: "1.25rem" }}>
                  <legend>
                    Education levels <b>*</b>
                  </legend>
                  <div className="selection-grid levels-grid">
                    {DEFAULT_LEVEL_OPTIONS.map((option) => (
                      <label
                        className={`selection-chip ${profile.educationLevels.includes(option) ? "selected" : ""}`}
                        key={option}
                      >
                        <input
                          type="checkbox"
                          checked={profile.educationLevels.includes(option)}
                          onChange={() => toggleSelection("educationLevels", option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </section>

              {/* 4. Academic Background & Education (tutor_education) */}
              <section className="form-section">
                <div className="form-section-heading">
                  <h2>Academic background & degrees</h2>
                  <p>Add your degrees and university education records shown on your public profile.</p>
                </div>

                <div className="education-cards-list">
                  {profile.education.length === 0 ? (
                    <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                      No university degrees listed yet. Fill out the form below to add one.
                    </span>
                  ) : (
                    profile.education.map((edu, idx) => (
                      <div key={idx} className="education-entry-card">
                        <div className="edu-card-left">
                          <h4>🎓 {edu.degree}</h4>
                          <p className="edu-card-meta">
                            <span>🏛️ {edu.institution}</span>
                            {edu.year && <span className="edu-year-badge">Class of {edu.year}</span>}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn-delete-entry"
                          onClick={() => handleRemoveEducation(idx)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="add-education-box">
                  <h3>+ Add Degree or Academic Record</h3>
                  <div className="add-edu-grid">
                    <input
                      type="text"
                      placeholder="Degree (e.g. Master's in English)"
                      value={newEdu.degree}
                      onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Institution (e.g. Addis Ababa University)"
                      value={newEdu.institution}
                      onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Year (e.g. 2018)"
                      value={newEdu.year}
                      onChange={(e) => setNewEdu({ ...newEdu, year: e.target.value })}
                      min="1970"
                      max="2035"
                    />
                    <button type="button" className="btn-inline-add" onClick={handleAddEducation}>
                      Add Entry
                    </button>
                  </div>
                </div>
              </section>

              {/* 5. Certifications & Honors (tutor_certifications) */}
              <section className="form-section">
                <div className="form-section-heading">
                  <h2>Certifications & honors</h2>
                  <p>Showcase verified teaching licenses, diplomas, or professional accreditations.</p>
                </div>

                <div className="dynamic-items-list">
                  {profile.certifications.length === 0 ? (
                    <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                      No certifications added yet.
                    </span>
                  ) : (
                    profile.certifications.map((cert, idx) => (
                      <span key={idx} className="item-chip-removable">
                        🏅 {cert}
                        <button
                          type="button"
                          className="item-remove-btn"
                          onClick={() => handleRemoveCertification(idx)}
                          title="Remove certification"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="add-input-inline-group">
                  <input
                    type="text"
                    value={newCertInput}
                    onChange={(e) => setNewCertInput(e.target.value)}
                    placeholder="e.g. Certified MoE Educator, Cambridge ESL Certification..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCertification(e);
                      }
                    }}
                  />
                  <button type="button" className="btn-inline-add" onClick={handleAddCertification}>
                    + Add Certification
                  </button>
                </div>
              </section>

              {/* 6. Tags & Specializations (tutor_tags) */}
              <section className="form-section">
                <div className="form-section-heading">
                  <h2>Specialization tags & keywords</h2>
                  <p>Tags help students find you when searching for specific exams or topics.</p>
                </div>

                <div className="dynamic-items-list">
                  {profile.tags.length === 0 ? (
                    <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                      No tags added yet.
                    </span>
                  ) : (
                    profile.tags.map((tag, idx) => (
                      <span key={idx} className="item-chip-removable">
                        🏷️ {tag}
                        <button
                          type="button"
                          className="item-remove-btn"
                          onClick={() => handleRemoveTag(idx)}
                          title="Remove tag"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="quick-suggestions-row">
                  <span className="quick-suggestion-label">Suggested:</span>
                  {COMMON_TAGS.map((t) => (
                    <button
                      type="button"
                      key={t}
                      className={`quick-suggestion-pill ${profile.tags.includes(t) ? "is-active" : ""}`}
                      onClick={() => handleAddTag(t)}
                    >
                      + {t}
                    </button>
                  ))}
                </div>

                <div className="add-input-inline-group">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Type a tag (e.g. SAT Preparation, National Exam Grade 12, Grammar)..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button type="button" className="btn-inline-add" onClick={() => handleAddTag()}>
                    + Add Tag
                  </button>
                </div>
              </section>

              {/* 7. Pricing */}
              <section className="form-section price-section">
                <div className="form-section-heading">
                  <h2>Your tutoring price</h2>
                  <p>Set the hourly rate shown to students before booking.</p>
                </div>
                <label className="form-field price-field">
                  <span>
                    Price per hour (USD) <b>*</b>
                  </span>
                  <div>
                    <span>$</span>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={profile.hourlyRate}
                      onChange={updateField}
                      min="1"
                      step="1"
                      required
                    />
                    <em>per hour (~{Math.round(Number(profile.hourlyRate || 25) * 125)} ETB)</em>
                  </div>
                </label>
              </section>

              {/* 8. Payment & Payout Accounts */}
              <section className="form-section payment-methods-section">
                <div className="form-section-heading between-heading">
                  <div>
                    <h2>Student Payment & Payout Accounts</h2>
                    <p>
                      Configure your Ethiopian payment accounts (Telebirr, CBE, Awash, etc.). These details will be shown to students on the checkout page so they can transfer tuition and upload receipts.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="add-payment-method-btn"
                    onClick={handleOpenAddMethod}
                  >
                    <span>+</span> Add Payment Method
                  </button>
                </div>

                {profile.paymentMethods.length === 0 ? (
                  <div className="no-methods-notice">
                    <p>⚠️ You haven't added any payment methods yet. Add your Telebirr or Bank account so students can pay you.</p>
                    <button
                      type="button"
                      className="primary-small-btn"
                      onClick={handleOpenAddMethod}
                    >
                      + Add Telebirr or Bank Account
                    </button>
                  </div>
                ) : (
                  <div className="payment-methods-grid">
                    {profile.paymentMethods.map((pm) => {
                      const typeMeta = PAYMENT_TYPE_OPTIONS.find((t) => t.value === pm.type) || {
                        icon: "💳",
                        color: "#0f766e",
                      };
                      return (
                        <div
                          key={pm.id}
                          className={`payment-method-card ${pm.isPrimary ? "is-primary" : ""}`}
                        >
                          <div className="pm-card-header">
                            <div className="pm-title-group">
                              <span className="pm-icon">{typeMeta.icon}</span>
                              <div>
                                <h4>{pm.type}</h4>
                                <span className="pm-acc-name">{pm.accountName}</span>
                              </div>
                            </div>
                            {pm.isPrimary ? (
                              <span className="primary-badge">★ Primary Method</span>
                            ) : (
                              <button
                                type="button"
                                className="make-primary-link"
                                onClick={() => handleSetPrimaryMethod(pm.id)}
                                title="Set as default method for students"
                              >
                                Set as Primary
                              </button>
                            )}
                          </div>

                          <div className="pm-details-body">
                            <div className="pm-data-row">
                              <span className="pm-data-label">Account / Phone:</span>
                              <strong className="pm-data-value code-font">{pm.accountNumber}</strong>
                            </div>
                            {pm.branch && (
                              <div className="pm-data-row">
                                <span className="pm-data-label">Branch:</span>
                                <span className="pm-data-value">{pm.branch}</span>
                              </div>
                            )}
                            {pm.instructions && (
                              <p className="pm-instructions-text">💬 {pm.instructions}</p>
                            )}
                            {pm.qrCode && (
                              <div className="pm-qr-indicator">
                                <span>📱 Has QR Code attached</span>
                              </div>
                            )}
                          </div>

                          <div className="pm-card-actions">
                            <button
                              type="button"
                              className="btn-edit-pm"
                              onClick={() => handleEditMethod(pm)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              className="btn-delete-pm"
                              onClick={() => handleDeleteMethod(pm.id)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="form-footer">
                {saved && (
                  <span className="save-confirmation">
                    ✓ {saveMessage || "Profile saved successfully."}
                  </span>
                )}
                <button className="save-profile-button" type="submit">
                  Save profile
                </button>
              </div>
            </div>
          </form>

          {/* ADD / EDIT PAYMENT METHOD MODAL */}
          {showAddMethodModal && (
            <div className="modal-backdrop" onClick={() => setShowAddMethodModal(false)}>
              <div className="modal-card pm-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <span className="modal-kicker">Payment Setup</span>
                    <h3>{editingMethodId ? "Edit Payment Method" : "Add New Payment Method"}</h3>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setShowAddMethodModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveMethod} className="pm-modal-form">
                  <label className="form-field">
                    <span>
                      Payment Service / Method <b>*</b>
                    </span>
                    <select
                      className="custom-select"
                      value={methodForm.type}
                      onChange={(e) => setMethodForm({ ...methodForm, type: e.target.value })}
                      required
                    >
                      {PAYMENT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="form-row">
                    <label className="form-field">
                      <span>
                        Account Holder Name <b>*</b>
                      </span>
                      <input
                        type="text"
                        value={methodForm.accountName}
                        onChange={(e) => setMethodForm({ ...methodForm, accountName: e.target.value })}
                        placeholder="e.g. Tadesse Mandefro"
                        required
                      />
                    </label>

                    <label className="form-field">
                      <span>
                        Account Number / Phone Number <b>*</b>
                      </span>
                      <input
                        type="text"
                        value={methodForm.accountNumber}
                        onChange={(e) => setMethodForm({ ...methodForm, accountNumber: e.target.value })}
                        placeholder="e.g. 0911234567 or 1000123456789"
                        required
                      />
                    </label>
                  </div>

                  {methodForm.type !== "Telebirr" && methodForm.type !== "CBE Birr" && (
                    <label className="form-field">
                      <span>Bank Branch (Optional)</span>
                      <input
                        type="text"
                        value={methodForm.branch}
                        onChange={(e) => setMethodForm({ ...methodForm, branch: e.target.value })}
                        placeholder="e.g. Addis Ababa Main Branch, Bole Branch"
                      />
                    </label>
                  )}

                  <label className="form-field">
                    <span>Payment Instructions for Students</span>
                    <textarea
                      rows="2"
                      value={methodForm.instructions}
                      onChange={(e) => setMethodForm({ ...methodForm, instructions: e.target.value })}
                      placeholder="e.g. Write your booking reference in the transfer remark and upload receipt screenshot."
                    />
                  </label>

                  <div className="qr-upload-field">
                    <span className="field-label-text">
                      Optional Payment QR Code (Telebirr / Mobile Banking QR)
                    </span>
                    <div className="qr-upload-controls">
                      {methodForm.qrCode ? (
                        <div className="qr-image-holder">
                          <img src={methodForm.qrCode} alt="Uploaded QR" className="qr-preview-img" />
                          <button
                            type="button"
                            className="qr-remove-btn"
                            onClick={() => setMethodForm({ ...methodForm, qrCode: "" })}
                          >
                            Remove QR
                          </button>
                        </div>
                      ) : (
                        <label className="qr-file-picker">
                          <span>📷 Upload QR Code Image</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleQrUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={methodForm.isPrimary}
                      onChange={(e) => setMethodForm({ ...methodForm, isPrimary: e.target.checked })}
                    />
                    <span>Set as Primary / Default method for students</span>
                  </label>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowAddMethodModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-submit-pm">
                      {editingMethodId ? "Update Payment Method" : "Add Payment Method"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}

export default TutorProfileManagement;
