const db = require("../config/db");

// GET /api/courses - List courses with filters
async function getCourses(req, res) {
  try {
    const { tutor_id, status, level, subject, search } = req.query;

    let query = `
      SELECT
        c.id,
        c.catalog_id AS "catalogId",
        c.tutor_user_id AS "tutorId",
        u.name AS tutor,
        u.name AS "tutorName",
        u.avatar_url AS "tutorAvatar",
        c.title,
        c.description,
        c.level,
        c.lessons_count AS "lessonsCount",
        c.duration_minutes AS "durationMinutes",
        c.rating,
        c.students_count AS "studentsCount",
        c.price,
        c.is_free AS "isFree",
        c.thumbnail_url AS thumbnail,
        c.thumbnail_url AS "thumbnailUrl",
        c.status,
        c.updated_at AS "updatedAt"
      FROM courses c
      LEFT JOIN users u ON c.tutor_user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (tutor_id) {
      params.push(tutor_id);
      query += ` AND (c.tutor_user_id = $${params.length} OR LOWER(u.name) LIKE LOWER($${params.length}))`;
    }

    if (status) {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }

    if (level) {
      params.push(level);
      query += ` AND c.level = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
    }

    query += ` ORDER BY c.updated_at DESC NULLS LAST, c.id DESC`;

    const result = await db.query(query, params);

    const courses = result.rows.map((row) => {
      const durMins = Number(row.durationMinutes || 0);
      let durationStr = "Self-paced";
      if (durMins >= 60) {
        const hrs = Math.round(durMins / 60);
        durationStr = `${hrs} ${hrs === 1 ? "hour" : "hours"}`;
      } else if (durMins > 0) {
        durationStr = `${durMins} mins`;
      }

      return {
        ...row,
        price: Number(row.price || 0),
        rating: Number(row.rating || 5.0),
        lessonsCount: Number(row.lessonsCount || 0),
        studentsCount: Number(row.studentsCount || 0),
        duration: durationStr,
        durationMinutes: durMins,
        category: row.category || row.subject || (row.level ? row.level.split("(")[0].trim() : "Course"),
        tutor: row.tutor || row.tutorName || "Abugida Tutor",
        thumbnail: row.thumbnail || row.thumbnailUrl || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
        updatedAt: row.updatedAt
          ? new Date(row.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "Recently",
      };
    });

    return res.status(200).json({ success: true, count: courses.length, courses });
  } catch (error) {
    console.error("Get Courses Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch courses." });
  }
}

