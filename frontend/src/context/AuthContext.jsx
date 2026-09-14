import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, usersApi } from "../lib/api";

export const AuthContext = createContext(null);

const TOKEN_KEY = "abugida_auth_token";
const USER_KEY = "abugida_auth_user";

/**
 * Predefined demo account descriptors (UI labels / paths only — no passwords stored here).
 */
export const DEMO_ACCOUNTS = {
  student: {
    role: "student",
    label: "Student Learner",
    name: "Nahom Tadesse",
    email: "student@abugida.com",
    password: "Password123!",
    badge: "🎓 Student",
    dashboardPath: "/student/dashboard",
    description: "Book 1-on-1 expert tutors, access enrolled courses, and join live classes.",
  },
  tutor: {
    role: "tutor",
    label: "Expert Tutor",
    name: "Dr. Abebe Bekele",
    email: "tutor@abugida.com",
    password: "Password123!",
    badge: "👨‍🏫 Tutor",
    dashboardPath: "/tutor/dashboard",
    description: "Manage teaching schedule, accept booking requests, and publish courses.",
  },
  admin: {
    role: "admin",
    label: "Platform Admin",
    name: "Abugida Admin",
    email: "admin@abugida.com",
    password: "Password123!",
    badge: "🛡️ Admin",
    dashboardPath: "/admin/dashboard",
    description: "Oversee platform operations, verify tutor credentials, and manage users.",
  },
};

// ─── helpers ────────────────────────────────────────────────────────────────

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function loadUserFromStorage() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadUserFromStorage());
  const [loading, setLoading] = useState(false);

  // On mount: if we have a stored token, verify it with the backend
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    authApi
      .getMe()
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      })
      .catch(() => {
        // Token invalid or expired — clear everything
        clearSession();
        setUser(null);
      });
  }, []);

  // ── login ────────────────────────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      saveSession(data.token, data.user);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      // Relay backend error details (pending / rejected flags)
      return {
        success: false,
        message: err.message || "Login failed.",
        pending: err.data?.pending || false,
        rejected: err.data?.rejected || false,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── quickLogin ───────────────────────────────────────────────────────────

  const quickLogin = useCallback(async (role = "student") => {
    setLoading(true);
    try {
      const data = await authApi.quickLogin(role);
      saveSession(data.token, data.user);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return {
        success: false,
        message: err.message || `Demo ${role} login failed.`,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── register ─────────────────────────────────────────────────────────────

  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      const data = await authApi.register(userData);

      // Students & tutors are pending after registration — don't set session
      if (data.pending) {
        return { success: true, pending: true, message: data.message };
      }

      // Admin or immediately-approved accounts
      if (data.token && data.user) {
        saveSession(data.token, data.user);
        setUser(data.user);
      }

      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      return {
        success: false,
        message: err.message || "Registration failed.",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── logout ───────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // ── updateProfile ────────────────────────────────────────────────────────

  const updateProfile = useCallback(
    async (profileUpdates) => {
      if (!user) return { success: false, message: "No active user session." };
      try {
        const data = await usersApi.update(user.id, profileUpdates);
        const updated = { ...user, ...profileUpdates, ...data.user };
        setUser(updated);
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        return { success: true, user: updated };
      } catch (err) {
        // Fallback: optimistic local update if API isn't ready yet
        const updated = { ...user, ...profileUpdates };
        setUser(updated);
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        return { success: true, user: updated };
      }
    },
    [user]
  );

  // ── Admin helpers ─────────────────────────────────────────────────────────

  const getPendingStudents = useCallback(async () => {
    try {
      const data = await usersApi.getPendingStudents();
      return data.users || [];
    } catch {
      return [];
    }
  }, []);

  const getPendingTutors = useCallback(async () => {
    try {
      const data = await usersApi.getPendingTutors();
      return data.users || [];
    } catch {
      return [];
    }
  }, []);

  const updateStudentStatus = useCallback(async (userId, status) => {
    try {
      await usersApi.updateStatus(userId, status);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  const updateTutorStatus = useCallback(async (userId, status) => {
    try {
      await usersApi.updateStatus(userId, status);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  const getAllUsers = useCallback(async () => {
    try {
      const data = await usersApi.getAll();
      return data.users || [];
    } catch {
      return [];
    }
  }, []);

  // ── context value ────────────────────────────────────────────────────────

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    demoAccounts: DEMO_ACCOUNTS,
    login,
    quickLogin,
    register,
    logout,
    updateProfile,
    getAllUsers,
    getPendingStudents,
    updateStudentStatus,
    getPendingTutors,
    updateTutorStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
