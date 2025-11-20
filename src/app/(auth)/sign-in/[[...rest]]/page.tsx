"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <SignIn signUpUrl="/sign-up" appearance={{ variables: { colorText: "#ffffff" } }} />
    </div>
  );
}


