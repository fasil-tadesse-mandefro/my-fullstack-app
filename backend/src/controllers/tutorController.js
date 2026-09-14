const db = require("../config/db");

// Helper: Ensure tutor_profiles row exists for foreign key constraints
async function ensureTutorProfile(client, tutorUserId) {
  const check = await client.query("SELECT user_id FROM tutor_profiles WHERE user_id = $1", [tutorUserId]);
  if (check.rows.length === 0) {
    await client.query(
      `INSERT INTO tutor_profiles (user_id, subject_summary, hourly_rate, verified, bio)
       VALUES ($1, 'General', 25, true, 'Passionate educator eager to teach and mentor students on Abugida.')
       ON CONFLICT (user_id) DO NOTHING`,
      [tutorUserId]
    );
  }
}

// GET /api/tutors - Get list of approved tutors
async function getTutors(req, res) {
  try {
    const result = await db.query(
      `SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.avatar_url AS avatar,
        u.joined_at AS "joinedDate",
        tp.subject_summary AS subject,
        tp.qualification,
        tp.experience_text AS experience,
        tp.hourly_rate AS "hourlyRate",
        tp.hourly_rate AS price,
        tp.rating,
        tp.reviews_count AS "reviewsCount",
        tp.education_level AS "educationLevel",
        CASE WHEN COALESCE(avail_agg.available_slots, 0) > 0 THEN 'Has available slots' END AS "availabilityLabel",
        CASE WHEN COALESCE(avail_agg.available_slots, 0) > 0 THEN 'Has available slots' END AS availability,
        tp.verified,
        tp.location,
        tp.tagline,
        tp.bio,
        tp.teaching_method AS "teachingMethod",
        tp.courses_count AS "coursesCount",
        COALESCE(tags_agg.tags, '{}') AS tags,
        COALESCE(subj_agg.subjects, '{}') AS "subjectsTaught",
        COALESCE(levels_agg.levels, '{}') AS "educationLevels",
        COALESCE(langs_agg.languages, '{}') AS languages
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id AND ur.role = 'tutor'
       LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
       LEFT JOIN (
         SELECT tutor_user_id, ARRAY_AGG(tag ORDER BY tag) AS tags
         FROM tutor_tags
         GROUP BY tutor_user_id
       ) tags_agg ON u.id = tags_agg.tutor_user_id
       LEFT JOIN (
         SELECT tutor_user_id, ARRAY_AGG(name ORDER BY name) AS subjects
         FROM tutor_subjects
         GROUP BY tutor_user_id
       ) subj_agg ON u.id = subj_agg.tutor_user_id
       LEFT JOIN (
         SELECT tutor_user_id, ARRAY_AGG(education_level ORDER BY education_level) AS levels
         FROM tutor_education_levels
         GROUP BY tutor_user_id
       ) levels_agg ON u.id = levels_agg.tutor_user_id
       LEFT JOIN (
         SELECT tutor_user_id, ARRAY_AGG(language ORDER BY language) AS languages
         FROM tutor_languages
         GROUP BY tutor_user_id
       ) langs_agg ON u.id = langs_agg.tutor_user_id
       LEFT JOIN (
         SELECT tutor_user_id, COUNT(*) FILTER (WHERE status = 'available') AS available_slots
         FROM tutor_availability
         GROUP BY tutor_user_id
       ) avail_agg ON u.id = avail_agg.tutor_user_id
       WHERE u.account_status = 'approved'
       ORDER BY tp.rating DESC NULLS LAST, tp.reviews_count DESC NULLS LAST, u.name ASC`
    );

    const tutors = result.rows.map((row) => ({
      ...row,
      price: Number(row.price || row.hourlyRate || 25),
      hourlyRate: Number(row.hourlyRate || row.price || 25),
      priceUnit: "hr",
      rating: row.rating ? Number(row.rating) : null,
      reviewsCount: Number(row.reviewsCount || 0),
      availability: row.availability || null,
      availabilityLabel: row.availabilityLabel || null,
      tags: Array.isArray(row.tags) ? row.tags : [],
      subjectsTaught: Array.isArray(row.subjectsTaught) ? row.subjectsTaught : (row.subject ? [row.subject] : []),
      educationLevels: Array.isArray(row.educationLevels) ? row.educationLevels : (row.educationLevel ? [row.educationLevel] : []),
      languages: Array.isArray(row.languages) ? row.languages : [],
    }));

    return res.status(200).json({ success: true, count: tutors.length, tutors });
  } catch (error) {
    console.error("Get Tutors Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch tutors." });
  }
}

// GET /api/tutors/:tutorId — single tutor
async function getTutorById(req, res) {
  try {
    const user = await db.getUserWithRoles(req.params.tutorId);
    if (!user || !user.roles?.includes("tutor")) {
      return res.status(404).json({ success: false, message: "Tutor not found." });
    }
    delete user.password_hash;
    return res.status(200).json({ success: true, tutor: user });
  } catch (error) {
    console.error("Get Tutor By Id Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch tutor." });
  }
}

