/**
 * Abugida API Client
 * ------------------
 * All calls to the Express/PostgreSQL backend go through this file.
 * Base URL: http://localhost:5000/api
 *
 * Token storage key must match AuthContext: "abugida_auth_token"
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "abugida_auth_token";

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function get(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: authHeaders(options.headers),
    ...options,
  });
  return handleResponse(res);
}

async function post(path, body = {}, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(options.headers),
    body: JSON.stringify(body),
    ...options,
  });
  return handleResponse(res);
}

async function put(path, body = {}, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: authHeaders(options.headers),
    body: JSON.stringify(body),
    ...options,
  });
  return handleResponse(res);
}

async function patch(path, body = {}, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: authHeaders(options.headers),
    body: JSON.stringify(body),
    ...options,
  });
  return handleResponse(res);
}

async function del(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(options.headers),
    ...options,
  });
  return handleResponse(res);
}

// ─────────────────────────────────────────────────────────────
// Auth  (/api/auth)
// ─────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * POST /api/auth/register
   * Body: { name, email, password, role, phone?, gradeLevel?, learningFocus?,
   *         subject?, qualification?, experience?, hourlyRate?, documents? }
   */
  register: (userData) => post("/auth/register", userData),

  /**
   * POST /api/auth/login
   * Body: { email, password }
   */
  login: (email, password) => post("/auth/login", { email, password }),

  /**
   * POST /api/auth/quick-login
   * Body: { role }  — logs in as demo student / tutor / admin
   */
  quickLogin: (role) => post("/auth/quick-login", { role }),

  /**
   * GET /api/auth/me  (requires token)
   * Returns the currently authenticated user object.
   */
  getMe: () => get("/auth/me"),
};

// ─────────────────────────────────────────────────────────────
// Users  (/api/users)
// ─────────────────────────────────────────────────────────────

export const usersApi = {
  /** GET /api/users — admin: list all users */
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/users${qs ? `?${qs}` : ""}`);
  },

  /** GET /api/users/:id */
  getById: (id) => get(`/users/${id}`),

  /** PATCH /api/users/:id — update own profile fields */
  update: (id, updates) => patch(`/users/${id}`, updates),

  /** PATCH /api/users/:id/status — admin: approve / reject / suspend */
  updateStatus: (id, status, rejectionReason) =>
    patch(`/users/${id}/status`, { status, rejectionReason }),

  /** Approve a pending tutor */
  approveTutor: (id) => patch(`/users/${id}/status`, { status: "approved" }),

  /** Reject a pending tutor with optional reason */
  rejectTutor: (id, rejectionReason) =>
    patch(`/users/${id}/status`, { status: "rejected", rejectionReason }),

  /** GET /api/users/pending/students — admin */
  getPendingStudents: () => get("/users/pending/students"),

  /** GET /api/users/pending/tutors — admin */
  getPendingTutors: () => get("/users/pending/tutors"),
};

// ─────────────────────────────────────────────────────────────
// Tutors  (/api/tutors)
// ─────────────────────────────────────────────────────────────

export const tutorsApi = {
  /** GET /api/tutors — public tutor discovery / search */
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/tutors${qs ? `?${qs}` : ""}`);
  },

  /** GET /api/tutors/:id */
  getById: (id) => get(`/tutors/${id}`),

  /** GET /api/tutors/:id/profile — full tutor profile with subjects, tags, etc. */
  getProfile: (id) => get(`/tutors/${id}/profile`),

  /** GET /api/tutors/:id/payment-methods */
  getPaymentMethods: (tutorId) => get(`/tutors/${tutorId}/payment-methods`),

  /** POST /api/tutors/:id/payment-methods — tutor saves/replaces payment methods */
  savePaymentMethods: (tutorId, paymentMethods) =>
    post(`/tutors/${tutorId}/payment-methods`, { paymentMethods }),

  /** PUT /api/tutors/:id/payment-methods/:pmId */
  updatePaymentMethod: (tutorId, pmId, updates) =>
    put(`/tutors/${tutorId}/payment-methods/${pmId}`, updates),

  /** DELETE /api/tutors/:id/payment-methods/:pmId */
  deletePaymentMethod: (tutorId, pmId) =>
    del(`/tutors/${tutorId}/payment-methods/${pmId}`),

  /** GET /api/tutors/:id/availability */
  getAvailability: (tutorId) => get(`/tutors/${tutorId}/availability`),
  createAvailability: (tutorId, data) => post(`/tutors/${tutorId}/availability`, data),
  updateAvailability: (tutorId, availabilityId, data) =>
    put(`/tutors/${tutorId}/availability/${availabilityId}`, data),
  deleteAvailability: (tutorId, availabilityId) =>
    del(`/tutors/${tutorId}/availability/${availabilityId}`),

  /** GET /api/tutors/:id/reviews */
  getReviews: (tutorId) => get(`/tutors/${tutorId}/reviews`),

  /** PATCH /api/tutors/:id/profile — tutor updates own profile and related detail tables */
  updateProfile: (tutorId, updates) => patch(`/tutors/${tutorId}/profile`, updates),

  // 1. Education
  getEducation: (tutorId) => get(`/tutors/${tutorId}/education`),
  addEducation: (tutorId, data) => post(`/tutors/${tutorId}/education`, data),
  deleteEducation: (tutorId, id) => del(`/tutors/${tutorId}/education/${id}`),

  // 2. Certifications
  getCertifications: (tutorId) => get(`/tutors/${tutorId}/certifications`),
  addCertification: (tutorId, data) => post(`/tutors/${tutorId}/certifications`, data),
  deleteCertification: (tutorId, id) => del(`/tutors/${tutorId}/certifications/${id}`),

  // 3. Languages
  getLanguages: (tutorId) => get(`/tutors/${tutorId}/languages`),
  addLanguage: (tutorId, data) => post(`/tutors/${tutorId}/languages`, data),
  deleteLanguage: (tutorId, id) => del(`/tutors/${tutorId}/languages/${id}`),

  // 4. Subjects
  getSubjects: (tutorId) => get(`/tutors/${tutorId}/subjects`),
  addSubject: (tutorId, data) => post(`/tutors/${tutorId}/subjects`, data),
  deleteSubject: (tutorId, id) => del(`/tutors/${tutorId}/subjects/${id}`),

  // 5. Education Levels
  getEducationLevels: (tutorId) => get(`/tutors/${tutorId}/education-levels`),
  addEducationLevel: (tutorId, data) => post(`/tutors/${tutorId}/education-levels`, data),
  deleteEducationLevel: (tutorId, id) => del(`/tutors/${tutorId}/education-levels/${id}`),

  // 6. Tags
  getTags: (tutorId) => get(`/tutors/${tutorId}/tags`),
  addTag: (tutorId, data) => post(`/tutors/${tutorId}/tags`, data),
  deleteTag: (tutorId, id) => del(`/tutors/${tutorId}/tags/${id}`),
};

