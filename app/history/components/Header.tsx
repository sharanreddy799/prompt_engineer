"use client";

import React from "react";
import { useSession } from "next-auth/react";
import ProfileDropdown from "../../dashboard/components/ProfileDropdown";

function Header() {
  const { data: session } = useSession();

  return (
    <div className="w-full bg-[#003d5b] text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex-1" /> {/* Spacer */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-semibold text-white">
              Resume History
            </h1>
          </div>
          <div className="flex-1 flex justify-end">
            {session?.user?.name && (
              <ProfileDropdown userName={session.user.name} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Header);
