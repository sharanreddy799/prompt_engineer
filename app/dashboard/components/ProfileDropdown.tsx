"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ProfileDropdownProps {
  userName: string;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ userName }) => {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#004d6d] rounded-md hover:bg-[#005582] transition"
      >
        <span className="text-sm">{userName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
          <button
            onClick={() => {
              router.push("/history");
              setIsDropdownOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
          >
            History
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ProfileDropdown);
