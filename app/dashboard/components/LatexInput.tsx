"use client";

import React from "react";
interface LatexInputProps {
  latexInput: string;
  setLatexInput: (value: string) => void;
}

function LatexInput({ latexInput, setLatexInput }: LatexInputProps) {
  return (
    <div className="w-full flex justify-center">
      <textarea
        value={latexInput}
        onChange={(e) => setLatexInput(e.target.value)}
        className="w-4/5 min-h-[600px] p-4 rounded-md border-2 border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Enter your LaTeX resume template here..."
      />
    </div>
  );
}
export default React.memo(LatexInput);
