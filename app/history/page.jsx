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
  const cacheRef = useRef(null); // Cache reference
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
    const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const formattedTime = date.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS
    const company = entry.company.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const role = entry.role.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    return `${formattedDate}_${formattedTime}_${company}_${role}.tex`;
  };

  const handleDownload = async (entry) => {
    try {
      // First, fetch the file content through our API
      const response = await axios.get(
        `/api/history/download?url=${encodeURIComponent(entry.latex_file_url)}`,
        {
          responseType: "blob",
        }
      );

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: "application/x-latex" });

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.download = formatFileName(entry);

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();

      // Clean up
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
    <div className="min-h-screen bg-[#005582]">
      <Header />
      <div className="p-8">
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
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-400">
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
                        <button
                          onClick={() => handleDownload(entry)}
                          className="bg-[#009688] text-white px-4 py-2 rounded hover:bg-[#00695c] text-sm font-semibold transition-colors"
                          title={entry.latex_file_url}
                        >
                          Download .tex
                        </button>
                      ) : (
                        <span className="text-gray-400 italic">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={isDeleting}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
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
