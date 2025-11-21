"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbe4ff] via-white to-white flex items-start justify-center px-4">
      <div className="mt-24 flex flex-col items-center gap-6">
        <SignIn
          signUpUrl="/sign-up"
          afterSignInUrl="/projects"
          appearance={{
            elements: {
              rootBox: "shadow-lg rounded-2xl border border-gray-100 bg-white",
              card: "bg-white",
            },
          }}
        />
      </div>
    </div>
  );
}