// GET /api/courses/:id - Get course by ID with lessons
async function getCourseById(req, res) {
  try {
    const { id } = req.params;

    const courseRes = await db.query(
      `SELECT
        c.id,
        c.catalog_id AS "catalogId",
        c.tutor_user_id AS "tutorId",
        u.name AS tutor,
        u.name AS "tutorName",
        u.avatar_url AS "tutorAvatar",
        tp.subject_summary AS "tutorSubject",
        c.title,
        c.description,
        c.level,
        c.lessons_count AS "lessonsCount",
        c.duration_minutes AS "durationMinutes",
        c.rating,
        c.students_count AS "studentsCount",
        c.price,
        c.is_free AS "isFree",
        c.thumbnail_url AS thumbnail,
        c.status,
        c.updated_at AS "updatedAt"
      FROM courses c
      LEFT JOIN users u ON c.tutor_user_id = u.id
      LEFT JOIN tutor_profiles tp ON c.tutor_user_id = tp.user_id
      WHERE c.id = $1`,
      [id]
    );

    if (courseRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    const course = courseRes.rows[0];

    // Fetch lessons — PUBLIC preview only: no video_url here. This endpoint is
    // unauthenticated/browsable, so actual lesson video content must never be
    // returned by it. Protected lesson content is served by
    // getCourseForLearning (GET /api/courses/:id/learn), which enforces auth
    // + access checks before including videoUrl.
    const lessonsRes = await db.query(
      `SELECT id, course_id AS "courseId", lesson_number AS "lessonNumber", title, duration_minutes AS "durationMinutes", description
       FROM course_lessons
       WHERE course_id = $1
       ORDER BY lesson_number ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      course: {
        ...course,
        price: Number(course.price || 0),
        rating: Number(course.rating || 5.0),
        lessons: lessonsRes.rows,
      },
    });
  } catch (error) {
    console.error("Get Course By ID Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch course details." });
  }
}

// ─────────────────────────────────────────────────────────────
// Course access control (booking/payment gated learning content)
// ─────────────────────────────────────────────────────────────
//
// A student is granted access to a paid course when they are enrolled in it
// or have a confirmed booking with its tutor. The queries below match the
// current fasil_update schema.
async function resolveCourseAccess(course, user) {
  if (course.isFree || course.is_free) {
    return { allowed: true };
  }

  if (!user) {
    return { allowed: false, status: "unauthenticated" };
  }

  const tutorId = course.tutorId || course.tutor_user_id;

  // The course's own tutor (previewing/managing their own content) and
  // admins already have legitimate access via their existing elevated
  // roles/routes — no separate booking is required for them.
  const userRoles = user.roles || [user.role];
  if (userRoles.includes("admin") || String(user.id) === String(tutorId)) {
    return { allowed: true };
  }

  const enrollmentRes = await db.query(
    `SELECT status
       FROM course_enrollments
      WHERE course_id = $1 AND student_user_id = $2
      ORDER BY enrolled_at DESC
      LIMIT 1`,
    [course.id, user.id]
  );

  const enrollment = enrollmentRes.rows[0];
  if (enrollment && ["active", "approved", "enrolled", "completed"].includes(String(enrollment.status).toLowerCase())) {
    return { allowed: true };
  }

  const bookingRes = await db.query(
    `SELECT id AS "bookingId", status, cancel_reason AS "cancelReason"
     FROM bookings
     WHERE tutor_user_id = $1 AND student_user_id = $2
     ORDER BY booked_at DESC
     LIMIT 1`,
    [tutorId, user.id]
  );

  const booking = bookingRes.rows[0];

  if (!booking) {
    return { allowed: false, status: "no_booking", tutorId };
  }

  const bookingStatus = String(booking.status || "").toLowerCase();
  if (["confirmed", "approved", "completed"].includes(bookingStatus)) {
    return { allowed: true };
  }

  if (["cancelled", "rejected"].includes(bookingStatus)) {
    return {
      allowed: false,
      status: "cancelled",
      tutorId,
      bookingId: booking.bookingId,
      cancelReason: booking.cancelReason,
    };
  }

  if (["pending approval", "pending_approval", "receipt_submitted"].includes(bookingStatus)) {
    return { allowed: false, status: "pending_approval", tutorId, bookingId: booking.bookingId };
  }

  // "Payment Pending" or any other in-progress state
  return { allowed: false, status: "pending_payment", tutorId, bookingId: booking.bookingId };
}

function accessDeniedMessage(access) {
  switch (access.status) {
    case "unauthenticated":
      return "Please sign in to access this course.";
    case "no_booking":
      return "You need to book and complete payment with this course's tutor before accessing its lessons.";
    case "pending_payment":
      return "Your booking payment hasn't been completed yet. Finish the payment process to unlock this course.";
    case "pending_approval":
      return "Your payment receipt is awaiting tutor approval. You'll get access as soon as it's approved.";
    case "cancelled":
      return `Your booking with this tutor was cancelled or rejected.${access.cancelReason ? ` Reason: ${access.cancelReason}` : ""} Please book again to access this course.`;
    default:
      return "You don't have access to this course yet.";
  }
}

// GET /api/courses/:id/learn - Protected lesson content (auth + access required)
async function getCourseForLearning(req, res) {
  try {
    const { id } = req.params;

    const courseRes = await db.query(
      `SELECT
        c.id,
        c.tutor_user_id AS "tutorId",
        u.name AS tutor,
        u.name AS "tutorName",
        c.title,
        c.description,
        c.level,
        c.thumbnail_url AS thumbnail,
        c.price,
        c.is_free AS "isFree",
        c.status
      FROM courses c
      LEFT JOIN users u ON c.tutor_user_id = u.id
      WHERE c.id = $1`,
      [id]
    );

    if (courseRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    const course = courseRes.rows[0];

    // req.user is guaranteed by the authenticateToken middleware on this route.
    const access = await resolveCourseAccess(course, req.user);

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: accessDeniedMessage(access),
        accessStatus: access.status,
        tutorId: access.tutorId || course.tutorId,
        bookingId: access.bookingId || null,
      });
    }

    const lessonsRes = await db.query(
      `SELECT id, course_id AS "courseId", lesson_number AS "lessonNumber", title, duration_minutes AS "durationMinutes", description, video_url AS "videoUrl"
       FROM course_lessons
       WHERE course_id = $1
       ORDER BY lesson_number ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      course: {
        ...course,
        price: Number(course.price || 0),
        lessons: lessonsRes.rows,
      },
    });
  } catch (error) {
    console.error("Get Course For Learning Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load course content." });
  }
}

