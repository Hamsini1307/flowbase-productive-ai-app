import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";
import type { Metadata } from "next";
import { syncCurrentUser } from '@/lib/sync-user';

export const metadata: Metadata = {
  title: "Flowbase Productivity Workspace",
  description: "A cozy visual productivity workspace for notes, boards, calendars, templates, and AI workflows.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await syncCurrentUser();

  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
