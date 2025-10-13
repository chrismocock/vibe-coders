import type { Metadata } from "next";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibe Coders — Turn your vibe into code",
  description: "Vibe Coders guides you from idea to app — no coding required.",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-display" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${poppins.variable} antialiased bg-background text-foreground font-sans`}>
          <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-end p-4">
            <div className="pointer-events-auto rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur">
              <SignedIn>
                <div className="flex items-center gap-3">
                  <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonPopoverCard: "bg-white" } }} />
                </div>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-gray-900">Sign in</button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
