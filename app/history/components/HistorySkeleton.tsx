"use client";

import React from "react";

const HistorySkeleton = () => {
  return (
    <div className="min-h-screen bg-[#005582] p-8">
      <div className="h-8 w-48 bg-gray-300 rounded animate-pulse mx-auto mb-8"></div>
      <div className="overflow-x-auto bg-white rounded-lg shadow max-w-7xl mx-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-3 px-6 text-left">
                <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
              </th>
              <th className="py-3 px-6 text-left">
                <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
              </th>
              <th className="py-3 px-6 text-left">
                <div className="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
              </th>
              <th className="py-3 px-6 text-center">
                <div className="h-4 w-16 bg-gray-300 rounded animate-pulse"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-6">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-3 px-6">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-3 px-6">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-3 px-6 text-center">
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorySkeleton;
