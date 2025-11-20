"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

interface MobileHeaderProps {
  projectTitle: string;
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export default function MobileHeader({
  projectTitle,
  isSidebarOpen,
  onSidebarToggle,
}: MobileHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200 h-14 flex items-center px-4">
      {/* Hamburger Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onSidebarToggle}
        className="h-10 w-10 min-w-[44px] -ml-2"
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Project Title */}
      <div className="flex-1 px-3 min-w-0">
        <h1 className="text-base font-semibold text-neutral-900 truncate">
          {projectTitle || "Untitled Project"}
        </h1>
      </div>

      {/* User Button */}
      <div className="flex items-center -mr-2">
        <SignedIn>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonPopoverCard: "bg-white",
                userButtonTrigger: "h-8 w-8",
              },
            }}
          />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-sm"
            >
              Sign in
            </Button>
          </SignInButton>
        </SignedOut>
      </div>
    </header>
  );
}

