const db = require("../config/db");

// GET /api/users - Get all users with roles and profiles
async function getAllUsers(req, res) {
  try {
    const { role, status } = req.query;

    let query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.avatar_url AS avatar,
        u.joined_at AS "joinedDate",
        u.department,
        u.account_status AS status,
        COALESCE(json_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '[]') AS roles,
        sp.grade_level AS "gradeLevel",
        sp.learning_focus AS "learningFocus",
        tp.subject_summary AS subject,
        tp.qualification,
        tp.experience_text AS experience,
        tp.hourly_rate AS "hourlyRate",
        tp.verified,
        tp.bio
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      params.push(status);
      query += ` AND u.account_status = $${params.length}`;
    }

    query += `
      GROUP BY u.id, sp.grade_level, sp.learning_focus, tp.subject_summary, tp.qualification, tp.experience_text, tp.hourly_rate, tp.verified, tp.bio
      ORDER BY u.joined_at DESC
    `;

    const result = await db.pool.query(query, params);

    let users = result.rows.map((row) => {
      const primaryRole = row.roles && row.roles.length > 0 ? row.roles[0] : "student";
      return {
        ...row,
        role: primaryRole,
      };
    });

    if (role) {
      users = users.filter((u) => u.roles.includes(role) || u.role === role);
    }

    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    console.error("Get All Users Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
}

// PUT /api/users/:id/status - Admin Approve / Reject User
async function updateUserStatus(req, res) {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }

    await client.query("BEGIN");

    // 1. Update users account_status
    const userUpdate = await client.query(
      `UPDATE users
       SET account_status = $1
       WHERE id = $2
       RETURNING id, name, email, account_status`,
      [status, id]
    );

    if (userUpdate.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isApproved = status === "approved";

    // 2. If tutor, also update tutor_profiles.verified, tutor_registrations, and tutor_documents
    await client.query(
      `UPDATE tutor_profiles
       SET verified = $1
       WHERE user_id = $2`,
      [isApproved, id]
    );

    await client.query(
      `UPDATE tutor_registrations
       SET
         registration_status = $1,
         reviewed_at = CURRENT_TIMESTAMP,
         rejection_reason = $2,
         completed_at = $3
       WHERE tutor_user_id = $4`,
      [
        status,
        rejectionReason || null,
        isApproved ? new Date().toISOString() : null,
        id,
      ]
    );

    await client.query(
      `UPDATE tutor_documents
       SET
         verification_status = $1,
         reviewed_at = CURRENT_TIMESTAMP,
         rejection_reason = $2
       WHERE tutor_user_id = $3`,
      [
        isApproved ? "approved" : "rejected",
        rejectionReason || null,
        id,
      ]
    );

    await client.query("COMMIT");

    const updatedUser = await db.getUserWithRoles(id);
    delete updatedUser.password_hash;

    return res.status(200).json({
      success: true,
      message: `User status updated to ${status}.`,
      user: updatedUser,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update Status Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update user status." });
  } finally {
    client.release();
  }
}

// PUT /api/users/:id/profile - Update profile details
async function updateUserProfile(req, res) {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      avatar,
      bio,
      gradeLevel,
      learningFocus,
      subject,
      qualification,
      experience,
      hourlyRate,
    } = req.body;

    await client.query("BEGIN");

    // 1. Update basic user data
    await client.query(
      `UPDATE users
       SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4`,
      [name, phone, avatar, id]
    );

    // 2. Update Student Profile if exists
    await client.query(
      `UPDATE student_profiles
       SET
         grade_level = COALESCE($1, grade_level),
         learning_focus = COALESCE($2, learning_focus)
       WHERE user_id = $3`,
      [gradeLevel, learningFocus, id]
    );

    // 3. Update Tutor Profile if exists
    await client.query(
      `UPDATE tutor_profiles
       SET
         bio = COALESCE($1, bio),
         subject_summary = COALESCE($2, subject_summary),
         qualification = COALESCE($3, qualification),
         experience_text = COALESCE($4, experience_text),
         hourly_rate = COALESCE($5, hourly_rate)
       WHERE user_id = $6`,
      [bio, subject, qualification, experience, hourlyRate ? Number(hourlyRate) : null, id]
    );

    await client.query("COMMIT");

    const updatedUser = await db.getUserWithRoles(id);
    delete updatedUser.password_hash;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update Profile Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update user profile." });
  } finally {
    client.release();
  }
}

// GET /api/users/:id — get single user
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await db.getUserWithRoles(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    delete user.password_hash;
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Get User By Id Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch user." });
  }
}

// GET /api/users/pending/students — admin
async function getPendingStudents(req, res) {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.avatar_url AS avatar,
              u.joined_at AS "joinedDate", u.account_status AS status,
              sp.grade_level AS "gradeLevel", sp.learning_focus AS "learningFocus",
              'student' AS role
         FROM users u
         JOIN user_roles ur ON u.id = ur.user_id AND ur.role = 'student'
         LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.account_status = 'pending'
        ORDER BY u.joined_at DESC`
    );
    return res.status(200).json({ success: true, count: result.rows.length, users: result.rows });
  } catch (error) {
    console.error("Get Pending Students Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch pending students." });
  }
}

// GET /api/users/pending/tutors — admin
async function getPendingTutors(req, res) {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.avatar_url AS avatar,
              u.joined_at AS "joinedDate", u.account_status AS status,
              tp.subject_summary AS subject, tp.qualification, tp.experience_text AS experience,
              tp.hourly_rate AS "hourlyRate", tp.verified, tp.bio,
              'tutor' AS role,
              COALESCE(
                json_agg(
                  DISTINCT jsonb_build_object(
                    'id', td.id,
                    'name', td.file_name,
                    'type', td.mime_type,
                    'dataUrl', td.file_url,
                    'url', td.file_url,
                    'documentType', td.document_type,
                    'verificationStatus', td.verification_status,
                    'uploadedAt', td.uploaded_at
                  )
                ) FILTER (WHERE td.id IS NOT NULL),
                '[]'
              ) AS documents
         FROM users u
         JOIN user_roles ur ON u.id = ur.user_id AND ur.role = 'tutor'
         LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
         LEFT JOIN tutor_documents td ON u.id = td.tutor_user_id
        WHERE u.account_status = 'pending'
        GROUP BY u.id, tp.subject_summary, tp.qualification, tp.experience_text, tp.hourly_rate, tp.verified, tp.bio
        ORDER BY u.joined_at DESC`
    );
    return res.status(200).json({ success: true, count: result.rows.length, users: result.rows });
  } catch (error) {
    console.error("Get Pending Tutors Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch pending tutors." });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserProfile,
  getPendingStudents,
  getPendingTutors,
};
