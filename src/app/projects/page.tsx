"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import ProjectList from "@/components/ProjectList";

export default function ProjectsPage() {
  return (
    <>
      <SignedIn>
        <ProjectList />
      </SignedIn>

      <SignedOut>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <p className="text-white/80">Please sign in to access your projects.</p>
          <SignInButton>
            <button className="rounded-full bg-white px-5 py-2 text-gray-900 shadow">Sign in</button>
          </SignInButton>
        </div>
      </SignedOut>
    </>
  );
}

