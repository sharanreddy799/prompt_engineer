"use client";

import React from "react";

const HistorySkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#005582] to-[#003d5f]">
      <div className="container mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse mx-auto mb-8" />
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-white/5 text-white uppercase text-sm leading-normal">
                  <th className="py-4 px-6 text-left">Company</th>
                  <th className="py-4 px-6 text-left">Role</th>
                  <th className="py-4 px-6 text-left">Created At</th>
                  <th className="py-4 px-6 text-center">File</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, index) => (
                  <tr
                    key={index}
                    className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-4 px-6">
                      <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="h-10 w-32 bg-white/10 rounded-lg animate-pulse mx-auto" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center space-x-3">
                        <div className="h-10 w-20 bg-white/10 rounded-lg animate-pulse" />
                        <div className="h-10 w-20 bg-white/10 rounded-lg animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistorySkeleton;
