import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.email; // always use email for matching

  try {
    const { rows } = await pool.query(
      `SELECT id, company, role, latex_output, latex_file_url, created_at FROM resume_db WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return Response.json(rows);
  } catch (error) {
    console.error("Database fetch error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
