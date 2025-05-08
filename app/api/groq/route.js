import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

// Validation functions
function validateJobDescription(jobDescription) {
  if (!jobDescription || typeof jobDescription !== "string") {
    return {
      isValid: false,
      error: "Job description must be a non-empty string",
    };
  }

  const minLength = 50;
  const maxLength = 10000;

  if (jobDescription.length < minLength) {
    return {
      isValid: false,
      error: `Job description must be at least ${minLength} characters long`,
    };
  }

  if (jobDescription.length > maxLength) {
    return {
      isValid: false,
      error: `Job description must not exceed ${maxLength} characters`,
    };
  }

  // Check for basic job description structure
  const requiredElements = [
    "responsibilities",
    "requirements",
    "qualifications",
    "skills",
    "experience",
  ];

  const hasRequiredElements = requiredElements.some((element) =>
    jobDescription.toLowerCase().includes(element)
  );

  if (!hasRequiredElements) {
    return {
      isValid: false,
      error:
        "Job description should include at least one of: responsibilities, requirements, qualifications, skills, or experience",
    };
  }

  return { isValid: true };
}

function validateLatex(latex) {
  if (!latex || typeof latex !== "string") {
    return {
      isValid: false,
      error: "LaTeX content must be a non-empty string",
    };
  }

  const minLength = 100;
  const maxLength = 50000;

  if (latex.length < minLength) {
    return {
      isValid: false,
      error: `LaTeX content must be at least ${minLength} characters long`,
    };
  }

  if (latex.length > maxLength) {
    return {
      isValid: false,
      error: `LaTeX content must not exceed ${maxLength} characters`,
    };
  }

  // Check for essential LaTeX document structure
  const requiredElements = [
    "\\documentclass",
    "\\begin{document}",
    "\\end{document}",
  ];

  for (const element of requiredElements) {
    if (!latex.includes(element)) {
      return {
        isValid: false,
        error: `LaTeX content is missing required element: ${element}`,
      };
    }
  }

  // Check for common LaTeX resume sections
  const commonSections = ["\\section", "\\subsection", "\\item"];

  const hasSections = commonSections.some((section) => latex.includes(section));
  if (!hasSections) {
    return {
      isValid: false,
      error:
        "LaTeX content should include at least one section, subsection, or item",
    };
  }

  // Check for balanced LaTeX environments
  const environments = ["document", "itemize", "enumerate", "tabular"];
  for (const env of environments) {
    const beginCount = (latex.match(new RegExp(`\\\\begin{${env}}`, "g")) || [])
      .length;
    const endCount = (latex.match(new RegExp(`\\\\end{${env}}`, "g")) || [])
      .length;
    if (beginCount !== endCount) {
      return {
        isValid: false,
        error: `Unbalanced LaTeX environment: ${env}`,
      };
    }
  }

  return { isValid: true };
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
  try {
    // Validate session
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error("Unauthorized: No valid session found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse and validate request body
    let latex, jobDescription;
    try {
      const body = await req.json();
      latex = body.latex;
      jobDescription = body.jobDescription;

      console.log("Received request with:", {
        latexLength: latex?.length,
        jobDescriptionLength: jobDescription?.length,
      });
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new NextResponse("Invalid request body", { status: 400 });
    }

    // Validate required fields
    if (!latex || !jobDescription) {
      console.error("Missing required fields:", {
        latex: !!latex,
        jobDescription: !!jobDescription,
      });
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const prompt = `You are an expert LaTeX resume formatter. Your task is to modify the provided LaTeX resume template to match the job description while maintaining the original structure and formatting.

IMPORTANT RULES:
1. DO NOT duplicate any content
2. DO NOT add any new sections
3. DO NOT modify the LaTeX structure or commands
4. ONLY modify the content within the existing sections
5. Keep all formatting, spacing, and layout exactly as in the template
6. Ensure all metrics and achievements are preserved
7. Maintain the exact same number of bullet points per section
8. Keep all technical skills and their formatting intact
9. DO NOT repeat the LaTeX template
10. DO NOT include any explanations or think tags
11. DO NOT wrap the output in code block markers (no \`\`\`latex or \`\`\`)
12. You may fabricate relevant projects that align with the job requirements

TEMPLATE:
${latex}

JOB DESCRIPTION:
${jobDescription}

TASK:
1. Analyze the job description for key requirements and skills
2. Modify ONLY the content within the existing sections to better match the job
3. Keep all LaTeX commands, structure, and formatting exactly as is
4. Ensure metrics and achievements are preserved and relevant
5. Maintain the exact same number of bullet points
6. Keep all technical skills and their formatting intact
7. Create or modify projects to showcase relevant skills and experience
8. Ensure all fabricated projects are realistic and align with the job requirements

OUTPUT FORMAT:
1. First line must be: "Company: [COMPANY_NAME], Role: [ROLE_NAME]"
2. Then provide the complete LaTeX code with modifications
3. Do not include any explanations or additional text
4. Do not duplicate any content
5. Keep the exact same structure as the template
6. Do not repeat the LaTeX template
7. Do not wrap the output in code block markers

QUALITY CHECKS:
1. Verify no content is duplicated
2. Confirm all LaTeX commands are preserved
3. Ensure metrics and achievements are maintained
4. Check that the number of bullet points matches the template
5. Validate that technical skills formatting is unchanged
6. Ensure the LaTeX template is not repeated
7. Verify no code block markers are present
8. Ensure all projects are relevant to the job requirements`;

    console.log("Sending request to Groq API...");
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert LaTeX resume formatter. Your task is to modify the provided LaTeX resume template to match the job description while maintaining the original structure and formatting. You may fabricate relevant projects that align with the job requirements. Do not duplicate any content, repeat the template, or wrap the output in code block markers.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.7,
      max_tokens: 32768,
      top_p: 1,
      stream: true,
    });

    console.log("Creating response stream...");
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        } catch (streamError) {
          console.error("Streaming error:", streamError);
          controller.error(streamError);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error in Groq API:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        message: error.message,
        type: error.name,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
