import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: JSON.parse(process.env.GCP_CREDENTIALS_JSON || "{}"),
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

  await file.save(fileBuffer, {
    metadata: { contentType: "application/x-latex" },
    resumable: false,
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}
