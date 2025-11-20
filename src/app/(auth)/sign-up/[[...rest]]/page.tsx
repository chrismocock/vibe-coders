"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <SignUp signInUrl="/sign-in" appearance={{ variables: { colorText: "#ffffff" } }} />
    </div>
  );
}


