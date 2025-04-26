import { Groq } from "groq-sdk";

export async function POST(req) {
  const { latex, jobDescription } = await req.json();

  if (!latex || !jobDescription) {
    return new Response(
      JSON.stringify({ error: "Missing LaTeX or job description" }),
      {
        status: 400,
      }
    );
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const completion = await groq.chat.completions.create({
      model: "deepseek-r1-distill-llama-70b",
      messages: [
        {
          role: "user",
          content: `
First Line Output Requirement:
- Before generating the LaTeX resume, output a single line containing only the extracted Company Name and Role Title based on the provided Job Description.
- Format: Company: [Company Name], Role: [Role Title]
- After this line, output the LaTeX resume as per the following strict instructions.

You are an expert AI specializing in revising LaTeX resumes based on provided job descriptions. Carefully analyze the LaTeX resume template and the provided job description, then generate a tailored, ATS-optimized one-page LaTeX resume for the target role.

Precisely follow these rules:
1. Identify and Preserve Commented-out Sections:
   - Detect any LaTeX comments (lines starting with %) and retain them exactly.

2. Analyze Job Description for Experience Level:
   - Determine if the role targets an entry-level or experienced candidate based on required years or seniority terms.

3. Dynamic Resume Section Ordering:
   - Entry-level roles: Education → Experience → Projects → Skills
   - Experienced roles: Experience → Projects → Education → Skills

4. Maintain Strict LaTeX Structure:
   - Preserve all LaTeX commands (\\section{}, \\subsection{}, \\item, etc.).
   - Preserve original indentation, line breaks, and format.

5. Tailor Content Precisely to Job Description:
   - Update Experience and Project sections to match job description language.
   - **Every bullet point must include a strong, measurable, quantifiable result** (e.g., 25% efficiency gain, $10K cost saving, 30% onboarding time reduction).
   - Each bullet must clearly follow the Accomplishment → Action → Quantified Result format.
   - If no specific number is naturally available, reasonably estimate a realistic figure based on industry standards (e.g., 15%, 25%, $5K). No bullet point should omit a measurable result under any circumstances.
   - If a bullet point describes improvements like "enhanced", "improved", or "optimized" without an obvious metric, assume and insert a reasonable estimated percentage (e.g., 15%–30%) reflecting typical industry improvements.
   - Highlight technologies and skills mentioned in the job description seamlessly.
- Tailor the Technical Skills section to include only the skills, technologies, and tools that are either:
   - Explicitly mentioned in the job description, or
   - Clearly implied by the job responsibilities.
- Remove unrelated or extra skills that are not relevant to the specific job posting.

6. ATS-Friendly Optimization:
   - Embed keywords and skills from the job description meaningfully into each section.

7. Professionalism, Consistency, and Accuracy:
   - Keep the resume concise, professional, and highly relevant to the target job.

Output Requirements:
- Output only the LaTeX resume document after the first Company/Role line.
- No additional explanation, markdown, or commentary.
- Ensure the LaTeX is complete and valid without truncation.

LaTeX Resume:
${latex}

Job Description:
${jobDescription}

Continue generating until the full LaTeX document is complete.
`,
        },
      ],
      temperature: 1,
      max_completion_tokens: 40096,
      top_p: 1,
      stream: true,
      stop: null,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(new TextEncoder().encode(content));
        }
        controller.close();
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
