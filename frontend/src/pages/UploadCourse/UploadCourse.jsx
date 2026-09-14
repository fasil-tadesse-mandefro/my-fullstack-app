import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { coursesApi, uploadApi } from "../../lib/api";
import "./UploadCourse.css";

const levels = [
  "Primary (Grade 1 - 8)",
  "Secondary (Grade 9 - 10)",
  "Preparatory (Grade 11 - 12)",
  "University & College",
  "Career & Adult Learning",
];

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Computer Science",
  "Economics",
  "History",
];

const defaultCourse = {
  title: "",
  description: "",
  level: "Preparatory (Grade 11 - 12)",
  subject: "Mathematics",
  price: "49",
  thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
};

const defaultLesson = {
  title: "",
  description: "",
  durationMinutes: "15",
};

function UploadCourse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCourseId = searchParams.get("edit");
  const { user } = useAuth();

  const [course, setCourse] = useState(defaultCourse);
  const [lesson, setLesson] = useState(defaultLesson);
  // Each lesson in this array has { id, title, description, durationMinutes, videoUrl, videoFile, uploadProgress, uploading, uploadError }
  const [lessons, setLessons] = useState([]);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);

  // Ref for the video file input so we can reset it after adding a lesson
  const videoInputRef = useRef(null);
  const [pendingVideoFile, setPendingVideoFile] = useState(null); // File object not yet added to lesson

  // Load existing course data if in edit mode
  useEffect(() => {
    if (editCourseId) {
      setLoadingCourse(true);
      coursesApi
        .getById(editCourseId)
        .then((res) => {
          if (res?.success && res.course) {
            const c = res.course;
            setCourse({
              title: c.title || "",
              description: c.description || "",
              level: c.level || levels[2],
              subject: c.subject || subjects[0],
              price: String(c.price || 0),
              thumbnail: c.thumbnail || c.thumbnailUrl || defaultCourse.thumbnail,
            });
            if (Array.isArray(c.lessons) && c.lessons.length > 0) {
              setLessons(
                c.lessons.map((l) => ({
                  id: String(l.id),
                  title: l.title,
                  description: l.description || "",
                  durationMinutes: String(l.durationMinutes || 15),
                  // videoUrl from server is the playable URL (http://...)
                  videoUrl: l.videoUrl || null,
                  videoFile: null,
                  uploadProgress: 100,
                  uploading: false,
                  uploadError: null,
                }))
              );
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load course for editing:", err);
          setErrorMessage("Failed to load course details for editing.");
        })
        .finally(() => setLoadingCourse(false));
    }
  }, [editCourseId]);

  const changeCourse = (event) => {
    setNotice("");
    setErrorMessage("");
    setCourse((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const changeLesson = (event) => {
    setNotice("");
    setErrorMessage("");
    setLesson((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const loadThumbnail = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCourse((current) => ({ ...current, thumbnail: reader.result }));
    reader.readAsDataURL(file);
  };

  const chooseVideo = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setPendingVideoFile(file);
    }
  };

  const addLesson = () => {
    if (!lesson.title.trim()) {
      setErrorMessage("Please enter a lesson title before adding.");
      return;
    }
    const newLesson = {
      ...lesson,
      id: `lesson-${Date.now()}`,
      videoFile: pendingVideoFile || null,
      videoUrl: null,        // will be set after upload
      uploadProgress: 0,
      uploading: false,
      uploadError: null,
    };
    setLessons((current) => [...current, newLesson]);
    setLesson(defaultLesson);
    setPendingVideoFile(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const removeLesson = (id) => setLessons((current) => current.filter((item) => item.id !== id));

  /**
   * Upload the video for a single lesson.
   * Updates the lessons state with progress, then sets the returned videoUrl.
   */
  const uploadLessonVideo = (lessonId, file) => {
    return new Promise((resolve, reject) => {
      setLessons((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, uploading: true, uploadProgress: 0, uploadError: null } : l))
      );

      uploadApi
        .uploadVideo(file, (percent) => {
          setLessons((prev) =>
            prev.map((l) => (l.id === lessonId ? { ...l, uploadProgress: percent } : l))
          );
        })
        .then((result) => {
          setLessons((prev) =>
            prev.map((l) =>
              l.id === lessonId
                ? { ...l, uploading: false, uploadProgress: 100, videoUrl: result.videoUrl }
                : l
            )
          );
          resolve(result.videoUrl);
        })
        .catch((err) => {
          const msg = err.message || "Upload failed.";
          setLessons((prev) =>
            prev.map((l) =>
              l.id === lessonId
                ? { ...l, uploading: false, uploadProgress: 0, uploadError: msg }
                : l
            )
          );
          reject(new Error(`Lesson "${lessonId}": ${msg}`));
        });
    });
  };

  const saveCourse = async (isSubmitForApproval) => {
    if (!course.title.trim()) {
      setErrorMessage("Please enter a course title.");
      return;
    }

    setSubmitting(true);
    setNotice("");
    setErrorMessage("");

    try {
      // 1. Upload any lessons that have a local video file but no URL yet
      const pendingUploads = lessons.filter((l) => l.videoFile && !l.videoUrl);
      if (pendingUploads.length > 0) {
        setNotice(`Uploading ${pendingUploads.length} video${pendingUploads.length > 1 ? "s" : ""}…`);
        await Promise.all(pendingUploads.map((l) => uploadLessonVideo(l.id, l.videoFile)));
        setNotice("");
      }

      // 2. Re-read the (now-updated) lessons from state
      // We use a one-time snapshot after uploads
      const finalLessons = await new Promise((resolve) => {
        // Give React one render cycle to flush the videoUrl state updates
        setTimeout(() => {
          setLessons((currentLessons) => {
            resolve(currentLessons);
            return currentLessons;
          });
        }, 50);
      });

      const status = isSubmitForApproval ? "Published" : "Draft";
      const payload = {
        tutorId: user?.id || "usr-tutor-01",
        title: course.title,
        description: course.description,
        level: course.level,
        price: Number(course.price || 0),
        isFree: Number(course.price || 0) === 0,
        thumbnail: course.thumbnail,
        status,
        lessons: finalLessons.map((l) => ({
          title: l.title,
          description: l.description,
          durationMinutes: Number(l.durationMinutes || 15),
          // Use the uploaded URL so students can stream the video
          videoUrl: l.videoUrl || null,
        })),
      };

      if (editCourseId) {
        await coursesApi.update(editCourseId, payload);
        setNotice(isSubmitForApproval ? "Course updated and published!" : "Course updated as a draft.");
      } else {
        await coursesApi.create(payload);
        setNotice(isSubmitForApproval ? "Course published successfully!" : "Course saved as a draft.");
      }

      setTimeout(() => {
        navigate("/tutor/courses");
      }, 900);
    } catch (err) {
      console.error("Failed to save course:", err);
      setErrorMessage(err.message || "Failed to save course. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <main className="course-builder-page">
        <div className="container course-builder-container">
          <div className="course-builder-heading">
            <div>
              <p className="course-kicker">Tutor workspace</p>
              <h1>{editCourseId ? "Edit course" : "Create a course"}</h1>
              <p>Upload and organise recorded lessons for your students.</p>
            </div>
            <Link to="/tutor/courses" className="course-back">
              ← My courses
            </Link>
          </div>

          {loadingCourse ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
              Loading course details...
            </div>
          ) : (
            <div className="course-builder-layout">
              <form
                className="course-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveCourse(false);
                }}
              >
                {/* 1. Course Details */}
                <section className="course-form-card">
                  <div className="form-card-heading">
                    <span>1</span>
                    <div>
                      <h2>Course details</h2>
                      <p>Information students see before enrolling.</p>
                    </div>
                  </div>

                  <label>
                    <b>Course title *</b>
                    <input
                      name="title"
                      value={course.title}
                      onChange={changeCourse}
                      placeholder="e.g. Complete Calculus & Analytical Geometry"
                      required
                    />
                  </label>

                  <label>
                    <b>Course description *</b>
                    <textarea
                      name="description"
                      value={course.description}
                      onChange={changeCourse}
                      rows="5"
                      maxLength="700"
                      placeholder="Describe what students will learn and achieve from this course..."
                      required
                    />
                    <small>{course.description.length}/700</small>
                  </label>

                  <div className="course-form-row">
                    <label>
                      <b>Education level *</b>
                      <select name="level" value={course.level} onChange={changeCourse}>
                        {levels.map((level) => (
                          <option key={level}>{level}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <b>Subject *</b>
                      <select name="subject" value={course.subject} onChange={changeCourse}>
                        {subjects.map((subject) => (
                          <option key={subject}>{subject}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="course-price">
                    <b>Course price (USD) *</b>
                    <div>
                      <span>$</span>
                      <input
                        type="number"
                        name="price"
                        value={course.price}
                        onChange={changeCourse}
                        min="0"
                        required
                      />
                    </div>
                  </label>
                </section>

                {/* 2. Thumbnail */}
                <section className="course-form-card">
                  <div className="form-card-heading">
                    <span>2</span>
                    <div>
                      <h2>Course thumbnail</h2>
                      <p>Use an appealing landscape image that represents your course.</p>
                    </div>
                  </div>

                  <div className="thumbnail-uploader">
                    <img src={course.thumbnail} alt="Course thumbnail preview" />
                    <div>
                      <label className="upload-file-button" htmlFor="thumbnail">
                        Upload thumbnail
                      </label>
                      <input
                        id="thumbnail"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={loadThumbnail}
                      />
                      <p>JPG, PNG, or WebP. Recommended: 1280 × 720 px.</p>
                    </div>
                  </div>
                </section>

                {/* 3. Lessons */}
                <section className="course-form-card">
                  <div className="form-card-heading">
                    <span>3</span>
                    <div>
                      <h2>Lessons</h2>
                      <p>Add videos and lesson information to build your course curriculum.</p>
                    </div>
                  </div>

                  <div className="lesson-editor">
                    <label>
                      <b>Lesson title *</b>
                      <input
                        name="title"
                        value={lesson.title}
                        onChange={changeLesson}
                        placeholder="e.g. Understanding derivatives and tangents"
                      />
                    </label>

                    <label>
                      <b>Lesson description</b>
                      <textarea
                        name="description"
                        value={lesson.description}
                        onChange={changeLesson}
                        rows="3"
                        placeholder="What will students learn in this lesson?"
                      />
                    </label>

                    <label>
                      <b>Duration (minutes)</b>
                      <input
                        type="number"
                        name="durationMinutes"
                        value={lesson.durationMinutes}
                        onChange={changeLesson}
                        min="1"
                        max="480"
                        placeholder="15"
                        style={{ maxWidth: "120px" }}
                      />
                    </label>

                    <label className="video-upload">
                      <b>Lesson video * (MP4 / WebM — max 500 MB)</b>
                      <span>
                        {pendingVideoFile
                          ? `✓ ${pendingVideoFile.name} (${(pendingVideoFile.size / 1024 / 1024).toFixed(1)} MB)`
                          : "Choose an MP4 or WebM video file"}
                      </span>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime"
                        onChange={chooseVideo}
                      />
                    </label>

                    <button
                      type="button"
                      className="add-lesson-button"
                      onClick={addLesson}
                    >
                      + Add Lesson
                    </button>
                  </div>

                  <div className="lesson-list">
                    {lessons.length > 0 ? (
                      lessons.map((item, index) => (
                        <article key={item.id}>
                          <span>{index + 1}</span>
                          <div style={{ flex: 1 }}>
                            <strong>{item.title}</strong>
                            {/* Show upload state */}
                            {item.uploading && (
                              <div style={{ marginTop: "0.3rem" }}>
                                <div style={{ background: "#e2e8f0", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                                  <div
                                    style={{
                                      width: `${item.uploadProgress}%`,
                                      height: "100%",
                                      background: "var(--color-primary, #0f766e)",
                                      transition: "width 0.3s",
                                    }}
                                  />
                                </div>
                                <small style={{ color: "#64748b" }}>Uploading… {item.uploadProgress}%</small>
                              </div>
                            )}
                            {!item.uploading && item.videoUrl && (
                              <p style={{ color: "#16a34a", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                                ✓ Video ready for streaming
                              </p>
                            )}
                            {!item.uploading && !item.videoUrl && item.videoFile && (
                              <p style={{ color: "#92400e", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                                📁 {item.videoFile.name} — will be uploaded on save
                              </p>
                            )}
                            {item.uploadError && (
                              <p style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                                ⚠️ {item.uploadError}
                              </p>
                            )}
                          </div>
                          <button type="button" onClick={() => removeLesson(item.id)}>
                            Remove
                          </button>
                        </article>
                      ))
                    ) : (
                      <p style={{ color: "#94a3b8", textAlign: "center", padding: "1rem" }}>
                        No lessons added yet. Use the form above to add lessons.
                      </p>
                    )}
                  </div>
                </section>

                {/* Actions */}
                <div className="course-actions">
                  {notice && (
                    <p role="status" style={{ color: "#16a34a", fontWeight: 600 }}>
                      {notice}
                    </p>
                  )}
                  {errorMessage && (
                    <p role="status" style={{ color: "#dc2626", fontWeight: 600 }}>
                      ⚠️ {errorMessage}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="save-course-button"
                    disabled={submitting}
                  >
                    {submitting ? "Saving…" : "Save as Draft"}
                  </button>
                  <button
                    type="button"
                    className="submit-course-button"
                    onClick={() => saveCourse(true)}
                    disabled={submitting}
                  >
                    {submitting ? "Publishing…" : "Publish Course"}
                  </button>
                </div>
              </form>

              {/* Sidebar Preview */}
              <aside className="course-preview">
                <p className="course-kicker">Course preview</p>
                <div className="preview-card">
                  <img src={course.thumbnail} alt="" />
                  <div>
                    <span>
                      {course.subject} · {course.level}
                    </span>
                    <h2>{course.title || "Your course title"}</h2>
                    <p>{course.description || "Your course description will appear here."}</p>
                    <div className="preview-meta">
                      <strong>${course.price || "0"}</strong>
                      <span>
                        {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="preview-note">
                  <strong>Before publishing</strong>
                  <p>
                    Make sure each lesson includes a clear title, description, and video.
                    Videos are uploaded to the server when you save — students will be able
                    to stream them directly after your course is approved.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}

export default UploadCourse;
