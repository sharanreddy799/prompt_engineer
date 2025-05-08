"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import HistorySkeleton from "./components/HistorySkeleton";

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const cacheRef = useRef(null); // Cache reference

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (cacheRef.current) {
          setHistory(cacheRef.current);
          setIsLoading(false);
          return;
        }
        const response = await axios.get("/api/history");
        setHistory(response.data);
        cacheRef.current = response.data;
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchHistory();
    }
  }, [status]);

  if (status === "loading" || isLoading) {
    return <HistorySkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#005582] p-8">
      <h1 className="text-3xl font-extrabold text-white text-center mb-8">
        Resume History
      </h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow max-w-7xl mx-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Company</th>
              <th className="py-3 px-6 text-left">Role</th>
              <th className="py-3 px-6 text-left">Created At</th>
              <th className="py-3 px-6 text-center">Url</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {history.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-10 text-center text-gray-400">
                  No records found.
                </td>
              </tr>
            ) : (
              history.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-gray-200 hover:bg-gray-100"
                >
                  <td className="py-3 px-6 text-left">{entry.company}</td>
                  <td className="py-3 px-6 text-left">{entry.role}</td>
                  <td className="py-3 px-6 text-left">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-6 text-center max-w-xs truncate">
                    {entry.latex_file_url ? (
                      <a
                        href={entry.latex_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#009688] text-white px-4 py-2 rounded hover:bg-[#00695c] text-sm font-semibold"
                        title={entry.latex_file_url}
                      >
                        View .tex
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Pending</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
