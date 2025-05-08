"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import HistorySkeleton from "./components/HistorySkeleton";
import Header from "./components/Header";
import EditModal from "./components/EditModal";

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const cacheRef = useRef(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axios.delete("/api/history/delete", {
        data: { id },
      });

      if (response.status === 200) {
        setHistory(history.filter((record) => record.id !== id));
      } else {
        console.error("Failed to delete record");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      const response = await axios.put("/api/history/update", {
        id: selectedRecord.id,
        ...updatedData,
      });

      if (response.status === 200) {
        setHistory(
          history.map((record) =>
            record.id === selectedRecord.id ? response.data : record
          )
        );
        setIsEditModalOpen(false);
      } else {
        console.error("Failed to update record");
      }
    } catch (error) {
      console.error("Error updating record:", error);
    }
  };

  const formatFileName = (entry) => {
    const date = new Date(entry.created_at);
    const formattedDate = date.toISOString().split("T")[0];
    const formattedTime = date.toTimeString().split(" ")[0].replace(/:/g, "-");
    const company = entry.company.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const role = entry.role.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    return `${formattedDate}_${formattedTime}_${company}_${role}.tex`;
  };

  const handleDownload = async (entry) => {
    try {
      const response = await axios.get(
        `/api/history/download?url=${encodeURIComponent(entry.latex_file_url)}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/x-latex" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = formatFileName(entry);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  if (status === "loading" || isLoading) {
    return <HistorySkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#005582] to-[#003d5f]">
      <Header />
      <div className="container mx-auto px-4 py-8">
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
              <tbody className="text-white/80 text-sm font-light">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-white/60">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  history.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200"
                    >
                      <td className="py-4 px-6 text-left">{entry.company}</td>
                      <td className="py-4 px-6 text-left">{entry.role}</td>
                      <td className="py-4 px-6 text-left">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {entry.latex_file_url ? (
                          <button
                            onClick={() => handleDownload(entry)}
                            className="px-4 py-2 bg-gradient-to-r from-[#009688] to-[#00796b] text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 mx-auto"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            Download .tex
                          </button>
                        ) : (
                          <span className="text-white/40 italic">Pending</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center space-x-3">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="px-4 py-2 bg-gradient-to-r from-[#2196f3] to-[#1976d2] text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-gradient-to-r from-[#f44336] to-[#d32f2f] text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isEditModalOpen && selectedRecord && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          initialData={selectedRecord}
        />
      )}
    </div>
  );
}
