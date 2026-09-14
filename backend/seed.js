/**
 * Abugida Database Seed Script
 * --------------------------------
 * Seeds the demo accounts (students, tutors, admin) and courses.
 *
 * Run once:  node seed.js
 *
 * Safe to re-run — uses ON CONFLICT DO NOTHING / UPDATE so it won't duplicate rows.
 */

const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "abugida_db",
  password: process.env.DB_PASSWORD || "0324",
  port: parseInt(process.env.DB_PORT || "5432", 10),
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log("🌱 Starting seed...\n");

    const HASH = await bcrypt.hash("Password123!", 10);

    // ── 1. STUDENT ──────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO users (id, name, email, password_hash, phone, avatar_url, account_status)
      VALUES (
        'usr-student-01',
        'Nahom Tadesse',
        'student@abugida.com',
        $1,
        '+251 91 123 4567',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        'approved'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        account_status = 'approved'
    `, [HASH]);

    await client.query(`
      INSERT INTO user_roles (user_id, role, assigned_at)
      VALUES ('usr-student-01', 'student', NOW())
      ON CONFLICT (user_id, role) DO NOTHING
    `);

    await client.query(`
      INSERT INTO student_profiles (user_id, grade_level, learning_focus)
      VALUES (
        'usr-student-01',
        'Grade 11 (Natural Science)',
        'Mathematics, Physics, Python'
      )
      ON CONFLICT (user_id) DO UPDATE SET
        grade_level = EXCLUDED.grade_level,
        learning_focus = EXCLUDED.learning_focus
    `);

    console.log("  ✓ Student seeded: student@abugida.com");

    // ── 2. ADMIN ─────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO users (id, name, email, password_hash, phone, avatar_url, department, account_status)
      VALUES (
        'usr-admin-01',
        'Abugida Admin',
        'admin@abugida.com',
        $1,
        '+251 91 000 0000',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        'Platform Operations',
        'approved'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        account_status = 'approved'
    `, [HASH]);

    await client.query(`
      INSERT INTO user_roles (user_id, role, assigned_at)
      VALUES ('usr-admin-01', 'admin', NOW())
      ON CONFLICT (user_id, role) DO NOTHING
    `);

    console.log("  ✓ Admin seeded:   admin@abugida.com");

    // ── 3. TUTORS (Top 4 Featured Tutors) ──────────────────────────────────
    const tutorsData = [
      {
        id: 'usr-tutor-01',
        name: 'Dr. Abebe Bekele',
        email: 'tutor@abugida.com',
        phone: '+251 92 234 5678',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        subject: 'Mathematics',
        qualification: 'Ph.D. in Applied Mathematics, AAU',
        experience: '8+ years',
        hourlyRate: 25.00,
        rating: 4.90,
        reviewsCount: 128,
        educationLevel: 'Preparatory (Grade 11 - 12)',
        availabilityLabel: 'Available Today',
        verified: true,
        location: 'Addis Ababa, Ethiopia',
        tagline: 'Passionate mathematics educator specializing in calculus, linear algebra, and university entrance prep.',
        bio: 'Dr. Abebe Bekele holds a Ph.D. in Applied Mathematics from Addis Ababa University with over 8 years of tutoring and lecture experience.',
        teachingMethod: 'Interactive problem-solving using digital whiteboards, real-world engineering applications, and weekly progress tracking.',
        coursesCount: 3,
        tags: ["Calculus", "Algebra", "Statistics", "Exam Prep", "University Entrance"],
        subjects: ["Mathematics", "Calculus", "Algebra", "Statistics", "Trigonometry"],
        languages: ["Amharic (Native)", "English (Fluent)"],
      },
      {
        id: 'usr-tutor-02',
        name: 'Bethlehem Tadesse',
        email: 'bethlehem@abugida.com',
        phone: '+251 91 345 6789',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        subject: 'English',
        qualification: 'M.A. in English Literature & Linguistics',
        experience: '5+ years',
        hourlyRate: 20.00,
        rating: 4.80,
        reviewsCount: 94,
        educationLevel: 'Secondary (Grade 9 - 10)',
        availabilityLabel: 'Available This Week',
        verified: true,
        location: 'Addis Ababa, Ethiopia',
        tagline: 'Certified ESL and literature instructor dedicated to helping students develop fluent speaking and critical academic writing skills.',
        bio: 'Bethlehem Tadesse is an experienced English language educator with a Master\'s degree in English Language Teaching.',
        teachingMethod: 'Communicative language practice, structured essay frameworks, grammar drills, and active vocabulary building.',
        coursesCount: 2,
        tags: ["Essay Writing", "Grammar", "IELTS", "Public Speaking"],
        subjects: ["English", "Academic Writing", "Grammar", "Literature"],
        languages: ["English (Fluent)", "Amharic (Native)"],
      },
      {
        id: 'usr-tutor-03',
        name: 'Yonas Haile',
        email: 'yonas@abugida.com',
        phone: '+251 94 456 7890',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        subject: 'Physics',
        qualification: 'M.Sc. in Mechanical Engineering, AAiT',
        experience: '7+ years',
        hourlyRate: 28.00,
        rating: 5.00,
        reviewsCount: 110,
        educationLevel: 'University & College',
        availabilityLabel: 'Available Tomorrow',
        verified: true,
        location: 'Hawassa, Ethiopia',
        tagline: 'Mechanical engineer & university lecturer making physics concepts intuitive, visual, and applicable to real-world problems.',
        bio: 'Yonas Haile holds a Master\'s degree in Mechanical Engineering and has taught physics at preparatory and collegiate levels for over 7 years.',
        teachingMethod: 'Visual physics simulations, numerical problem-solving templates, unit conversions, and past entrance exam deconstructions.',
        coursesCount: 2,
        tags: ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics"],
        subjects: ["Physics", "Mechanics", "Electromagnetism", "General Physics"],
        languages: ["Amharic (Native)", "English (Fluent)"],
      },
      {
        id: 'usr-tutor-04',
        name: 'Sara Mohammed',
        email: 'sara@abugida.com',
        phone: '+251 93 567 8901',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        subject: 'Computer Science',
        qualification: 'B.Sc. in Computer Science, AAU',
        experience: '6+ years',
        hourlyRate: 30.00,
        rating: 4.90,
        reviewsCount: 86,
        educationLevel: 'Preparatory (Grade 11 - 12)',
        availabilityLabel: 'Available Today',
        verified: true,
        location: 'Addis Ababa, Ethiopia',
        tagline: 'Software engineer guiding students step-by-step through Python, data structures, algorithms, and web development fundamentals.',
        bio: 'Sara Mohammed is a software engineer and tech educator who has coached hundreds of students from complete beginners to landing internships.',
        teachingMethod: 'Hands-on live coding sessions, interactive coding challenges, project-based learning, and algorithmic breakdown.',
        coursesCount: 4,
        tags: ["Python", "Algorithms", "Web Development", "Data Structures"],
        subjects: ["Computer Science", "Python", "Data Structures", "Programming"],
        languages: ["Amharic (Native)", "English (Fluent)", "Oromo (Conversational)"],
      },
    ];

    for (const t of tutorsData) {
      await client.query(`
        INSERT INTO users (id, name, email, password_hash, phone, avatar_url, account_status)
        VALUES ($1, $2, $3, $4, $5, $6, 'approved')
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          avatar_url = EXCLUDED.avatar_url,
          account_status = 'approved'
      `, [t.id, t.name, t.email, HASH, t.phone, t.avatar]);

      await client.query(`
        INSERT INTO user_roles (user_id, role, assigned_at)
        VALUES ($1, 'tutor', NOW())
        ON CONFLICT (user_id, role) DO NOTHING
      `, [t.id]);

      await client.query(`
        INSERT INTO tutor_profiles (
          user_id, subject_summary, qualification, experience_text,
          hourly_rate, rating, reviews_count, education_level,
          availability_label, verified, location, tagline, bio, teaching_method, courses_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (user_id) DO UPDATE SET
          subject_summary = EXCLUDED.subject_summary,
          qualification = EXCLUDED.qualification,
          experience_text = EXCLUDED.experience_text,
          hourly_rate = EXCLUDED.hourly_rate,
          rating = EXCLUDED.rating,
          reviews_count = EXCLUDED.reviews_count,
          education_level = EXCLUDED.education_level,
          availability_label = EXCLUDED.availability_label,
          verified = EXCLUDED.verified,
          location = EXCLUDED.location,
          tagline = EXCLUDED.tagline,
          bio = EXCLUDED.bio,
          teaching_method = EXCLUDED.teaching_method,
          courses_count = EXCLUDED.courses_count
      `, [
        t.id, t.subject, t.qualification, t.experience,
        t.hourlyRate, t.rating, t.reviewsCount, t.educationLevel,
        t.availabilityLabel, t.verified, t.location, t.tagline, t.bio,
        t.teachingMethod, t.coursesCount
      ]);

      // Seed payment methods
      await client.query(`
        INSERT INTO tutor_payment_methods (id, tutor_user_id, type, account_name, account_number, branch, instructions, is_primary, status, created_at, updated_at)
        VALUES
        (
          $1, $2,
          'Telebirr', $3, '0911234567', '',
          'Please send via Telebirr and write your Booking ID in the transfer note.',
          true, 'active', NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `, [`pm-telebirr-${t.id}`, t.id, t.name]);

      // Seed registration status
      await client.query(`
        INSERT INTO tutor_registrations (tutor_user_id, registration_status, current_step, completed_at)
        VALUES ($1, 'approved', 'completed', NOW())
        ON CONFLICT (tutor_user_id) DO NOTHING
      `, [t.id]);

      console.log(`  ✓ Tutor seeded: ${t.name} (${t.email})`);
    }

    // ── 4. COURSES (Featured Courses) ───────────────────────────────────────
    const coursesData = [
      {
        id: 'crs-calculus-01',
        tutorId: 'usr-tutor-01',
        title: 'Mastering High School Calculus & Algebra',
        description: 'A comprehensive step-by-step masterclass covering limits, derivatives, integration techniques, and coordinate geometry tailored for preparatory and university entrance.',
        level: 'Preparatory (Grade 11 - 12)',
        lessonsCount: 28,
        durationMinutes: 840,
        rating: 4.95,
        studentsCount: 420,
        price: 35.00,
        isFree: false,
        thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
        status: 'Published'
      },
      {
        id: 'crs-english-02',
        tutorId: 'usr-tutor-02',
        title: 'English Fluency & Academic Essay Writing',
        description: 'Develop the reading, writing, and speaking skills needed for academic success and confident everyday communication.',
        level: 'High School & College',
        lessonsCount: 20,
        durationMinutes: 600,
        rating: 4.80,
        studentsCount: 610,
        price: 0.00,
        isFree: true,
        thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
        status: 'Published'
      },
      {
        id: 'crs-python-03',
        tutorId: 'usr-tutor-04',
        title: 'Python Programming: Zero to Hero Bootcamp',
        description: 'Learn Python from the ground up and build a strong foundation for creating useful programs, automating tasks, and solving real-world challenges.',
        level: 'Beginner to Intermediate',
        lessonsCount: 36,
        durationMinutes: 1080,
        rating: 5.00,
        studentsCount: 890,
        price: 40.00,
        isFree: false,
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
        status: 'Published'
      },
      {
        id: 'crs-physics-04',
        tutorId: 'usr-tutor-03',
        title: 'Comprehensive Physics for National Exams',
        description: 'Prepare for national matriculation exams with focused physics lessons connecting mechanics, wave optics, electricity, and thermodynamics.',
        level: 'Preparatory (Grade 11 - 12)',
        lessonsCount: 24,
        durationMinutes: 720,
        rating: 4.90,
        studentsCount: 350,
        price: 30.00,
        isFree: false,
        thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80',
        status: 'Published'
      }
    ];

    for (const c of coursesData) {
      await client.query(`
        INSERT INTO courses (
          id, tutor_user_id, title, description, level, lessons_count,
          duration_minutes, rating, students_count, price, is_free,
          thumbnail_url, status, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        ON CONFLICT (id) DO UPDATE SET
          tutor_user_id = EXCLUDED.tutor_user_id,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          level = EXCLUDED.level,
          lessons_count = EXCLUDED.lessons_count,
          duration_minutes = EXCLUDED.duration_minutes,
          rating = EXCLUDED.rating,
          students_count = EXCLUDED.students_count,
          price = EXCLUDED.price,
          is_free = EXCLUDED.is_free,
          thumbnail_url = EXCLUDED.thumbnail_url,
          status = EXCLUDED.status,
          updated_at = NOW()
      `, [
        c.id, c.tutorId, c.title, c.description, c.level, c.lessonsCount,
        c.durationMinutes, c.rating, c.studentsCount, c.price, c.isFree,
        c.thumbnail, c.status
      ]);

      // Seed Lessons for each course if none exist
      const existingLessons = await client.query("SELECT 1 FROM course_lessons WHERE course_id = $1 LIMIT 1", [c.id]);
      if (existingLessons.rowCount === 0) {
        const lessons = [
          { num: 1, title: 'Welcome and Course Overview', mins: 15, desc: 'Course orientation, learning objectives, and curriculum breakdown.' },
          { num: 2, title: 'Core Concepts and Fundamentals', mins: 25, desc: 'Detailed explanation of foundational principles with visual examples.' },
          { num: 3, title: 'Step-by-Step Problem Solving', mins: 30, desc: 'Guided walkthrough of representative national exam questions.' },
          { num: 4, title: 'Summary & Practice Exercises', mins: 20, desc: 'Recap of key takeaways and practice worksheet drill.' },
        ];
        for (let i = 0; i < lessons.length; i++) {
          const lessonId = Date.now() + i + Math.floor(Math.random() * 1000);
          await client.query(`
            INSERT INTO course_lessons (id, course_id, lesson_number, title, duration_minutes, description, video_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            lessonId,
            c.id,
            lessons[i].num,
            lessons[i].title,
            lessons[i].mins,
            lessons[i].desc,
            'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
          ]);
        }
      }

      console.log(`  ✓ Course seeded: ${c.title}`);
    }

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Seed complete!

  Demo Accounts:
  ──────────────
  student@abugida.com      student   Password123!
  tutor@abugida.com        tutor     Password123!
  bethlehem@abugida.com    tutor     Password123!
  yonas@abugida.com        tutor     Password123!
  sara@abugida.com         tutor     Password123!
  admin@abugida.com        admin     Password123!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
