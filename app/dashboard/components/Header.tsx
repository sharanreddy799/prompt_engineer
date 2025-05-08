"use client";

import React from "react";
import { useSession } from "next-auth/react";
import ProfileDropdown from "./ProfileDropdown";

function Header() {
  const { data: session } = useSession();

  return (
    <div className="w-full flex justify-between items-center p-4 bg-[#003d5b] text-white">
      <h1 className="text-2xl font-bold text-center flex-grow">CraftCV</h1>
      <div className="flex items-center gap-4 ml-auto">
        {session?.user?.name && (
          <ProfileDropdown userName={session.user.name} />
        )}
      </div>
    </div>
  );
}

export default React.memo(Header);
