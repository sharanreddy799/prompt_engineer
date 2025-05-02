"use client";

import React from "react";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="w-full flex justify-between items-center p-4 bg-[#003d5b] text-white">
      <h1 className="text-2xl font-bold text-center flex-grow">
         CraftCV
      </h1>
      <div className="flex items-center gap-4 ml-auto">
        <button
          onClick={() => router.push("/history")}
          className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 transition"
        >
          History
        </button>
        {session?.user?.name && <p className="text-sm">{session.user.name}</p>}
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default React.memo(Header);
