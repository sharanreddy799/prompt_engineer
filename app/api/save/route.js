import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

// Initialize the connection pool using environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon.tech SSL
  },
});

// Create the table if it does not exist
async function ensureTableExists() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_resumes (
      id SERIAL PRIMARY KEY,
      job_description TEXT NOT NULL,
      latex_output TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function POST(req) {
  try {
    const { jobDescription, latexOutput } = await req.json();

    if (!jobDescription || !latexOutput) {
      return NextResponse.json(
        { error: "Missing job description or LaTeX output" },
        { status: 400 }
      );
    }

    await ensureTableExists();

    await pool.query(
      "INSERT INTO saved_resumes (job_description, latex_output) VALUES ($1, $2)",
      [jobDescription, latexOutput]
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
