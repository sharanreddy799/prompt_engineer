"use client";
import React from "react";
interface OutputAreaProps {
  output: string;
  setOutput: (value: string) => void;
  handleCopyOutput: () => void;
}

function OutputArea({ output, setOutput, handleCopyOutput }: OutputAreaProps) {
  return (
    <div className="w-full">
      <textarea
        value={output}
        onChange={(e) => setOutput(e.target.value)}
        className="w-full min-h-[400px] p-4 rounded-xl border-2 border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-transparent transition-all duration-200 font-mono text-sm"
        placeholder="Generated LaTeX output will appear here..."
        style={{
          backdropFilter: "blur(10px)",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      />
    </div>
  );
}
export default React.memo(OutputArea);
