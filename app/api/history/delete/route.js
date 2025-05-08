import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { Pool } from "pg";
import { Storage } from "@google-cloud/storage";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Fix escaped newlines
  },
});

const bucketName = process.env.GCP_BUCKET_NAME || "";

export async function DELETE(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return new Response("Missing record ID", { status: 400 });
    }

    const { rows: userRows } = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [session.user.email]
    );

    if (userRows.length === 0) {
      return new Response("User not found", { status: 404 });
    }

    const userId = userRows[0].id;

    // Get the record details before deleting
    const { rows: recordRows } = await pool.query(
      `SELECT * FROM resume_db WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (recordRows.length === 0) {
      return new Response("Record not found or unauthorized", { status: 404 });
    }

    const record = recordRows[0];

    // Delete files from Google Storage
    if (record.latex_file_url) {
      try {
        // Extract the file path from the URL
        const filePath = record.latex_file_url.split(`${bucketName}/`)[1];
        if (filePath) {
          const bucket = storage.bucket(bucketName);
          const file = bucket.file(filePath);
          await file.delete();
          console.log(
            `✅ Successfully deleted LaTeX file from GCS: ${filePath}`
          );
        }
      } catch (error) {
        console.error("❌ GCS Delete Failed:", error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete the record from the database
    await pool.query(`DELETE FROM resume_db WHERE id = $1 AND user_id = $2`, [
      id,
      userId,
    ]);

    return new Response("Record deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Delete error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
