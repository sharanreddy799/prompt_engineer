"use client";

import { useState } from "react";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [latexInput, setLatexInput] = useState("");
  const [jobDescriptionInput, setJobDescriptionInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const generateOutput = async () => {
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latex: latexInput,
          jobDescription: jobDescriptionInput,
        }),
      });

      if (!res.body) {
        throw new Error("Streaming not supported");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        buffer = buffer.replace(/<think>[\s\S]*?<\/think>/gi, (match) => {
          console.log("Filtered Explanation:", match);
          return "";
        });

        const lastOpenIndex = buffer.lastIndexOf("<think>");
        const lastCloseIndex = buffer.lastIndexOf("</think>");

        if (lastOpenIndex > lastCloseIndex) {
          result += buffer.slice(0, lastOpenIndex);
          buffer = buffer.slice(lastOpenIndex);
        } else {
          result += buffer;
          buffer = "";
        }
      }

      result = result.replace(/^```latex\s*|```$/gim, "").trim();

      // Split result into first line and the rest
      const [firstLineRaw, ...latexLines] = result.split("\n");
      const firstLine = firstLineRaw.trim();

      // Extract company and role from the trimmed first line
      const match = firstLine.match(/Company:\s*(.*?),\s*Role:\s*(.*)/);
      const company = match ? match[1].trim() : "";
      const role = match ? match[2].trim() : "";

      if (company && role) {
        // Remove first line (containing company/role) from LaTeX output, trim rest
        const latexContent = latexLines.join("\n").trim();
        setOutput(latexContent);
        setCompany(company);
        setRole(role);
      } else {
        console.error("Could not extract company and role properly!");
        setOutput(
          "Error: Failed to extract company and role. Check input format."
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        setOutput(`Error: ${error.message}`);
      } else {
        setOutput("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDb = async () => {
    if (!output.trim() || !company || !role) {
      alert("Missing company, role, or output. Cannot save to database.");
      return;
    }
    try {
      await axios.post("/api/save", {
        jobDescription: role,
        company: company,
        latexOutput: output,
      });
      alert("Saved to database successfully!");
    } catch (error) {
      console.error("Failed to save to database:", error);
      alert("Error saving to database.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    alert("Output copied to clipboard!");
  };

  return (
    <div className="flex flex-col gap-8 min-h-screen bg-[#005582]">
      {/* Top Bar with Heading and Profile */}
      <div className="flex items-center justify-between p-6">
        <h1 className="flex-grow text-3xl font-extrabold text-white text-center">
          Agentic Prompt Producer
        </h1>
        <div className="flex items-center space-x-4">
          <span className="text-white font-semibold">
            {session?.user?.name || "Guest"}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="bg-white text-[#005582] px-4 py-2 rounded-md font-semibold hover:bg-gray-100 shadow"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 h-full">
        {/* Side-by-side textareas */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col w-full md:w-1/2 px-8">
            <p className="text-2xl font-bold text-white mb-4 text-center tracking-wide">
              Latex Format
            </p>
            <div className="p-2">
              <textarea
                className="w-full h-108 p-[5px] border border-gray-300 rounded-md resize-none bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-[#009688] text-center placeholder:text-center"
                placeholder="Enter Your Resume Latex Template"
                value={latexInput}
                onChange={(e) => setLatexInput(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col w-full md:w-1/2 px-8">
            <p className="text-2xl font-bold text-white mb-4 text-center tracking-wide">
              Job Description
            </p>
            <div className="p-2">
              <textarea
                className="w-full h-108 p-[5px] border border-gray-300 rounded-md resize-none bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-[#009688] text-center placeholder:text-center"
                placeholder="Enter Your job description and ensure it has company and role"
                value={jobDescriptionInput}
                onChange={(e) => setJobDescriptionInput(e.target.value)}
              />
            </div>
          </div>
        </div>
        {/* Side-by-side action buttons */}
        <div className="flex justify-center gap-6 px-8 pb-2">
          <button
            onClick={handleSaveToDb}
            className="w-1/2 bg-black text-white py-3 rounded-md hover:bg-gray-800 transition font-semibold shadow"
          >
            Save to Database
          </button>
          <button
            onClick={generateOutput}
            className="w-1/2 bg-[#009688] text-white py-3 rounded-md hover:bg-[#00695c] transition font-semibold shadow"
          >
            Generate Output
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-8">
        <p className="text-2xl font-bold text-white mb-4 text-center tracking-wide">
          Generated Latex
        </p>
        {loading && (
          <div className="text-white text-center font-semibold">
            Generating...
          </div>
        )}
        <div className="p-6">
          <textarea
            id="GeneratedOutput"
            className="w-full h-128 p-[38px] border border-gray-300 rounded-md resize-none bg-white shadow-md text-gray-700"
            readOnly
            rows={6}
            value={output}
            style={{
              fontSize: "1rem",
              backgroundColor: "#f3f3f3",
            }}
          />
        </div>

        <div className="flex justify-center mt-4 mb-10">
          <button
            onClick={copyToClipboard}
            className="px-6 py-3 bg-[#009688] text-white rounded-md hover:bg-[#00695c] transition font-semibold shadow"
          >
            Copy Output
          </button>
        </div>
      </div>
      <footer className="w-full text-center text-white text-sm py-4 bg-[#004d40]">
        © 2025 Agentic Prompt Producer. All rights reserved.
      </footer>
    </div>
  );
}
