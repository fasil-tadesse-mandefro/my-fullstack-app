const db = require("../config/db");

// GET /api/bookings - List bookings
async function getBookings(req, res) {
  try {
    const { student_email, student_id, tutor_id, status } = req.query;
    let query = `
      SELECT
        b.id AS "bookingId",
        b.id,
        b.student_user_id AS "studentId",
        u_s.name AS "studentName",
        u_s.email AS "studentEmail",
        u_s.phone AS "studentPhone",
        u_s.avatar_url AS "studentAvatar",
        b.tutor_user_id AS "tutorId",
        u_t.name AS "tutorName",
        u_t.avatar_url AS "tutorAvatar",
        u_t.phone AS "tutorPhone",
        COALESCE(s.name, b.topic, 'General') AS "tutorSubject",
        COALESCE(s.name, b.topic, 'General') AS "subject",
        b.topic,
        b.session_type AS "sessionType",
        b.scheduled_start_at AS "scheduledStartAt",
        TO_CHAR(b.scheduled_start_at, 'Mon, DD') AS "date",
        TO_CHAR(b.scheduled_start_at, 'HH12:MI AM') AS "time",
        CONCAT(b.duration_minutes, ' mins') AS "duration",
        b.duration_minutes AS "durationMinutes",
        b.price,
        b.service_fee AS "serviceFee",
        b.total_price AS "totalPrice",
        b.status,
        b.meeting_link AS "meetingLink",
        b.notes,
        b.cancel_reason AS "cancelReason",
        b.cancelled_at AS "cancelledAt",
        b.booked_at AS "bookedAt",
        (SELECT c.id FROM courses c WHERE c.tutor_user_id = b.tutor_user_id LIMIT 1) AS "courseId",
        (SELECT c.title FROM courses c WHERE c.tutor_user_id = b.tutor_user_id LIMIT 1) AS "courseTitle"
      FROM bookings b
      LEFT JOIN users u_s ON b.student_user_id = u_s.id
      LEFT JOIN users u_t ON b.tutor_user_id = u_t.id
      LEFT JOIN subjects s ON b.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (student_email) {
      params.push(student_email.toLowerCase());
      query += ` AND LOWER(u_s.email) = $${params.length}`;
    }

    if (student_id) {
      params.push(student_id);
      query += ` AND b.student_user_id = $${params.length}`;
    }

    if (tutor_id) {
      params.push(tutor_id);
      query += ` AND (b.tutor_user_id = $${params.length} OR u_t.name ILIKE $${params.length})`;
    }

    if (status) {
      params.push(status);
      query += ` AND b.status ILIKE $${params.length}`;
    }

    // Role-based filtering if user is authenticated and not admin
    if (req.user) {
      const userRoles = req.user.roles || [req.user.role];
      if (!userRoles.includes("admin")) {
        if (userRoles.includes("student")) {
          params.push(req.user.id);
          query += ` AND b.student_user_id = $${params.length}`;
        } else if (userRoles.includes("tutor")) {
          params.push(req.user.id);
          query += ` AND b.tutor_user_id = $${params.length}`;
        }
      }
    }

    query += " ORDER BY b.booked_at DESC";

    const result = await db.query(query, params);
    return res.status(200).json({ success: true, count: result.rows.length, bookings: result.rows });
  } catch (error) {
    console.error("Get Bookings Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch bookings." });
  }
}

// GET /api/bookings/:bookingId - Get booking by ID
async function getBookingById(req, res) {
  try {
    const { bookingId } = req.params;
    const query = `
      SELECT
        b.id AS "bookingId",
        b.id,
        b.student_user_id AS "studentId",
        u_s.name AS "studentName",
        u_s.email AS "studentEmail",
        u_s.phone AS "studentPhone",
        u_s.avatar_url AS "studentAvatar",
        b.tutor_user_id AS "tutorId",
        u_t.name AS "tutorName",
        u_t.avatar_url AS "tutorAvatar",
        u_t.phone AS "tutorPhone",
        COALESCE(s.name, b.topic, 'General') AS "tutorSubject",
        COALESCE(s.name, b.topic, 'General') AS "subject",
        b.topic,
        b.session_type AS "sessionType",
        b.scheduled_start_at AS "scheduledStartAt",
        TO_CHAR(b.scheduled_start_at, 'Mon, DD') AS "date",
        TO_CHAR(b.scheduled_start_at, 'HH12:MI AM') AS "time",
        CONCAT(b.duration_minutes, ' mins') AS "duration",
        b.duration_minutes AS "durationMinutes",
        b.price,
        b.service_fee AS "serviceFee",
        b.total_price AS "totalPrice",
        b.status,
        b.meeting_link AS "meetingLink",
        b.notes,
        b.cancel_reason AS "cancelReason",
        b.cancelled_at AS "cancelledAt",
        b.booked_at AS "bookedAt",
        (SELECT c.id FROM courses c WHERE c.tutor_user_id = b.tutor_user_id LIMIT 1) AS "courseId",
        (SELECT c.title FROM courses c WHERE c.tutor_user_id = b.tutor_user_id LIMIT 1) AS "courseTitle"
      FROM bookings b
      LEFT JOIN users u_s ON b.student_user_id = u_s.id
      LEFT JOIN users u_t ON b.tutor_user_id = u_t.id
      LEFT JOIN subjects s ON b.subject_id = s.id
      WHERE b.id = $1
    `;
    const result = await db.query(query, [bookingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    return res.status(200).json({ success: true, booking: result.rows[0] });
  } catch (error) {
    console.error("Get Booking By ID Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch booking." });
  }
}

// POST /api/bookings - Create new booking
async function createBooking(req, res) {
  try {
    const {
      bookingId,
      tutorId,
      tutorName,
      tutorAvatar,
      tutorSubject,
      studentId,
      studentName,
      studentEmail,
      studentPhone,
      subject,
      topic,
      sessionType,
      date,
      time,
      duration,
      price,
      serviceFee,
      totalPrice,
      notes,
    } = req.body;

    const bId = bookingId || `bk-${Date.now().toString().slice(-6)}`;
    const meetingLink = `/live-class/${bId}`;
    const durationMinutes = Number.parseInt(String(duration || "60"), 10) || 60;
    const scheduledStartAt = req.body.scheduledStartAt || new Date().toISOString();

    const insertQuery = `
      INSERT INTO bookings (
        id, tutor_user_id, student_user_id, topic, session_type,
        scheduled_start_at, duration_minutes, price, service_fee,
        total_price, status, meeting_link, notes, booked_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *
    `;

    const values = [
      bId,
      tutorId ? String(tutorId) : null,
      req.user.id,
      topic || "Calculus Session",
      sessionType || "1-on-1 Live Class",
      scheduledStartAt,
      durationMinutes,
      price ? Number(price) : 25.0,
      serviceFee ? Number(serviceFee) : 2.0,
      totalPrice ? Number(totalPrice) : 27.0,
      "pending",
      meetingLink,
      notes || null,
    ];

    const result = await db.query(insertQuery, values);
    return res.status(201).json({
      success: true,
      booking: { ...result.rows[0], bookingId: result.rows[0].id },
    });
  } catch (error) {
    console.error("Create Booking Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create booking." });
  }
}

// POST /api/bookings/:bookingId/receipt - Submit Payment Receipt
async function submitReceipt(req, res) {
  try {
    const { bookingId } = req.params;
    const {
      paymentMethod,
      paymentAccountUsed,
      paymentAccountName,
      transactionRef,
      payerName,
      payerPhone,
      receiptImage,
      receiptFileName,
      receiptNote,
    } = req.body;

    if (!transactionRef) {
      return res.status(400).json({ success: false, message: "Transaction reference ID is required." });
    }

    const updateQuery = `
      UPDATE bookings
      SET status = 'pending approval'
      WHERE id = $1 AND student_user_id = $2
      RETURNING *
    `;

    const values = [
      bookingId,
      req.user.id,
    ];

    const result = await db.query(updateQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Payment receipt submitted successfully. Awaiting tutor approval.",
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("Submit Receipt Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to upload payment receipt." });
  }
}

// PUT /api/bookings/:bookingId/approve - Tutor Approves Payment & Confirms Booking
async function approveBooking(req, res) {
  try {
    const { bookingId } = req.params;
    const updateQuery = `
      UPDATE bookings
      SET status = 'confirmed'
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(updateQuery, [bookingId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Payment approved and booking confirmed successfully.",
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("Approve Booking Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to approve booking." });
  }
}

// PUT /api/bookings/:bookingId/reject - Tutor Rejects Receipt
async function rejectBooking(req, res) {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const updateQuery = `
      UPDATE bookings
      SET status = 'cancelled', cancel_reason = $1, cancelled_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(updateQuery, [reason || "Receipt rejected by tutor", bookingId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Payment receipt rejected.",
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("Reject Booking Controller Error:", error);
    return res.status(500).json({ success: false, message: "Failed to reject booking." });
  }
}

// PATCH /api/bookings/:bookingId/status
async function updateBookingStatus(req, res) {
  try {
    const { bookingId } = req.params;
    const { status, cancelReason } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }
    const result = await db.query(
      `UPDATE bookings
          SET status       = $1,
              cancel_reason = CASE WHEN $1 = 'Cancelled' THEN $2 ELSE cancel_reason END,
              cancelled_at  = CASE WHEN $1 = 'Cancelled' THEN CURRENT_TIMESTAMP ELSE cancelled_at END
        WHERE id = $3
        RETURNING *`,
      [status, cancelReason || null, bookingId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }
    return res.status(200).json({ success: true, booking: result.rows[0] });
  } catch (error) {
    console.error("Update Booking Status Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update booking status." });
  }
}

// Aliases so both old PUT and new PATCH routes work
const approveReceipt = approveBooking;
const rejectReceipt = rejectBooking;

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  submitReceipt,
  approveBooking,
  rejectBooking,
  approveReceipt,
  rejectReceipt,
  updateBookingStatus,
};
