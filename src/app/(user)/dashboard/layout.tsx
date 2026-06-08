'use client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Nested dashboard layout should be empty — top-level (user) layout provides navigation and header.
  return <>{children}</>;
}
