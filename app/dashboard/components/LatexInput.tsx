"use client";

import React from "react";

interface LatexInputProps {
  latexInput: string;
  setLatexInput: (value: string) => void;
}

function LatexInput({ latexInput, setLatexInput }: LatexInputProps) {
  return (
    <div className="w-full">
      <textarea
        value={latexInput}
        onChange={(e) => setLatexInput(e.target.value)}
        className="w-full min-h-[400px] p-4 rounded-xl border-2 border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-transparent transition-all duration-200 font-mono text-sm"
        placeholder="Enter your LaTeX resume template here..."
        style={{
          backdropFilter: "blur(10px)",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      />
    </div>
  );
}

export default React.memo(LatexInput);
