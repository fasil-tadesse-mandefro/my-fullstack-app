const { Pool, Client } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

// ⚠️  No hard-coded password fallback — DB_PASSWORD must be set via environment variable.
if (!process.env.DB_PASSWORD && process.env.NODE_ENV === "production") {
  throw new Error("DB_PASSWORD environment variable is required in production.");
}

// SSL: set DB_SSL=true for cloud providers (Neon, Railway, Supabase, Render, etc.)
// Also auto-detect if host or DATABASE_URL contains neon.tech or similar cloud domains
const useSsl =
  process.env.DB_SSL === "true" ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("sslmode=require")) ||
  (process.env.DB_HOST && process.env.DB_HOST.includes("neon.tech"));

const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    }
  : {
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "abugida_db",
      password: process.env.DB_PASSWORD || "",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    };

// Function to ensure database exists
async function ensureDatabaseExists() {
  const rootClient = new Client({
    user: dbConfig.user,
    host: dbConfig.host,
    database: "postgres", // Connect to default postgres DB
    password: dbConfig.password,
    port: dbConfig.port,
  });

  try {
    await rootClient.connect();
    const checkDb = await rootClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbConfig.database]
    );

    if (checkDb.rowCount === 0) {
      console.log(`Database "${dbConfig.database}" does not exist. Creating...`);
      await rootClient.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log(`Database "${dbConfig.database}" created successfully.`);
    } else {
      console.log(`Database "${dbConfig.database}" already exists.`);
    }
  } catch (error) {
    console.error("Error verifying/creating database:", error.message);
  } finally {
    await rootClient.end();
  }
}

// PostgreSQL Connection Pool
const pool = new Pool(dbConfig);

pool.on("connect", () => {
  console.log(`✓ Connected to PostgreSQL: ${dbConfig.database}`);
});

/**
 * Fetch a user with all roles and role-specific profile data joined.
 * Accepts either a user id or email address.
 */
async function getUserWithRoles(idOrEmail) {
  const isEmail = String(idOrEmail).includes("@");
  const where = isEmail
    ? "LOWER(u.email) = LOWER($1)"
    : "u.id = $1 OR u.id = ('usr-tutor-0' || $1) OR u.id = ('usr-tutor-' || $1)";

  const result = await pool.query(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.password_hash,
       u.phone,
       u.avatar_url        AS avatar,
       u.joined_at,
       u.department,
       u.account_status    AS status,
       COALESCE(
         json_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL),
         '[]'
       )                   AS roles,
       sp.grade_level      AS "gradeLevel",
       sp.learning_focus   AS "learningFocus",
       tp.subject_summary  AS subject,
       tp.qualification,
       tp.experience_text  AS experience,
       tp.hourly_rate      AS "hourlyRate",
       tp.rating,
       tp.reviews_count    AS "reviewsCount",
       tp.education_level  AS "educationLevel",
       tp.verified,
       tp.location,
       tp.tagline,
       tp.bio,
       tp.teaching_method  AS "teachingMethod"
     FROM users u
     LEFT JOIN user_roles       ur ON u.id = ur.user_id
     LEFT JOIN student_profiles sp ON u.id = sp.user_id
     LEFT JOIN tutor_profiles   tp ON u.id = tp.user_id
     WHERE ${where}
     GROUP BY
       u.id, u.name, u.email, u.password_hash, u.phone, u.avatar_url,
       u.joined_at, u.department, u.account_status,
       sp.grade_level, sp.learning_focus,
       tp.subject_summary, tp.qualification, tp.experience_text,
       tp.hourly_rate, tp.rating, tp.reviews_count, tp.education_level,
       tp.verified, tp.location, tp.tagline, tp.bio, tp.teaching_method`,
    [idOrEmail]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const primaryRole =
    Array.isArray(row.roles) && row.roles.length > 0 ? row.roles[0] : "student";

  return {
    ...row,
    role: primaryRole,
    hourlyRate: row.hourlyRate ? Number(row.hourlyRate) : 25,
    rating: row.rating ? Number(row.rating) : null,
    reviewsCount: Number(row.reviewsCount || 0),
  };
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  getUserWithRoles,
};
