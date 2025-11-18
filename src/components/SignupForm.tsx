"use client";

import { SignUp } from "@clerk/nextjs";

export function SignupForm() {
  return (
    <section id="signup" className="mx-auto max-w-4xl">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <SignUp
          routing="hash"
          signInUrl="/sign-in"
          afterSignUpUrl="/projects"
          appearance={{ variables: { colorText: "#ffffff" } }}
        />
      </div>
    </section>
  );
}


