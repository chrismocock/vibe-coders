"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

export function DesktopUserMenu() {
  const { isSignedIn } = useUser();

  return (
    <div className="pointer-events-auto rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur">
      {isSignedIn ? (
        <UserButton
          afterSignOutUrl="/"
          appearance={{ elements: { userButtonPopoverCard: "bg-white" } }}
        />
      ) : (
        <SignInButton mode="redirect">
          <button className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-gray-900">
            Sign in
          </button>
        </SignInButton>
      )}
    </div>
  );
}