// POST /api/courses - Create new course (Tutor / Admin)
async function createCourse(req, res) {
  const client = await db.pool.connect();
  try {
    const {
      title,
      description,
      level,
      price,
      isFree,
      thumbnail,
      thumbnailUrl,
      status,
      lessons,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Course title is required." });
    }

    const tutorUserId = req.user?.id || req.body.tutorId || req.body.tutor_user_id || "usr-tutor-01";
    const courseId = `crs-${Date.now().toString().slice(-6)}`;
    const coursePrice = Number(price || 0);
    const freeBool = isFree !== undefined ? Boolean(isFree) : coursePrice === 0;
    const courseStatus = status || "Published";
    const thumb = thumbnail || thumbnailUrl || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80";
    const lessonsList = Array.isArray(lessons) ? lessons : [];
    const lessonsCount = lessonsList.length || 1;

    await client.query("BEGIN");

    const insertCourseQuery = `
      INSERT INTO courses (
        id, tutor_user_id, title, description, level,
        lessons_count, duration_minutes, rating, students_count,
        price, is_free, thumbnail_url, status, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *
    `;

    const courseValues = [
      courseId,
      tutorUserId,
      title.trim(),
      description ? description.trim() : null,
      level || "Preparatory (Grade 11 - 12)",
      lessonsCount,
      lessonsCount * 15, // estimated duration
      5.0,
      0,
      coursePrice,
      freeBool,
      thumb,
      courseStatus,
    ];

    const courseResult = await client.query(insertCourseQuery, courseValues);

    // Insert lessons if provided
    let lessonNum = 1;
    for (const l of lessonsList) {
      const lessonId = Date.now() + lessonNum;
      await client.query(
        `INSERT INTO course_lessons (id, course_id, lesson_number, title, duration_minutes, description, video_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          lessonId,
          courseId,
          lessonNum++,
          l.title || `Lesson ${lessonNum}`,
          Number(l.durationMinutes || l.duration || 15),
          l.description || null,
          l.videoUrl || l.videoName || null,
        ]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Course created successfully.",
      course: courseResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create Course Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create course." });
  } finally {
    client.release();
  }
}

// PUT /api/courses/:id - Update course
async function updateCourse(req, res) {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const {
      title,
      description,
      level,
      price,
      isFree,
      thumbnail,
      thumbnailUrl,
      status,
      lessons,
    } = req.body;

    await client.query("BEGIN");

    const updateQuery = `
      UPDATE courses
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        level = COALESCE($3, level),
        price = COALESCE($4, price),
        is_free = COALESCE($5, is_free),
        thumbnail_url = COALESCE($6, thumbnail_url),
        status = COALESCE($7, status),
        lessons_count = COALESCE($8, lessons_count),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;

    const thumb = thumbnail || thumbnailUrl;
    const coursePrice = price !== undefined ? Number(price) : null;
    const freeBool = isFree !== undefined ? Boolean(isFree) : (coursePrice !== null ? coursePrice === 0 : null);
    const lessonsCount = Array.isArray(lessons) ? lessons.length : null;

    const result = await client.query(updateQuery, [
      title ? title.trim() : null,
      description ? description.trim() : null,
      level || null,
      coursePrice,
      freeBool,
      thumb || null,
      status || null,
      lessonsCount,
      id,
    ]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    // Update lessons if provided
    if (Array.isArray(lessons)) {
      await client.query("DELETE FROM course_lessons WHERE course_id = $1", [id]);
      let num = 1;
      for (const l of lessons) {
        const lessonId = Date.now() + num;
        await client.query(
          `INSERT INTO course_lessons (id, course_id, lesson_number, title, duration_minutes, description, video_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            lessonId,
            id,
            num++,
            l.title || `Lesson ${num}`,
            Number(l.durationMinutes || 15),
            l.description || null,
            l.videoUrl || l.videoName || null,
          ]
        );
      }
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Course updated successfully.",
      course: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update Course Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update course." });
  } finally {
    client.release();
  }
}

// DELETE /api/courses/:id - Delete course
async function deleteCourse(req, res) {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");
    await client.query("DELETE FROM course_lessons WHERE course_id = $1", [id]);
    await client.query("DELETE FROM lesson_progress WHERE course_id = $1", [id]);
    await client.query("DELETE FROM course_enrollments WHERE course_id = $1", [id]);
    const result = await client.query("DELETE FROM courses WHERE id = $1 RETURNING id, title", [id]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: `Course "${result.rows[0].title}" deleted successfully.`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete Course Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete course." });
  } finally {
    client.release();
  }
}

// PATCH /api/courses/:id/status - Update course status (Draft / Published / Pending Review)
async function updateCourseStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }

    const result = await db.query(
      `UPDATE courses SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    return res.status(200).json({
      success: true,
      message: `Course status updated to ${status}.`,
      course: result.rows[0],
    });
  } catch (error) {
    console.error("Update Course Status Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update course status." });
  }
}

module.exports = {
  getCourses,
  getCourseById,
  getCourseForLearning,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseStatus,
};
