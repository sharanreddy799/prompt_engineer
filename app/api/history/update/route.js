import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function PUT(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { id, company, role } = await req.json();

    if (!id || !company || !role) {
      return new Response("Missing required fields", { status: 400 });
    }

    const { rows: userRows } = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [session.user.email]
    );

    if (userRows.length === 0) {
      return new Response("User not found", { status: 404 });
    }

    const userId = userRows[0].id;

    const result = await pool.query(
      `UPDATE resume_db 
       SET company = $1, role = $2 
       WHERE id = $3 AND user_id = $4 
       RETURNING *`,
      [company, role, id, userId]
    );

    if (result.rowCount === 0) {
      return new Response("Record not found or unauthorized", { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    console.error("Database update error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
