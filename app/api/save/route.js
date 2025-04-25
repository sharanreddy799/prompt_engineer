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
    CREATE TABLE IF NOT EXISTS job_hunt (
      job_description TEXT NOT NULL,
      company TEXT NOT NULL,
      latex_output TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (job_description, company)
    )
  `);
}

export async function POST(req) {
  try {
    const { jobDescription, company, latexOutput } = await req.json();

    if (!jobDescription || !company || !latexOutput) {
      return NextResponse.json(
        { error: "Missing job description, company, or LaTeX output" },
        { status: 400 }
      );
    }

    await ensureTableExists();

    await pool.query(
      `INSERT INTO job_hunt (job_description, company, latex_output)
       VALUES ($1, $2, $3)
       ON CONFLICT (job_description, company)
       DO UPDATE SET latex_output = EXCLUDED.latex_output,
                     created_at = CURRENT_TIMESTAMP`,
      [jobDescription, company, latexOutput]
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
