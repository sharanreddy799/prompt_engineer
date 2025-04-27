"use client";

import React from "react";

interface ActionButtonsProps {
  handleGenerateOutput: () => void;
  handleSaveToDb: () => void;
}

function ActionButtons({
  handleGenerateOutput,
  handleSaveToDb,
}: ActionButtonsProps) {
  return (
    <div className="flex justify-center gap-6 my-6">
      <button
        onClick={handleGenerateOutput}
        className="px-6 py-2 bg-blue-600 rounded-md hover:bg-blue-700 text-white transition"
      >
        Generate Output
      </button>
      <button
        onClick={handleSaveToDb}
        className="px-6 py-2 bg-green-600 rounded-md hover:bg-green-700 text-white transition"
      >
        Save to Database
      </button>
    </div>
  );
}

export default React.memo(ActionButtons);