// GET /api/tutors/:tutorId/profile — full profile with tags, subjects, education, etc.
async function getTutorProfile(req, res) {
  try {
    const { tutorId } = req.params;
    const base = await db.getUserWithRoles(tutorId);
    if (!base) return res.status(404).json({ success: false, message: "Tutor not found." });
    delete base.password_hash;

    const actualTutorId = base.id;

    const [tagsRes, subjectsRes, langsRes, eduRes, certsRes, levelsRes, reviewsRes, availRes] = await Promise.all([
      db.query("SELECT id, tag FROM tutor_tags WHERE tutor_user_id = $1 ORDER BY id ASC", [actualTutorId]),
      db.query("SELECT id, name FROM tutor_subjects WHERE tutor_user_id = $1 ORDER BY id ASC", [actualTutorId]),
      db.query("SELECT id, language FROM tutor_languages WHERE tutor_user_id = $1 ORDER BY id ASC", [actualTutorId]),
      db.query("SELECT id, degree, institution, year FROM tutor_education WHERE tutor_user_id = $1 ORDER BY year DESC NULLS LAST, id ASC", [actualTutorId]),
      db.query("SELECT id, name FROM tutor_certifications WHERE tutor_user_id = $1 ORDER BY id ASC", [actualTutorId]),
      db.query("SELECT id, education_level AS \"educationLevel\" FROM tutor_education_levels WHERE tutor_user_id = $1 ORDER BY id ASC", [actualTutorId]),
      db.query(
        `SELECT r.id, r.rating, r.comment, r.review_date AS date,
                r.student_grade_snapshot AS "studentGrade",
                r.student_avatar_url AS avatar,
                u.name AS "studentName"
         FROM reviews r
         LEFT JOIN users u ON r.student_user_id = u.id
         WHERE r.tutor_user_id = $1
         ORDER BY r.review_date DESC`,
        [actualTutorId]
      ),
      db.query(
        `SELECT slot_date, day_name, start_time, end_time
         FROM tutor_availability
         WHERE tutor_user_id = $1 AND status = 'available'
         ORDER BY slot_date, start_time`,
        [actualTutorId]
      ),
    ]);

    const subjectsList = subjectsRes.rows.map((r) => r.name);
    const tagsList = tagsRes.rows.map((r) => r.tag);
    const langsList = langsRes.rows.map((r) => r.language);
    const levelsList = levelsRes.rows.map((r) => r.educationLevel);
    const certsList = certsRes.rows.map((r) => r.name);
    const eduList = eduRes.rows.map((r) => ({
      id: r.id,
      degree: r.degree,
      institution: r.institution,
      year: r.year,
    }));

    // Group availability slots by day
    let availableTimeSlots = [];
    if (availRes.rows.length > 0) {
      const daysMap = {};
      for (const row of availRes.rows) {
        const dayKey = row.day_name || "Monday";
        if (!daysMap[dayKey]) {
          daysMap[dayKey] = {
            day: dayKey,
            date: row.slot_date ? new Date(row.slot_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Available",
            slots: [],
          };
        }
        daysMap[dayKey].slots.push(row.start_time ? String(row.start_time).slice(0, 5) : "10:00 AM");
      }
      availableTimeSlots = Object.values(daysMap);
    }

    const reviewsList = reviewsRes.rows;
    const computedRating = reviewsList.length > 0
      ? Number((reviewsList.reduce((acc, r) => acc + Number(r.rating || 0), 0) / reviewsList.length).toFixed(1))
      : (base.rating ? Number(base.rating) : null);

    return res.status(200).json({
      success: true,
      tutor: {
        ...base,
        price: Number(base.hourlyRate || 25),
        priceUnit: "hr",
        availability: availRes.rows.length > 0 ? "Has available slots" : null,
        tags: tagsList,
        subjects: subjectsList.length > 0 ? subjectsList : (base.subject ? [base.subject] : []),
        subjectsTaught: subjectsList.length > 0 ? subjectsList : (base.subject ? [base.subject] : []),
        educationLevels: levelsList.length > 0 ? levelsList : (base.educationLevel ? [base.educationLevel] : []),
        languages: langsList,
        education: eduList,
        certifications: certsList,
        reviews: reviewsList,
        reviewsCount: reviewsList.length > 0 ? reviewsList.length : Number(base.reviewsCount || 0),
        rating: computedRating,
        availableTimeSlots,
      },
    });
  } catch (error) {
    console.error("Get Tutor Profile Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch tutor profile." });
  }
}

