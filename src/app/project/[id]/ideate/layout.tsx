"use client";

export default function IdeateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 mb-6">
          Ideate Your Idea
        </h1>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}

