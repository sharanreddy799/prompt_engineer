"use client";
import React from "react";
interface OutputAreaProps {
  output: string;
  setOutput: (value: string) => void;
  handleCopyOutput: () => void;
}

function OutputArea({ output, setOutput, handleCopyOutput }: OutputAreaProps) {
  return (
    <div className="w-full flex flex-col items-center">
      <textarea
        value={output}
        onChange={(e) => setOutput(e.target.value)}
        className="w-3/5 min-h-[600px] p-4 rounded-md border-2 border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
        placeholder="Generated LaTeX output will appear here..."
      />
      <button
        onClick={handleCopyOutput}
        className="mt-4 px-6 py-2 bg-purple-600 rounded-md hover:bg-purple-700 text-white transition"
      >
        Copy Output
      </button>
    </div>
  );
}
export default React.memo(OutputArea);
