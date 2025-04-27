import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

// Initialize the connection pool using environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Create the tables if they do not exist
async function ensureTablesExist() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS resume_db (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      latex_output TEXT NOT NULL,
      latex_file_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Received body at /api/save:", body);

    const { company, role, latexOutput, userEmail, userName } = body;

    if (!company || !role || !latexOutput || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await ensureTablesExist();

    // Insert user if not exists (without image)
    await pool.query(
      `INSERT INTO users (email, name)
       VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING`,
      [userEmail, userName]
    );

    // Fetch user ID
    const { rows } = await pool.query(`SELECT id FROM users WHERE email = $1`, [
      userEmail,
    ]);

    const userId = rows[0]?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID fetch failed" },
        { status: 500 }
      );
    }

    // Save resume linked to user ID
    await pool.query(
      `INSERT INTO resume_db (user_id, company, role, latex_output, latex_file_url)
       VALUES ($1, $2, $3, $4, NULL)`,
      [userId, company, role, latexOutput]
    );

    return NextResponse.json({ message: "Saved successfully" });
  } catch (error) {
    console.error("Database save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
