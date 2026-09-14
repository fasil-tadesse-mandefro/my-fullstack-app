const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { JWT_SECRET } = require("../middleware/authMiddleware");

// Helper to generate JWT Token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roles: user.roles,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
async function register(req, res) {
  const client = await db.pool.connect();
  try {
    const {
      name,
      email,
      password,
      role = "student",
      phone,
      gradeLevel,
      learningFocus,
      subject,
      qualification,
      experience,
      hourlyRate,
      avatar,
      documents = [],
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await client.query("SELECT id FROM users WHERE LOWER(email) = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    await client.query("BEGIN");

    // 1. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUserId = `usr-${role}-${Date.now().toString().slice(-6)}`;
    const isTutor = role === "tutor";
    const isStudent = role === "student";
    const accountStatus = (isStudent || isTutor) ? "pending" : "approved";

    // 2. Insert into users table (Schema 2.0: no role column in users table)
    const insertUserQuery = `
      INSERT INTO users (id, name, email, password_hash, phone, avatar_url, account_status, joined_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, name, email, phone, avatar_url, joined_at, account_status
    `;

    const userValues = [
      newUserId,
      name.trim(),
      normalizedEmail,
      passwordHash,
      phone || null,
      avatar || (isTutor
        ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"),
      accountStatus,
    ];

    await client.query(insertUserQuery, userValues);

    // 3. Insert into user_roles table
    await client.query(`INSERT INTO user_roles (user_id, role, assigned_at) VALUES ($1, $2, NOW())`, [newUserId, role]);

    // 4. Insert Profile Data
    if (isStudent) {
      await client.query(
        `INSERT INTO student_profiles (user_id, grade_level, learning_focus) VALUES ($1, $2, $3)`,
        [newUserId, gradeLevel || null, learningFocus || null]
      );
    } else if (isTutor) {
      await client.query(
        `INSERT INTO tutor_profiles (
          user_id, subject_summary, qualification, experience_text,
          hourly_rate, verified, bio, courses_count, reviews_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0)`,
        [
          newUserId,
          subject || "General Tutoring",
          qualification || "Bachelor's Degree",
          experience || "3+ years",
          hourlyRate ? Number(hourlyRate) : 25.0,
          false,
          "Passionate educator eager to teach and mentor students on Abugida.",
        ]
      );

      // Initialize Tutor Registration Workflow
      await client.query(
        `INSERT INTO tutor_registrations (tutor_user_id, registration_status, current_step)
         VALUES ($1, 'submitted', 'documents_uploaded')`,
        [newUserId]
      );

      // Save any uploaded verification documents
      if (Array.isArray(documents) && documents.length > 0) {
        let docIndex = 1;
        for (const doc of documents) {
          const docId = Date.now() + docIndex++;
          await client.query(
            `INSERT INTO tutor_documents (id, tutor_user_id, document_type, file_url, file_name, mime_type, is_required, verification_status, uploaded_at)
             VALUES ($1, $2, $3, $4, $5, $6, true, 'pending', NOW())`,
            [
              docId,
              newUserId,
              doc.name ? doc.name.split(".").pop() || "certificate" : "certificate",
              doc.dataUrl || doc.data || doc.url || "https://example.com/document.pdf",
              doc.name || "tutor-document.pdf",
              doc.type || "application/pdf",
            ]
          );
        }
      }
    }

    await client.query("COMMIT");

    // Fetch user with roles & profile
    const fullUser = await db.getUserWithRoles(newUserId);
    delete fullUser.password_hash;

    const token = generateToken(fullUser);

    return res.status(201).json({
      success: true,
      pending: accountStatus === "pending",
      message: isTutor
        ? "Tutor registration submitted! An admin will review your credentials before sign-in."
        : "Student registration submitted! You can sign in once reviewed.",
      token,
      user: fullUser,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Registration Controller Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during registration." });
  } finally {
    client.release();
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.getUserWithRoles(normalizedEmail);

    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email address." });
    }

    // Verify Password Hash (or plaintext fallback for backward compatibility)
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch && user.password_hash !== password) {
      return res.status(401).json({ success: false, message: "Incorrect password. Please try again." });
    }

    // Check Account Status
    if (user.status === "pending") {
      return res.status(403).json({
        success: false,
        pending: true,
        message: user.role === "tutor"
          ? "Your tutor application and credentials are under review by an administrator. You will be able to sign in once approved."
          : "Your account registration is pending admin approval. You will be able to sign in once approved.",
      });
    }

    if (user.status === "rejected" || user.status === "suspended") {
      return res.status(403).json({
        success: false,
        rejected: true,
        message: "Your registration was not approved or your account has been suspended.",
      });
    }

    delete user.password_hash;
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    console.error("Login Controller Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during login." });
  }
}

// POST /api/auth/quick-login
async function quickLogin(req, res) {
  try {
    const { role = "student" } = req.body;
    const demoEmails = {
      student: "student@abugida.com",
      tutor: "tutor@abugida.com",
      admin: "admin@abugida.com",
    };

    const targetEmail = demoEmails[role] || demoEmails.student;
    const user = await db.getUserWithRoles(targetEmail);

    if (!user) {
      return res.status(404).json({ success: false, message: `Demo ${role} account not found in database.` });
    }

    delete user.password_hash;
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: `Demo ${role} login successful.`,
      token,
      user,
    });
  } catch (error) {
    console.error("Quick Login Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to perform quick demo login." });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
}

module.exports = {
  register,
  login,
  quickLogin,
  getMe,
};
