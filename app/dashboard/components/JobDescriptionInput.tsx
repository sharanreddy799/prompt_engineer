"use client";

import React from "react";
interface JobDescriptionInputProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
}

function JobDescriptionInput({
  jobDescription,
  setJobDescription,
}: JobDescriptionInputProps) {
  return (
    <div className="w-full flex justify-center">
      <textarea
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        className="w-4/5 min-h-[600px] p-4 rounded-md border-2 border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Enter your job description here..."
      />
    </div>
  );
}

export default React.memo(JobDescriptionInput);