// GET /api/tutors/:tutorId/reviews
async function getTutorReviews(req, res) {
  try {
    const result = await db.query(
      `SELECT r.id, r.rating, r.comment, r.review_date AS "reviewDate",
              r.helpful_count AS "helpfulCount",
              r.student_grade_snapshot AS "studentGrade",
              r.student_avatar_url AS "studentAvatar",
              r.subject_snapshot AS subject,
              r.topic_snapshot AS topic,
              u.name AS "studentName"
         FROM reviews r
         LEFT JOIN users u ON r.student_user_id = u.id
        WHERE r.tutor_user_id = $1
        ORDER BY r.review_date DESC`,
      [req.params.tutorId]
    );
    return res.status(200).json({ success: true, reviews: result.rows });
  } catch (error) {
    console.error("Get Reviews Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reviews." });
  }
}

// GET /api/tutors/:tutorId/availability
async function getAvailability(req, res) {
  try {
    const result = await db.query(
      `SELECT id, slot_date AS date, day_name AS day, start_time AS "startTime", end_time AS "endTime", status
         FROM tutor_availability
        WHERE tutor_user_id = $1
        ORDER BY slot_date, start_time`,
      [req.params.tutorId]
    );
    return res.status(200).json({ success: true, availability: result.rows });
  } catch (error) {
    console.error("Get Availability Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch availability." });
  }
}

function canManageTutorAvailability(req, tutorId) {
  return req.user?.roles?.includes("admin") || String(req.user?.id) === String(tutorId);
}

