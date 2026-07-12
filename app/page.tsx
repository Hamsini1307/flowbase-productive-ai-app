import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { LandingPage } from "@/components/landing-page";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    return <DashboardShell />;
  }

  return <LandingPage />;
}
