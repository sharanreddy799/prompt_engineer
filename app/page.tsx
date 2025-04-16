"use client";

import { useState } from "react";

export default function Home() {
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generateOutput = async () => {
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latex: inputA, jobDescription: inputB }),
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

      result = result.replace(/^```latex\s*|```$/gim, "");

      setOutput(result);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    alert("Output copied to clipboard!");
  };

  return (
    <div className="flex flex-col gap-10 min-h-screen bg-[#005582]">
      <h1
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          fontWeight: 900,
          fontSize: 30,
        }}
      >
        Agentic Prompt Producer
      </h1>

      <div className="flex flex-col gap-4 h-full">
        {/* Side-by-side textareas */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col w-full md:w-1/2">
            <p className="text-lg font-semibold text-accent-100 mb-2 text-center">
              Latex Format
            </p>
            <textarea
              className="w-full h-108 p-4 border border-gray-300 rounded-md resize-none bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-[#009688]"
              placeholder="Enter text A..."
              value={inputA}
              onChange={(e) => setInputA(e.target.value)}
            />
          </div>

          <div className="flex flex-col w-full md:w-1/2">
            <p className="text-lg font-semibold text-accent-100 mb-2 text-center">
              Job Description
            </p>
            <textarea
              className="w-full h-108 p-4 border border-gray-300 rounded-md resize-none bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-[#009688]"
              placeholder="Enter text B..."
              value={inputB}
              onChange={(e) => setInputB(e.target.value)}
            />
          </div>
        </div>
        {/* Full-width button below the two boxes */}
        <button
          onClick={generateOutput}
          className="w-full bg-[#00796b] text-white py-3 rounded-md hover:bg-[#004d40] transition"
        >
          Generate Output
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-lg font-semibold text-accent-100 mb-2 text-center">
          Generated Latex
        </p>
        {loading && (
          <div className="text-white text-center font-semibold">
            Generating...
          </div>
        )}
        <textarea
          id="GeneratedOutput"
          className="w-full h-104 p-4 border border-gray-300 rounded-md resize-none bg-white shadow-md text-gray-700"
          readOnly
          rows={6}
          value={output}
          style={{
            padding: "1rem",
            fontSize: "1rem",
            backgroundColor: "#f3f3f3",
          }}
        />

        <button
          onClick={copyToClipboard}
          className="w-full bg-[#009688] text-white py-3 rounded-md hover:bg-[#00695c] transition font-semibold shadow"
        >
          Copy Output
        </button>
      </div>
    </div>
  );
}
