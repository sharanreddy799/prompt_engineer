import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

// Initialize the connection pool using environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Create the table if it does not exist
async function ensureTableExists() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS resume_db (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
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
    const { company, role, latexOutput } = await req.json();

    if (!company || !role || !latexOutput) {
      return NextResponse.json(
        { error: "Missing company, role, or LaTeX output" },
        { status: 400 }
      );
    }

    await ensureTableExists();

    // For now, hardcoding user_id as "test-user"
    await pool.query(
      `INSERT INTO resume_db (user_id, company, role, latex_output, latex_file_url)
       VALUES ($1, $2, $3, $4, NULL)`,
      ["test-user", company, role, latexOutput]
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
