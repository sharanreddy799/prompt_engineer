import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import axios from "axios";

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return new Response("Missing file URL", { status: 400 });
    }

    // Fetch the file from Google Cloud Storage
    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
      headers: {
        Accept: "application/x-latex",
      },
    });

    // Return the file with appropriate headers
    return new Response(response.data, {
      headers: {
        "Content-Type": "application/x-latex",
        "Content-Disposition": "attachment",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return new Response("Failed to download file", { status: 500 });
  }
}
