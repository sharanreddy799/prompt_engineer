"use client";

import React from "react";
import { useSession } from "next-auth/react";
import ProfileDropdown from "../../dashboard/components/ProfileDropdown";

function Header() {
  const { data: session } = useSession();

  return (
    <div className="w-full flex justify-end items-center p-4 bg-[#003d5b] text-white">
      <div className="flex items-center">
        {session?.user?.name && (
          <ProfileDropdown userName={session.user.name} />
        )}
      </div>
    </div>
  );
}

export default React.memo(Header);
