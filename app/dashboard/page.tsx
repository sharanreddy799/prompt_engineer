"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

import Header from "./components/Header";
import LatexInput from "./components/LatexInput";
import JobDescriptionInput from "./components/JobDescriptionInput";
import ActionButtons from "./components/ActionButtons";
import OutputArea from "./components/OutputArea";
import Footer from "./components/Footer";

export default function DashboardPage() {
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

    // Validate inputs before making the request
    if (!latexInput.trim()) {
      setOutput("Error: Please enter a LaTeX template");
      setLoading(false);
      return;
    }

    if (!jobDescriptionInput.trim()) {
      setOutput("Error: Please enter a job description");
      setLoading(false);
      return;
    }

    try {
      console.log("Sending request to Groq API...");
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latex: latexInput,
          jobDescription: jobDescriptionInput,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.message || "Failed to generate output");
      }

      if (!res.body) {
        throw new Error("Streaming not supported");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let buffer = "";
      let inThinkBlock = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        console.log("Received chunk:", buffer);

        // Process the buffer line by line
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          const trimmedLine = line.trim();

          // Skip think blocks
          if (trimmedLine.includes("<think>")) {
            inThinkBlock = true;
            continue;
          }
          if (trimmedLine.includes("</think>")) {
            inThinkBlock = false;
            continue;
          }
          if (inThinkBlock) {
            continue;
          }

          // Skip empty lines
          if (trimmedLine) {
            result += line + "\n";
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const trimmedBuffer = buffer.trim();
        if (
          !trimmedBuffer.includes("<think>") &&
          !trimmedBuffer.includes("</think>")
        ) {
          result += buffer;
        }
      }

      // Clean up the result
      result = result.trim();
      console.log("Final result:", result);

      if (!result) {
        throw new Error("No output received from the API");
      }

      // Split into lines and process
      const lines = result.split("\n");

      // Find the first line that contains company and role
      let company = "";
      let role = "";
      let latexContent = "";
      let foundCompanyRole = false;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!foundCompanyRole) {
          const companyRolePattern = /^Company:\s*([^,]+),\s*Role:\s*(.+)$/i;
          const match = trimmedLine.match(companyRolePattern);
          if (match && match[1] && match[2]) {
            company = match[1].trim();
            role = match[2].trim();
            foundCompanyRole = true;
            continue; // Skip this line in the LaTeX output
          }
        }
        // Skip empty lines
        if (trimmedLine) {
          latexContent += line + "\n";
        }
      }

      // Clean up the LaTeX content
      latexContent = latexContent.trim();

      if (company && role) {
        setOutput(latexContent);
        setCompany(company);
        setRole(role);
      } else {
        // If we couldn't extract company/role, just use the cleaned output
        console.log("Could not extract company and role, using cleaned output");
        setOutput(latexContent);
      }
    } catch (error) {
      console.error("Error generating output:", error);
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
    if (
      !output.trim() ||
      !company ||
      !role ||
      !session?.user?.email ||
      !session?.user?.name
    ) {
      alert(
        "Missing company, role, output, or user session details. Cannot save to database."
      );
      return;
    }
    try {
      await axios.post("/api/save", {
        userEmail: session.user.email,
        userName: session.user.name,
        company: company,
        role: role,
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
    <div className="min-h-screen bg-gradient-to-br from-[#005582] to-[#003d5f]">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* LaTeX Input Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-wide">
              LaTeX Template
            </h2>
            <div className="relative">
              <LatexInput
                latexInput={latexInput}
                setLatexInput={setLatexInput}
              />
              <div className="absolute top-2 right-2 text-white/60 text-sm">
                {latexInput.length} characters
              </div>
            </div>
          </div>

          {/* Job Description Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-wide">
              Job Description
            </h2>
            <div className="relative">
              <JobDescriptionInput
                jobDescription={jobDescriptionInput}
                setJobDescription={setJobDescriptionInput}
              />
              <div className="absolute top-2 right-2 text-white/60 text-sm">
                {jobDescriptionInput.length} characters
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={generateOutput}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-[#009688] to-[#00796b] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              "Generate Resume"
            )}
          </button>
          <button
            onClick={handleSaveToDb}
            className="px-8 py-3 bg-gradient-to-r from-[#2196f3] to-[#1976d2] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Save to History
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-wide">
              Generated LaTeX
            </h2>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              Copy
            </button>
          </div>
          <OutputArea
            output={output}
            setOutput={setOutput}
            handleCopyOutput={copyToClipboard}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}

// "use client";

// import { useState } from "react";
// import axios from "axios";
// import { useSession, signOut } from "next-auth/react";

// export default function Home() {
//   const { data: session } = useSession();
//   const [latexInput, setLatexInput] = useState("");
//   const [jobDescriptionInput, setJobDescriptionInput] = useState("");
//   const [output, setOutput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [company, setCompany] = useState("");
//   const [role, setRole] = useState("");

//   const generateOutput = async () => {
//     setLoading(true);
//     setOutput("");

//     try {
//       const res = await fetch("/api/groq", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           latex: latexInput,
//           jobDescription: jobDescriptionInput,
//         }),
//       });

//       if (!res.body) {
//         throw new Error("Streaming not supported");
//       }

//       const reader = res.body.getReader();
//       const decoder = new TextDecoder();
//       let result = "";
//       let buffer = "";

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         buffer += decoder.decode(value, { stream: true });

//         buffer = buffer.replace(/<think>[\s\S]*?<\/think>/gi, (match) => {
//           console.log("Filtered Explanation:", match);
//           return "";
//         });

//         const lastOpenIndex = buffer.lastIndexOf("<think>");
//         const lastCloseIndex = buffer.lastIndexOf("</think>");

//         if (lastOpenIndex > lastCloseIndex) {
//           result += buffer.slice(0, lastOpenIndex);
//           buffer = buffer.slice(lastOpenIndex);
//         } else {
//           result += buffer;
//           buffer = "";
//         }
//       }

//       result = result.replace(/^```latex\s*|```$/gim, "").trim();

//       // Split result into first line and the rest
//       const [firstLineRaw, ...latexLines] = result.split("\n");
//       const firstLine = firstLineRaw.trim();

//       // Extract company and role from the trimmed first line
//       const match = firstLine.match(/Company:\s*(.*?),\s*Role:\s*(.*)/);
//       const company = match ? match[1].trim() : "";
//       const role = match ? match[2].trim() : "";

//       if (company && role) {
//         // Remove first line (containing company/role) from LaTeX output, trim rest
//         const latexContent = latexLines.join("\n").trim();
//         setOutput(latexContent);
//         setCompany(company);
//         setRole(role);
//       } else {
//         console.error("Could not extract company and role properly!");
//         setOutput(
//           "Error: Failed to extract company and role. Check input format."
//         );
//       }
//     } catch (error) {
//       if (error instanceof Error) {
//         setOutput(`Error: ${error.message}`);
//       } else {
//         setOutput("An unknown error occurred.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSaveToDb = async () => {
//     if (!output.trim() || !company || !role || !session?.user?.email) {
//       alert(
//         "Missing company, role, output, or user session. Cannot save to database."
//       );
//       return;
//     }
//     try {
//       await axios.post("/api/save", {
//         userId: session.user.email, // Send the logged-in user's email
//         company: company,
//         role: role,
//         latexOutput: output,
//       });
//       alert("Saved to database successfully!");
//     } catch (error) {
//       console.error("Failed to save to database:", error);
//       alert("Error saving to database.");
//     }
//   };

//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(output);
//     alert("Output copied to clipboard!");
//   };

//   return (
//     <div className="flex flex-col gap-8 min-h-screen bg-[#005582]">
//       {/* Top Bar with Heading and Profile */}
//       <div className="flex items-center justify-between p-6">
//         <h1 className="flex-grow text-3xl font-extrabold text-white text-center">
//           Agentic Prompt Producer
//         </h1>
//         <div className="flex items-center space-x-4">
//           <span className="text-white font-semibold">
//             {session?.user?.name || "Guest"}
//           </span>
//           <button
//             onClick={() => (window.location.href = "/history")}
//             className="bg-white text-[#005582] px-4 py-2 rounded-md font-semibold hover:bg-gray-100 shadow"
//           >
//             History
//           </button>
//           <button
//             onClick={() => signOut({ callbackUrl: "/auth" })}
//             className="bg-white text-[#005582] px-4 py-2 rounded-md font-semibold hover:bg-gray-100 shadow"
//           >
//             Sign Out
//           </button>
//         </div>
//       </div>

//       <div className="flex flex-col gap-4 h-full">
//         {/* Side-by-side textareas */}
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex flex-col w-full md:w-1/2 px-8">
//             <p className="text-2xl font-bold text-white mb-4 text-center tracking-wide">
//               Latex Format
//             </p>
//             <div className="p-2">
//               <textarea
//                 className="w-full h-108 p-[5px] border border-gray-300 rounded-md resize-none bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-[#009688] text-center placeholder:text-center"
//                 placeholder="Enter Your Resume Latex Template"
//                 value={latexInput}
//                 onChange={(e) => setLatexInput(e.target.value)}
//               />
//             </div>
//           </div>

//           <div className="flex flex-col w-full md:w-1/2 px-8">
//             <p className="text-2xl font-bold text-white mb-4 text-center tracking-wide">
//               Job Description
//             </p>
//             <div className="p-2">
//               <textarea
//                 className="w-full h-108 p-[5px] border border-gray-300 rounded-md resize-none bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-[#009688] text-center placeholder:text-center"
//                 placeholder="Enter Your job description and ensure it has company and role"
//                 value={jobDescriptionInput}
//                 onChange={(e) => setJobDescriptionInput(e.target.value)}
//               />
//             </div>
//           </div>
//         </div>
//         {/* Side-by-side action buttons */}
//         <div className="flex justify-center gap-6 px-8 pb-2">
//           <button
//             onClick={handleSaveToDb}
//             className="w-1/2 bg-black text-white py-3 rounded-md hover:bg-gray-800 transition font-semibold shadow"
//           >
//             Save to Database
//           </button>
//           <button
//             onClick={generateOutput}
//             className="w-1/2 bg-[#009688] text-white py-3 rounded-md hover:bg-[#00695c] transition font-semibold shadow"
//           >
//             Generate Output
//           </button>
//         </div>
//       </div>

//       <div className="flex flex-col gap-1 px-8">
//         <p className="text-2xl font-bold text-white mb-4 text-center tracking-wide">
//           Generated Latex
//         </p>
//         {loading && (
//           <div className="text-white text-center font-semibold">
//             Generating...
//           </div>
//         )}
//         <div className="p-6">
//           <textarea
//             id="GeneratedOutput"
//             className="w-full h-128 p-[38px] border border-gray-300 rounded-md resize-none bg-white shadow-md text-gray-700"
//             readOnly
//             rows={6}
//             value={output}
//             style={{
//               fontSize: "1rem",
//               backgroundColor: "#f3f3f3",
//             }}
//           />
//         </div>

//         <div className="flex justify-center mt-4 mb-10">
//           <button
//             onClick={copyToClipboard}
//             className="px-6 py-3 bg-[#009688] text-white rounded-md hover:bg-[#00695c] transition font-semibold shadow"
//           >
//             Copy Output
//           </button>
//         </div>
//       </div>
//       <footer className="w-full text-center text-white text-sm py-4 bg-[#004d40]">
//         © 2025 Agentic Prompt Producer. All rights reserved.
//       </footer>
//     </div>
//   );
// }
