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

  try {
    const { rows: userRows } = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [session.user.email]
    );

    if (userRows.length === 0) {
      return new Response("User not found", { status: 404 });
    }

    const userId = userRows[0].id;

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

export async function DELETE(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return new Response("Missing ID for deletion", { status: 400 });
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
      `DELETE FROM resume_db WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return new Response("Record not found or unauthorized", { status: 404 });
    }

    return new Response("Record deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Database delete error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
