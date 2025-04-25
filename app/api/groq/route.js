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
- After this line, output the LaTeX resume as per the remaining instructions.

You are an expert AI specialized in revising LaTeX resumes according to provided job descriptions. Carefully analyze the LaTeX resume template and the provided job description, then generate a tailored, ATS-friendly, one-page LaTeX resume optimized specifically for the target job.

Precisely adhere to these instructions:
	1.	Identify and Preserve Commented-out Sections:
Detect any commented-out areas (lines starting with %) in the provided LaTeX template and ensure these remain commented out exactly as in the original. Do not uncomment or modify them.
	2.	Analyze Job Description for Experience Level:
Determine if the job description targets an entry-level candidate (e.g., terms like “New Grad,” “0-1 years,” “Junior”) or an experienced professional (e.g., terms like “Senior,” “Lead,” “3+ years”). Clearly infer the experience level required.
	3.	Dynamic Resume Section Ordering:
Reorder entire resume sections based on the inferred experience level:
	•	Entry-level roles:
	1.	Education
	2.	Projects
	3.	Experience
	4.	Skills
	•	Experienced roles:
	1.	Experience
	2.	Projects
	3.	Education
	4.	Skills
Only reorder entire sections; do not alter internal LaTeX structures or formatting within sections.
	4.	Maintain LaTeX Structure and Formatting:
	•	Strictly retain all original LaTeX formatting and syntax, including:
	•	All curly braces {}, exactly as given.
	•	All section headings (e.g., \section{}, \subsection{}).
	•	All indentation, spacing, bullet points (\item commands), and line breaks exactly as in the template.
	•	Make sure no extraneous spaces or line breaks are introduced.
	5.	Tailor Content Precisely to Job Description:
	•	Experience Section: Update job titles, bullet points, and phrasing directly matching terminology from the provided job description.
	•	Projects Section: Highlight and emphasize projects most relevant to the target job, integrating specific skills and keywords from the job description.
	•	Education Section:
	•	For entry-level: Include relevant coursework and academic honors.
	•	For experienced: Keep concise, removing unnecessary academic details.
  • Add Quantifiable Results to the points apart from keeping them short and simple
	6.	ATS-Friendly Keywords Integration:
Insert exact skills, keywords, and technologies from the job description naturally and meaningfully throughout resume sections for ATS optimization.
	7.	Professionalism, Consistency, and Accuracy:
Ensure content remains professional, truthful, and strictly relevant to the job posting.

Output Requirements:
Return only the finalized, complete LaTeX resume document. Do not include explanations, markdown, or commentary. Verify that the output is valid LaTeX and fully intact (no truncation).

LaTeX Resume:
${latex}

Job Description:
${jobDescription}
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