// ─────────────────────────────────────────────────────────────
// Bookings  (/api/bookings)
// ─────────────────────────────────────────────────────────────

export const bookingsApi = {
  /** GET /api/bookings — student: own bookings; tutor: incoming bookings; admin: all */
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/bookings${qs ? `?${qs}` : ""}`);
  },

  /** GET /api/bookings/:id */
  getById: (id) => get(`/bookings/${id}`),

  /** POST /api/bookings — student creates a booking */
  create: (bookingData) => post("/bookings", bookingData),

  /** PATCH /api/bookings/:id/status — tutor/admin update booking status */
  updateStatus: (id, status, reason) =>
    patch(`/bookings/${id}/status`, { status, cancelReason: reason }),

  /**
   * POST /api/bookings/:id/receipt — student uploads payment receipt
   * Body: { receiptImage (base64), receiptFileName, transactionRef, payerName,
   *         payerPhone, receiptNote, paymentMethod, paymentAccountUsed, paymentAccountName }
   */
  uploadReceipt: (id, receiptData) => post(`/bookings/${id}/receipt`, receiptData),

  /** PATCH /api/bookings/:id/receipt/approve — tutor approves receipt */
  approveReceipt: (id) => patch(`/bookings/${id}/receipt/approve`),

  /** PATCH /api/bookings/:id/receipt/reject — tutor rejects receipt */
  rejectReceipt: (id, reason) =>
    patch(`/bookings/${id}/receipt/reject`, { reason }),
};

// ─────────────────────────────────────────────────────────────
// Courses  (/api/courses)
// ─────────────────────────────────────────────────────────────

export const coursesApi = {
  /** GET /api/courses — list courses with optional filters (tutor_id, status, level, search) */
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/courses${qs ? `?${qs}` : ""}`);
  },

  /** GET /api/courses/:id — public course preview (no protected lesson video content) */
  getById: (id) => get(`/courses/${id}`),

  /** GET /api/courses/:id/learn — protected lesson content; requires auth + verified booking/payment access */
  getForLearning: (id) => get(`/courses/${id}/learn`),

  /** POST /api/courses — tutor/admin create course */
  create: (courseData) => post("/courses", courseData),

  /** PUT /api/courses/:id — tutor/admin update course */
  update: (id, updates) => put(`/courses/${id}`, updates),

  /** DELETE /api/courses/:id — tutor/admin delete course */
  delete: (id) => del(`/courses/${id}`),

  /** PATCH /api/courses/:id/status — update course status (Draft / Published / Pending Review) */
  updateStatus: (id, status) => patch(`/courses/${id}/status`, { status }),
};

// ─────────────────────────────────────────────────────────────
// Upload  (/api/upload)
// ─────────────────────────────────────────────────────────────

export const uploadApi = {
  /**
   * POST /api/upload/video  (multipart/form-data)
   * Uploads a lesson video file. Returns { videoUrl, filename, originalName, size }
   * @param {File} file  - A browser File object (video/mp4 etc.)
   * @param {function} onProgress - Optional callback(percent: number)
   */
  uploadVideo: (file, onProgress) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("video", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}/upload/video`);

      const token = getToken();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            const err = new Error(data.message || `HTTP ${xhr.status}`);
            err.status = xhr.status;
            err.data = data;
            reject(err);
          }
        } catch {
          reject(new Error("Invalid server response."));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload."));
      xhr.ontimeout = () => reject(new Error("Upload timed out."));

      xhr.send(formData);
    });
  },
};

// ─────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => get("/health"),
};

// ─────────────────────────────────────────────────────────────
// Default export (namespace bundle for convenience)
// ─────────────────────────────────────────────────────────────

const api = {
  auth: authApi,
  users: usersApi,
  tutors: tutorsApi,
  bookings: bookingsApi,
  courses: coursesApi,
  upload: uploadApi,
  health: healthApi,
};

export default api;
