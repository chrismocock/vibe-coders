import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { DesktopUserMenu } from "@/components/DesktopUserMenu";

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
          {/* Desktop User Button - Hidden on mobile */}
          <div className="pointer-events-none fixed inset-x-0 top-0 z-50 hidden lg:flex items-center justify-end p-4">
            <DesktopUserMenu />
          </div>
          {children}
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
