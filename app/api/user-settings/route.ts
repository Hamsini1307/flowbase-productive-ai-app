import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, userSettings } from "@/db";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    // 1. Try to fetch existing settings
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, activeUserId));

    if (settings) {
      return NextResponse.json({ settings });
    }

    // 2. Fetch clerk user details for initial setup
    let name = "Guest User";
    let email = "guest@example.com";
    let imageUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";

    if (activeUserId !== "guest-user") {
      try {
        const clerkUser = await currentUser();
        if (clerkUser) {
          name = clerkUser.fullName || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Clerk User";
          email = clerkUser.primaryEmailAddress?.emailAddress || "user@example.com";
          imageUrl = clerkUser.imageUrl || imageUrl;
        }
      } catch (err) {
        console.error("Clerk fetch user error in settings:", err);
      }
    }

    // 3. Insert and initialize default settings
    const [newSettings] = await db
      .insert(userSettings)
      .values({
        id: activeUserId,
        userId: activeUserId,
        name,
        email,
        imageUrl,
        subscriptionPlan: "Free",
        subscriptionStatus: "Active",
        subscriptionRenewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        // Default category configs
        categories: {
          calendar: [
            { name: "Work", color: "#6257f6", icon: "Briefcase" },
            { name: "Personal", color: "#ff6b4a", icon: "User" },
            { name: "Meeting", color: "#00a88f", icon: "Calendar" },
            { name: "Focus", color: "#ffd166", icon: "Timer" },
            { name: "Reminder", color: "#ff8ab3", icon: "Bell" }
          ],
          kanban: [
            { name: "Design", color: "#ffd166", icon: "Palette" },
            { name: "Development", color: "#55c7f5", icon: "Code" },
            { name: "Review", color: "#ff8ab3", icon: "Search" },
            { name: "Done", color: "#80d77b", icon: "Check" }
          ],
          notes: [
            { name: "Ideas", color: "#ffd166", icon: "Lightbulb" },
            { name: "Drafts", color: "#55c7f5", icon: "FileText" },
            { name: "Trash", color: "#ff8ab3", icon: "Trash2" }
          ],
          reminders: [
            { name: "High Priority", color: "#ff6b4a", icon: "AlertCircle" },
            { name: "Daily Routines", color: "#00a88f", icon: "Clock" }
          ]
        },
        preferredAiModel: "gemini-2.5-flash",
        aiBehavior: "Helpful planning assistant specializing in clean workspace layouts.",
        aiTone: "Cozy",
        enabledAiFeatures: {
          aiRefine: true,
          aiAssistant: true,
          aiBuilder: true
        },
        theme: "light",
        notifications: {
          email: true,
          push: false,
          updates: true
        },
        defaultCalendarView: "Month",
        defaultTaskPriority: "Medium",
        autoSave: true,
        privacySettings: {
          shareData: false,
          analyticsOptIn: true
        }
      })
      .returning();

    return NextResponse.json({ settings: newSettings });
  } catch (error) {
    console.error("GET user-settings error:", error);
    return NextResponse.json({ error: "Failed to fetch user settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const body = await request.json();

    // Check if settings record exists first
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, activeUserId));

    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    const [updatedSettings] = await db
      .update(userSettings)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(userSettings.userId, activeUserId))
      .returning();

    return NextResponse.json({ settings: updatedSettings });
  } catch (error) {
    console.error("PUT user-settings error:", error);
    return NextResponse.json({ error: "Failed to update user settings" }, { status: 500 });
  }
}
