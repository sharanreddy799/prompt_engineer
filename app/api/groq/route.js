import { Groq } from "groq-sdk";

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

export async function POST(req) {
  const { latex, jobDescription } = await req.json();

  // Validate inputs
  const latexValidation = validateLatex(latex);
  if (!latexValidation.isValid) {
    return new Response(JSON.stringify({ error: latexValidation.error }), {
      status: 400,
    });
  }

  const jobDescriptionValidation = validateJobDescription(jobDescription);
  if (!jobDescriptionValidation.isValid) {
    return new Response(
      JSON.stringify({ error: jobDescriptionValidation.error }),
      { status: 400 }
    );
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const completion = await groq.chat.completions.create({
      model: "deepseek-r1-distill-llama-70b",
      messages: [
        {
          role: "system",
          content: `You are an expert AI specializing in revising LaTeX resumes based on job descriptions. Your task is to analyze the provided LaTeX resume template and job description, then generate a tailored, ATS-optimized one-page LaTeX resume.

CRITICAL OUTPUT FORMAT:
1. Your FIRST LINE must EXACTLY match this format:
   "Company: [EXACT_COMPANY_NAME], Role: [EXACT_ROLE_TITLE]"
   - No additional text before or after this line
   - No quotes around the values
   - No extra spaces or special characters
   - Company and Role must be exact matches from the job description

2. After the first line, output the complete LaTeX resume
   - No additional text or explanations
   - Start with the LaTeX document immediately

Key Responsibilities:
1. Extract and output the company name and role title from the job description
2. Generate a complete, valid LaTeX resume following all specified rules
3. Ensure all content is relevant and optimized for the target role

Strict Rules to Follow:
1. Output Format:
   - First line: "Company: [Company Name], Role: [Role Title]"
   - Followed by complete LaTeX resume
   - No additional text or explanations

2. LaTeX Structure:
   - Preserve ALL LaTeX commands, environments, and formatting
   - Maintain exact indentation and line breaks
   - Keep all commented sections (lines starting with %)
   - Ensure document is complete and valid

3. Content Organization:
   - Entry-level roles: Education → Experience → Projects → Skills
   - Experienced roles: Experience → Projects → Education → Skills
   - Each section must be properly formatted with LaTeX commands

4. Experience and Projects:
   - Every bullet point MUST follow: "Accomplishment → Action → Quantified Result"
   - REQUIRED metrics for each bullet point:
     * If specific number exists: Use exact number
     * If improvement mentioned: Add 15-30% metric
     * If no metric: Add reasonable industry-standard metric
   - NO bullet points without metrics allowed
   - Use strong action verbs and job-specific terminology

5. Skills Section:
   - Include ONLY skills mentioned in job description
   - Include skills implied by job responsibilities
   - Remove irrelevant skills
   - Format as bullet points or comma-separated list

6. ATS Optimization:
   - Use exact keywords from job description
   - Maintain natural language flow
   - Avoid keyword stuffing
   - Ensure readability

7. Quality Checks:
   - Verify all LaTeX commands are valid
   - Check for proper section ordering
   - Ensure all bullet points have metrics
   - Confirm skills match job requirements
   - Validate document completeness

Remember:
- Output ONLY the first line and LaTeX content
- No explanations or markdown
- Ensure complete document generation
- Follow ALL rules strictly`,
        },
        {
          role: "user",
          content: `LaTeX Resume Template:
${latex}

Job Description:
${jobDescription}

Generate a complete, tailored LaTeX resume following all rules. Remember to start with the exact format: "Company: [Company Name], Role: [Role Title]"`,
        },
      ],
      temperature: 0.7,
      max_completion_tokens: 40096,
      top_p: 1,
      stream: true,
      stop: null,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        let buffer = "";
        try {
          for await (const chunk of completion) {
            const contentPart = chunk.choices[0]?.delta?.content || "";
            buffer += contentPart;

            // Stream data to client
            controller.enqueue(new TextEncoder().encode(contentPart));
          }
        } catch (streamError) {
          console.error("Stream reading error:", streamError);
          controller.error(streamError);
        } finally {
          // Final flushing if any buffer left (precautionary)
          if (buffer.length > 0) {
            controller.enqueue(new TextEncoder().encode(buffer));
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Groq API error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
