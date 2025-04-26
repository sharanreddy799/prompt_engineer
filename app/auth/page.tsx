"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="text-white text-center mt-20 text-2xl">Loading...</div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#005582]">
      <h1 className="text-3xl font-bold text-white mb-6">
        Welcome, please sign in
      </h1>
      <button
        onClick={() => signIn("google")}
        className="bg-white text-[#005582] px-6 py-3 rounded-md font-semibold hover:bg-gray-100 shadow"
      >
        Sign In with Google
      </button>
    </div>
  );
}
