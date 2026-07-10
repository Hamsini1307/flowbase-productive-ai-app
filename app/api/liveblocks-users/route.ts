import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, users } from "@/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userIds = body.userIds as string[];

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json([]);
    }

    // Query database for users matching these Clerk IDs
    const dbUsers = await db
      .select()
      .from(users)
      .where(inArray(users.clerkId, userIds));

    // Map each requested userId in order
    const results = userIds.map((id) => {
      const u = dbUsers.find((user) => user.clerkId === id);
      if (u) {
        return {
          name: u.name || u.email,
          avatar: u.imageUrl || "",
          email: u.email,
        };
      }
      return {
        name: "Guest Collaborator",
        avatar: "",
        email: "",
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error resolving users:", error);
    return NextResponse.json({ error: "Failed to resolve users" }, { status: 500 });
  }
}
