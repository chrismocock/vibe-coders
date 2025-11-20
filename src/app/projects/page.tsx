"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import ProjectList from "@/components/ProjectList";

export default function ProjectsPage() {
  return (
    <>
      <SignedIn>
        <div className="space-y-6">
          <div className="hidden lg:block">
            <h1 className="text-2xl font-semibold text-white md:text-3xl">Your Projects</h1>
            <p className="mt-2 text-white/70">
              Manage your projects and track progress through each stage of the journey.
            </p>
          </div>
          <ProjectList />
        </div>
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

