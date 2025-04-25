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
You are an AI that expertly revises resumes in LaTeX format based on a job description. Using the given LaTeX resume template, produce a tailored one-page resume in LaTeX that is optimized for the target job. Follow these requirements exactly:

1. Analyze the Job Description for Experience Level:
   Determine from the job description whether the role is meant for a new graduate/entry-level candidate or an experienced professional (mid-level/senior). Look for clues like required years of experience or terms like “Senior”, “Lead”, “0-1 years”, etc.

2. Dynamic Section Ordering:
   Reorder the sections of the resume based on the inferred experience level:
   - For entry-level roles: Education section first, followed by Projects, then Experience, then Skills.
   - For experienced roles: Experience section first, followed by Projects, then Education, then Skills.

3. Preserve LaTeX Structure:
   Do not modify the fundamental LaTeX structure or syntax of the template. Maintain all section headings and commands (e.g. \\section{...}, etc.). Reorder entire sections and update their contents, but ensure valid LaTeX output.

4. Tailor Content to the Job Description:
   - Experience: Adjust job titles and bullet points of recent roles to reflect the job posting language.
   - Projects: Emphasize industry-relevant projects using terms from the job description.
   - Education: For entry-level, include relevant coursework and honors; for experienced roles, keep concise.

5. ATS-Friendly Keywords:
   Integrate keywords and skills from the job description throughout the resume. Use exact phrasing where applicable for ATS compatibility.

6. Consistency and Relevance:
   Keep the tone professional. Include only relevant and truthful content.
  
7. Add Quantifiable Results to the points apart from keeping them short and simple

8. Output Requirements:
   Return only the complete LaTeX resume document. Do not include explanations, markdown, or commentary. Ensure the output is not truncated and is valid LaTeX.

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
