import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Fix escaped newlines
  },
});

const bucketName = process.env.GCP_BUCKET_NAME || "";

export async function uploadLatexToGCS(
  latexContent: string,
  userId: string
): Promise<string> {
  if (!bucketName) {
    throw new Error("GCP_BUCKET_NAME is not defined in environment variables.");
  }

  const fileBuffer = Buffer.from(latexContent, "utf-8");
  const fileName = `${userId}/${uuidv4()}.tex`;

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  try {
    await file.save(fileBuffer, {
      metadata: { contentType: "application/x-latex" },
      resumable: false,
    });

    // Note: Not making file public due to Uniform Bucket-Level Access enabled on the bucket.

    console.log(`✅ Successfully uploaded LaTeX file to GCS: ${fileName}`);

    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
  } catch (error) {
    console.error("❌ GCS Upload Failed:", error);
    throw new Error("Failed to upload LaTeX file to Google Cloud Storage.");
  }
}