function normalizeAvailabilityInput(body = {}) {
  const slotDate = String(body.slotDate || body.date || "").trim();
  const startTime = String(body.startTime || body.start || "").trim();
  const endTime = String(body.endTime || body.end || "").trim();
  const status = String(body.status || "available").trim().toLowerCase();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(slotDate)) return { error: "A valid availability date is required." };
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(startTime) || !/^\d{2}:\d{2}(:\d{2})?$/.test(endTime)) {
    return { error: "A valid start and end time are required." };
  }
  if (startTime >= endTime) return { error: "The end time must be later than the start time." };
  if (!["available", "unavailable"].includes(status)) return { error: "Status must be either available or unavailable." };

  const parsedDate = new Date(`${slotDate}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return { error: "A valid availability date is required." };

  return {
    slotDate,
    dayName: parsedDate.toLocaleDateString("en-US", { weekday: "long" }),
    startTime,
    endTime,
    status,
  };
}

async function createAvailability(req, res) {
  const { tutorId } = req.params;
  if (!canManageTutorAvailability(req, tutorId)) return res.status(403).json({ success: false, message: "You can only manage your own availability." });
  const input = normalizeAvailabilityInput(req.body);
  if (input.error) return res.status(400).json({ success: false, message: input.error });
  try {
    const result = await db.query(
      `INSERT INTO tutor_availability (tutor_user_id, slot_date, day_name, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, slot_date AS date, day_name AS day, start_time AS "startTime", end_time AS "endTime", status`,
      [tutorId, input.slotDate, input.dayName, input.startTime, input.endTime, input.status]
    );
    return res.status(201).json({ success: true, availability: result.rows[0] });
  } catch (error) {
    console.error("Create Availability Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create availability." });
  }
}

async function updateAvailability(req, res) {
  const { tutorId, availabilityId } = req.params;
  if (!canManageTutorAvailability(req, tutorId)) return res.status(403).json({ success: false, message: "You can only manage your own availability." });
  const input = normalizeAvailabilityInput(req.body);
  if (input.error) return res.status(400).json({ success: false, message: input.error });
  try {
    const result = await db.query(
      `UPDATE tutor_availability SET slot_date = $1, day_name = $2, start_time = $3, end_time = $4, status = $5
        WHERE id = $6 AND tutor_user_id = $7
        RETURNING id, slot_date AS date, day_name AS day, start_time AS "startTime", end_time AS "endTime", status`,
      [input.slotDate, input.dayName, input.startTime, input.endTime, input.status, availabilityId, tutorId]
    );
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Availability slot not found." });
    return res.status(200).json({ success: true, availability: result.rows[0] });
  } catch (error) {
    console.error("Update Availability Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update availability." });
  }
}

async function deleteAvailability(req, res) {
  const { tutorId, availabilityId } = req.params;
  if (!canManageTutorAvailability(req, tutorId)) return res.status(403).json({ success: false, message: "You can only manage your own availability." });
  try {
    const result = await db.query(
      "DELETE FROM tutor_availability WHERE id = $1 AND tutor_user_id = $2 RETURNING id",
      [availabilityId, tutorId]
    );
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Availability slot not found." });
    return res.status(200).json({ success: true, message: "Availability deleted successfully." });
  } catch (error) {
    console.error("Delete Availability Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete availability." });
  }
}

// GET /api/tutors/:tutorId/payment-methods
async function getPaymentMethods(req, res) {
  try {
    const { tutorId } = req.params;
    const result = await db.query(
      `SELECT id, tutor_user_id AS tutor_id, type, account_name, account_number, branch, instructions, qr_code_url AS qr_code, is_primary, status
       FROM tutor_payment_methods
       WHERE tutor_user_id = $1 OR tutor_user_id = (SELECT id FROM users WHERE id = $1 OR LOWER(name) LIKE LOWER($1) LIMIT 1)
       ORDER BY is_primary DESC, created_at ASC`,
      [tutorId]
    );
    return res.status(200).json({ success: true, paymentMethods: result.rows });
  } catch (error) {
    console.error("Get Payment Methods Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch payment methods." });
  }
}

// POST /api/tutors/:tutorId/payment-methods
async function savePaymentMethods(req, res) {
  const client = await db.pool.connect();
  try {
    const { tutorId } = req.params;
    const { paymentMethods } = req.body;

    if (!Array.isArray(paymentMethods)) {
      return res.status(400).json({ success: false, message: "paymentMethods array is required." });
    }

    await client.query("BEGIN");
    await client.query("DELETE FROM tutor_payment_methods WHERE tutor_user_id = $1", [tutorId]);

    for (const pm of paymentMethods) {
      const id = pm.id || `pm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      await client.query(
        `INSERT INTO tutor_payment_methods (id, tutor_user_id, type, account_name, account_number, branch, instructions, qr_code_url, is_primary, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          id,
          tutorId,
          pm.type,
          pm.accountName || pm.account_name,
          pm.accountNumber || pm.account_number,
          pm.branch || null,
          pm.instructions || null,
          pm.qrCode || pm.qr_code || pm.qr_code_url || null,
          Boolean(pm.isPrimary ?? pm.is_primary),
        ]
      );
    }

    await client.query("COMMIT");
    return res.status(200).json({ success: true, message: "Payment methods updated successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Save Payment Methods Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to save payment methods." });
  } finally {
    client.release();
  }
}

// PUT /api/tutors/:tutorId/payment-methods/:pmId
async function updatePaymentMethod(req, res) {
  try {
    const { tutorId, pmId } = req.params;
    const { type, accountName, accountNumber, branch, instructions, qrCode, isPrimary } = req.body;
    await db.query(
      `UPDATE tutor_payment_methods
          SET type           = COALESCE($1, type),
              account_name   = COALESCE($2, account_name),
              account_number = COALESCE($3, account_number),
              branch         = COALESCE($4, branch),
              instructions   = COALESCE($5, instructions),
              qr_code_url    = COALESCE($6, qr_code_url),
              is_primary     = COALESCE($7, is_primary),
              updated_at     = CURRENT_TIMESTAMP
        WHERE id = $8 AND tutor_user_id = $9`,
      [type, accountName, accountNumber, branch, instructions, qrCode, isPrimary, pmId, tutorId]
    );
    return res.status(200).json({ success: true, message: "Payment method updated." });
  } catch (error) {
    console.error("Update Payment Method Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update payment method." });
  }
}

// DELETE /api/tutors/:tutorId/payment-methods/:pmId
async function deletePaymentMethod(req, res) {
  try {
    const { tutorId, pmId } = req.params;
    await db.query(
      "DELETE FROM tutor_payment_methods WHERE id = $1 AND tutor_user_id = $2",
      [pmId, tutorId]
    );
    return res.status(200).json({ success: true, message: "Payment method deleted." });
  } catch (error) {
    console.error("Delete Payment Method Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete payment method." });
  }
}

// ─────────────────────────────────────────────────────────────
// 1. TUTOR EDUCATION CRUD (tutor_education)
// ─────────────────────────────────────────────────────────────
async function getEducation(req, res) {
  try {
    const { tutorId } = req.params;
    const result = await db.query(
      "SELECT id, tutor_user_id AS \"tutorUserId\", degree, institution, year FROM tutor_education WHERE tutor_user_id = $1 ORDER BY year DESC NULLS LAST, id ASC",
      [tutorId]
    );
    return res.status(200).json({ success: true, education: result.rows });
  } catch (error) {
    console.error("Get Education Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch education records." });
  }
}

async function addEducation(req, res) {
  const client = await db.pool.connect();
  try {
    const { tutorId } = req.params;
    const { degree, institution, year, education } = req.body;
    await client.query("BEGIN");
    await ensureTutorProfile(client, tutorId);

    if (Array.isArray(education)) {
      await client.query("DELETE FROM tutor_education WHERE tutor_user_id = $1", [tutorId]);
      for (const item of education) {
        if (item.degree && item.institution) {
          await client.query(
            "INSERT INTO tutor_education (tutor_user_id, degree, institution, year) VALUES ($1, $2, $3, $4)",
            [tutorId, item.degree, item.institution, item.year ? parseInt(item.year, 10) : null]
          );
        }
      }
    } else {
      if (!degree || !institution) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Degree and institution are required." });
      }
      await client.query(
        "INSERT INTO tutor_education (tutor_user_id, degree, institution, year) VALUES ($1, $2, $3, $4)",
        [tutorId, degree, institution, year ? parseInt(year, 10) : null]
      );
    }

    await client.query("COMMIT");
    const result = await db.query(
      "SELECT id, tutor_user_id AS \"tutorUserId\", degree, institution, year FROM tutor_education WHERE tutor_user_id = $1 ORDER BY year DESC NULLS LAST, id ASC",
      [tutorId]
    );
    return res.status(201).json({ success: true, message: "Education record(s) saved.", education: result.rows });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add Education Error:", error);
    return res.status(500).json({ success: false, message: "Failed to save education record." });
  } finally {
    client.release();
  }
}

async function deleteEducation(req, res) {
  try {
    const { tutorId, id } = req.params;
    await db.query("DELETE FROM tutor_education WHERE id = $1 AND tutor_user_id = $2", [id, tutorId]);
    return res.status(200).json({ success: true, message: "Education record deleted." });
  } catch (error) {
    console.error("Delete Education Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete education record." });
  }
}

// ─────────────────────────────────────────────────────────────
// 2. TUTOR CERTIFICATIONS CRUD (tutor_certifications)
// ─────────────────────────────────────────────────────────────
async function getCertifications(req, res) {
  try {
    const { tutorId } = req.params;
    const result = await db.query(
      "SELECT id, tutor_user_id AS \"tutorUserId\", name FROM tutor_certifications WHERE tutor_user_id = $1 ORDER BY id ASC",
      [tutorId]
    );
    return res.status(200).json({ success: true, certifications: result.rows });
  } catch (error) {
    console.error("Get Certifications Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch certifications." });
  }
}

async function addCertification(req, res) {
  const client = await db.pool.connect();
  try {
    const { tutorId } = req.params;
    const { name, certifications } = req.body;
    await client.query("BEGIN");
    await ensureTutorProfile(client, tutorId);

    if (Array.isArray(certifications)) {
      await client.query("DELETE FROM tutor_certifications WHERE tutor_user_id = $1", [tutorId]);
      for (const cert of certifications) {
        const certName = typeof cert === "string" ? cert : cert.name;
        if (certName && certName.trim()) {
          await client.query(
            "INSERT INTO tutor_certifications (tutor_user_id, name) VALUES ($1, $2)",
            [tutorId, certName.trim()]
          );
        }
      }
    } else {
      if (!name || !name.trim()) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Certification name is required." });
      }
      await client.query(
        "INSERT INTO tutor_certifications (tutor_user_id, name) VALUES ($1, $2)",
        [tutorId, name.trim()]
      );
    }

    await client.query("COMMIT");
    const result = await db.query(
      "SELECT id, tutor_user_id AS \"tutorUserId\", name FROM tutor_certifications WHERE tutor_user_id = $1 ORDER BY id ASC",
      [tutorId]
    );
    return res.status(201).json({ success: true, message: "Certification(s) saved.", certifications: result.rows });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add Certification Error:", error);
    return res.status(500).json({ success: false, message: "Failed to save certification." });
  } finally {
    client.release();
  }
}

async function deleteCertification(req, res) {
  try {
    const { tutorId, id } = req.params;
    await db.query("DELETE FROM tutor_certifications WHERE id = $1 AND tutor_user_id = $2", [id, tutorId]);
    return res.status(200).json({ success: true, message: "Certification deleted." });
  } catch (error) {
    console.error("Delete Certification Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete certification." });
  }
}

// ─────────────────────────────────────────────────────────────
// 3. TUTOR LANGUAGES CRUD (tutor_languages)
// ─────────────────────────────────────────────────────────────
async function getLanguages(req, res) {
  try {
    const { tutorId } = req.params;
    const result = await db.query(
      "SELECT id, tutor_user_id AS \"tutorUserId\", language FROM tutor_languages WHERE tutor_user_id = $1 ORDER BY id ASC",
      [tutorId]
    );
    return res.status(200).json({ success: true, languages: result.rows });
  } catch (error) {
    console.error("Get Languages Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch languages." });
  }
}

async function addLanguage(req, res) {
  const client = await db.pool.connect();
  try {
    const { tutorId } = req.params;
    const { language, languages } = req.body;
    await client.query("BEGIN");
    await ensureTutorProfile(client, tutorId);

    if (Array.isArray(languages)) {
      await client.query("DELETE FROM tutor_languages WHERE tutor_user_id = $1", [tutorId]);
      for (const lang of languages) {
        const val = typeof lang === "string" ? lang : lang.language;
        if (val && val.trim()) {
          await client.query(
            "INSERT INTO tutor_languages (tutor_user_id, language) VALUES ($1, $2)",
            [tutorId, val.trim()]
          );
        }
      }
    } else {
      if (!language || !language.trim()) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Language is required." });
      }
      await client.query(
        "INSERT INTO tutor_languages (tutor_user_id, language) VALUES ($1, $2)",
        [tutorId, language.trim()]
      );
    }

    await client.query("COMMIT");
    const result = await db.query(
      "SELECT id, tutor_user_id AS \"tutorUserId\", language FROM tutor_languages WHERE tutor_user_id = $1 ORDER BY id ASC",
      [tutorId]
    );
    return res.status(201).json({ success: true, message: "Language(s) saved.", languages: result.rows });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add Language Error:", error);
    return res.status(500).json({ success: false, message: "Failed to save language." });
  } finally {
    client.release();
  }
}

async function deleteLanguage(req, res) {
  try {
    const { tutorId, id } = req.params;
    await db.query("DELETE FROM tutor_languages WHERE id = $1 AND tutor_user_id = $2", [id, tutorId]);
    return res.status(200).json({ success: true, message: "Language deleted." });
  } catch (error) {
    console.error("Delete Language Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete language." });
  }
}

// ─────────────────────────────────────────────────────────────
// 4. TUTOR SUBJECTS CRUD (tutor_subjects)
// ─────────────────────────────────────────────────────────────
async function getSubjects(req, res) {
  try {
    const { tutorId } = req.params;
    const result = await db.query(
      "SELECT id, tutor_user_id AS \"tutorUserId\", name FROM tutor_subjects WHERE tutor_user_id = $1 ORDER BY id ASC",
      [tutorId]
    );
    return res.status(200).json({ success: true, subjects: result.rows });
  } catch (error) {
    console.error("Get Subjects Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch subjects." });
  }
}

async function addSubject(req, res) {
  const client = await db.pool.connect();
  try {
    const { tutorId } = req.params;
    const { name, subjects } = req.body;
    await client.query("BEGIN");
    await ensureTutorProfile(client, tutorId);

    if (Array.isArray(subjects)) {
      await client.query("DELETE FROM tutor_subjects WHERE tutor_user_id = $1", [tutorId]);
      for (const subj of subjects) {
        const val = typeof subj === "string" ? subj : subj.name;
        if (val && val.trim()) {
          await client.query(
            "INSERT INTO tutor_subjects (tutor_user_id, name) VALUES ($1, $2)",
            [tutorId, val.trim()]
          );
        }
      }
      if (subjects.length > 0) {
        const first = typeof subjects[0] === "string" ? subjects[0] : subjects[0].name;
        await client.query("UPDATE tutor_profiles SET subject_summary = $1 WHERE user_id = $2", [first, tutorId]);
      }
    } else {
      if (!name || !name.trim()) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Subject name is required." });
      }
      await client.query(
        "INSERT INTO tutor_subjects (tutor_user_id, name) VALUES ($1, $2)",
        [tutorId, name.trim()]
      );
    }

    await client.query("COMMIT");
    const result = await db.query(
      "SELECT id, tutor_user_id AS \"tutorUserId\", name FROM tutor_subjects WHERE tutor_user_id = $1 ORDER BY id ASC",
      [tutorId]
    );
    return res.status(201).json({ success: true, message: "Subject(s) saved.", subjects: result.rows });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add Subject Error:", error);
    return res.status(500).json({ success: false, message: "Failed to save subject." });
  } finally {
    client.release();
  }
}

async function deleteSubject(req, res) {
  try {
    const { tutorId, id } = req.params;
    await db.query("DELETE FROM tutor_subjects WHERE id = $1 AND tutor_user_id = $2", [id, tutorId]);
    return res.status(200).json({ success: true, message: "Subject deleted." });
  } catch (error) {
    console.error("Delete Subject Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete subject." });
  }
}

// ─────────────────────────────────────────────────────────────
// 5. TUTOR EDUCATION LEVELS CRUD (tutor_education_levels)
// ─────────────────────────────────────────────────────────────
async function getEducationLevels(req, res) {
  try {
    const { tutorId } = req.params;
    const result = await db.query(
      "SELECT id, tutor_user_id AS \"tutorUserId\", education_level AS \"educationLevel\" FROM tutor_education_levels WHERE tutor_user_id = $1 ORDER BY id ASC",
      [tutorId]
    );
    return res.status(200).json({ success: true, educationLevels: result.rows });
  } catch (error) {
    console.error("Get Education Levels Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch education levels." });
  }
}

async function addEducationLevel(req, res) {
  const client = await db.pool.connect();
  try {
    const { tutorId } = req.params;
    const { educationLevel, education_level, educationLevels } = req.body;
    await client.query("BEGIN");
    await ensureTutorProfile(client, tutorId);

    if (Array.isArray(educationLevels)) {
      await client.query("DELETE FROM tutor_education_levels WHERE tutor_user_id = $1", [tutorId]);
      for (const lvl of educationLevels) {
        const val = typeof lvl === "string" ? lvl : (lvl.educationLevel || lvl.education_level);
        if (val && val.trim()) {
          await client.query(
            "INSERT INTO tutor_education_levels (tutor_user_id, education_level) VALUES ($1, $2)",
            [tutorId, val.trim()]
          );
        }
      }
      if (educationLevels.length > 0) {
        const first = typeof educationLevels[0] === "string" ? educationLevels[0] : (educationLevels[0].educationLevel || educationLevels[0].education_level);
        await client.query("UPDATE tutor_profiles SET education_level = $1 WHERE user_id = $2", [first, tutorId]);
      }
    } else {
      const target = educationLevel || education_level;
      if (!target || !target.trim()) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Education level is required." });
      }
      await client.query(
        "INSERT INTO tutor_education_levels (tutor_user_id, education_level) VALUES ($1, $2)",
        [tutorId, target.trim()]
      );
    }

    await client.query("COMMIT");
    const result = await db.query(
      "SELECT id, tutor_user_id AS \"tutorUserId\", education_level AS \"educationLevel\" FROM tutor_education_levels WHERE tutor_user_id = $1 ORDER BY id ASC",
      [tutorId]
    );
    return res.status(201).json({ success: true, message: "Education level(s) saved.", educationLevels: result.rows });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add Education Level Error:", error);
    return res.status(500).json({ success: false, message: "Failed to save education level." });
  } finally {
    client.release();
  }
}

async function deleteEducationLevel(req, res) {
  try {
    const { tutorId, id } = req.params;
    await db.query("DELETE FROM tutor_education_levels WHERE id = $1 AND tutor_user_id = $2", [id, tutorId]);
    return res.status(200).json({ success: true, message: "Education level deleted." });
  } catch (error) {
    console.error("Delete Education Level Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete education level." });
  }
}

// ─────────────────────────────────────────────────────────────
// 6. TUTOR TAGS CRUD (tutor_tags)
// ─────────────────────────────────────────────────────────────
async function getTags(req, res) {
  try {
    const { tutorId } = req.params;
    const result = await db.query(
      "SELECT id, tutor_user_id AS \"tutorUserId\", tag FROM tutor_tags WHERE tutor_user_id = $1 ORDER BY id ASC",
      [tutorId]
    );
    return res.status(200).json({ success: true, tags: result.rows });
  } catch (error) {
    console.error("Get Tags Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch tags." });
  }
}

async function addTag(req, res) {
  const client = await db.pool.connect();
  try {
    const { tutorId } = req.params;
    const { tag, tags } = req.body;
    await client.query("BEGIN");
    await ensureTutorProfile(client, tutorId);

    if (Array.isArray(tags)) {
      await client.query("DELETE FROM tutor_tags WHERE tutor_user_id = $1", [tutorId]);
      for (const t of tags) {
        const val = typeof t === "string" ? t : t.tag;
        if (val && val.trim()) {
          await client.query(
            "INSERT INTO tutor_tags (tutor_user_id, tag) VALUES ($1, $2)",
            [tutorId, val.trim()]
          );
        }
      }
    } else {
      if (!tag || !tag.trim()) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Tag is required." });
      }
      await client.query(
        "INSERT INTO tutor_tags (tutor_user_id, tag) VALUES ($1, $2)",
        [tutorId, tag.trim()]
      );
    }

    await client.query("COMMIT");
    const result = await db.query(
      "SELECT id, tutor_user_id AS \"tutorUserId\", tag FROM tutor_tags WHERE tutor_user_id = $1 ORDER BY id ASC",
      [tutorId]
    );
    return res.status(201).json({ success: true, message: "Tag(s) saved.", tags: result.rows });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add Tag Error:", error);
    return res.status(500).json({ success: false, message: "Failed to save tag." });
  } finally {
    client.release();
  }
}

async function deleteTag(req, res) {
  try {
    const { tutorId, id } = req.params;
    await db.query("DELETE FROM tutor_tags WHERE id = $1 AND tutor_user_id = $2", [id, tutorId]);
    return res.status(200).json({ success: true, message: "Tag deleted." });
  } catch (error) {
    console.error("Delete Tag Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete tag." });
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/tutors/:tutorId/profile — atomic update of profile & related tables
// ─────────────────────────────────────────────────────────────
async function updateTutorProfile(req, res) {
  const client = await db.pool.connect();
  try {
    const { tutorId } = req.params;
    const {
      name,
      phone,
      avatar,
      tagline,
      bio,
      teachingMethod,
      hourlyRate,
      subject,
      qualification,
      experience,
      location,
      subjects,
      educationLevels,
      languages,
      education,
      certifications,
      tags,
    } = req.body;

    await client.query("BEGIN");
    await ensureTutorProfile(client, tutorId);

    // Update users table
    await client.query(
      `UPDATE users
          SET name       = COALESCE($1, name),
              phone      = COALESCE($2, phone),
              avatar_url = COALESCE($3, avatar_url)
        WHERE id = $4`,
      [name, phone, avatar, tutorId]
    );

    // Update tutor_profiles table
    await client.query(
      `UPDATE tutor_profiles
          SET tagline         = COALESCE($1, tagline),
              bio             = COALESCE($2, bio),
              teaching_method = COALESCE($3, teaching_method),
              hourly_rate     = COALESCE($4, hourly_rate),
              subject_summary = COALESCE($5, subject_summary),
              qualification   = COALESCE($6, qualification),
              experience_text = COALESCE($7, experience_text),
              location        = COALESCE($8, location)
        WHERE user_id = $9`,
      [
        tagline,
        bio,
        teachingMethod,
        hourlyRate ? Number(hourlyRate) : null,
        subject,
        qualification,
        experience,
        location,
        tutorId,
      ]
    );

    // Sync subjects if provided
    if (Array.isArray(subjects)) {
      await client.query("DELETE FROM tutor_subjects WHERE tutor_user_id = $1", [tutorId]);
      for (const subj of subjects) {
        const val = typeof subj === "string" ? subj : subj.name;
        if (val && val.trim()) {
          await client.query(
            "INSERT INTO tutor_subjects (tutor_user_id, name) VALUES ($1, $2)",
            [tutorId, val.trim()]
          );
        }
      }
      if (subjects.length > 0) {
        const primarySubj = typeof subjects[0] === "string" ? subjects[0] : subjects[0].name;
        await client.query("UPDATE tutor_profiles SET subject_summary = $1 WHERE user_id = $2", [primarySubj, tutorId]);
      }
    }

    // Sync education levels if provided
    if (Array.isArray(educationLevels)) {
      await client.query("DELETE FROM tutor_education_levels WHERE tutor_user_id = $1", [tutorId]);
      for (const lvl of educationLevels) {
        const val = typeof lvl === "string" ? lvl : (lvl.educationLevel || lvl.education_level);
        if (val && val.trim()) {
          await client.query(
            "INSERT INTO tutor_education_levels (tutor_user_id, education_level) VALUES ($1, $2)",
            [tutorId, val.trim()]
          );
        }
      }
      if (educationLevels.length > 0) {
        const primaryLevel = typeof educationLevels[0] === "string" ? educationLevels[0] : (educationLevels[0].educationLevel || educationLevels[0].education_level);
        await client.query("UPDATE tutor_profiles SET education_level = $1 WHERE user_id = $2", [primaryLevel, tutorId]);
      }
    }

    // Sync languages if provided
    if (Array.isArray(languages)) {
      await client.query("DELETE FROM tutor_languages WHERE tutor_user_id = $1", [tutorId]);
      for (const lang of languages) {
        const val = typeof lang === "string" ? lang : lang.language;
        if (val && val.trim()) {
          await client.query(
            "INSERT INTO tutor_languages (tutor_user_id, language) VALUES ($1, $2)",
            [tutorId, val.trim()]
          );
        }
      }
    }

    // Sync education if provided
    if (Array.isArray(education)) {
      await client.query("DELETE FROM tutor_education WHERE tutor_user_id = $1", [tutorId]);
      for (const edu of education) {
        if (edu.degree && edu.institution) {
          await client.query(
            "INSERT INTO tutor_education (tutor_user_id, degree, institution, year) VALUES ($1, $2, $3, $4)",
            [tutorId, edu.degree, edu.institution, edu.year ? parseInt(edu.year, 10) : null]
          );
        }
      }
    }

    // Sync certifications if provided
    if (Array.isArray(certifications)) {
      await client.query("DELETE FROM tutor_certifications WHERE tutor_user_id = $1", [tutorId]);
      for (const cert of certifications) {
        const val = typeof cert === "string" ? cert : cert.name;
        if (val && val.trim()) {
          await client.query(
            "INSERT INTO tutor_certifications (tutor_user_id, name) VALUES ($1, $2)",
            [tutorId, val.trim()]
          );
        }
      }
    }

    // Sync tags if provided
    if (Array.isArray(tags)) {
      await client.query("DELETE FROM tutor_tags WHERE tutor_user_id = $1", [tutorId]);
      for (const t of tags) {
        const val = typeof t === "string" ? t : t.tag;
        if (val && val.trim()) {
          await client.query(
            "INSERT INTO tutor_tags (tutor_user_id, tag) VALUES ($1, $2)",
            [tutorId, val.trim()]
          );
        }
      }
    }

    await client.query("COMMIT");

    const updated = await db.getUserWithRoles(tutorId);
    if (updated) delete updated.password_hash;

    return res.status(200).json({ success: true, message: "Tutor profile updated successfully.", tutor: updated });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update Tutor Profile Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update tutor profile." });
  } finally {
    client.release();
  }
}

module.exports = {
  getTutors,
  getTutorById,
  getTutorProfile,
  getTutorReviews,
  getPaymentMethods,
  savePaymentMethods,
  updatePaymentMethod,
  deletePaymentMethod,
  updateTutorProfile,
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,

  // Tutor Details Sub-tables
  getEducation,
  addEducation,
  deleteEducation,
  getCertifications,
  addCertification,
  deleteCertification,
  getLanguages,
  addLanguage,
  deleteLanguage,
  getSubjects,
  addSubject,
  deleteSubject,
  getEducationLevels,
  addEducationLevel,
  deleteEducationLevel,
  getTags,
  addTag,
  deleteTag,
};
