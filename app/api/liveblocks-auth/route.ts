import { Liveblocks } from "@liveblocks/node";
import { currentUser, auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, kanbanBoardShares, users } from "@/db";
import { getCachedUser } from "@/lib/user-cache";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    let email = "guest@example.com";
    let activeUserId = "guest-user";
    let dbUser = null;

    if (userId) {
      activeUserId = userId;
      // Use high-performance local memory cache
      const cached = await getCachedUser(userId);
      if (cached) {
        dbUser = cached;
        email = cached.email.toLowerCase();
      } else {
        // Fallback to database select
        const [foundUser] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, userId))
          .limit(1);
        
        if (foundUser) {
          dbUser = foundUser;
          email = foundUser.email.toLowerCase();
        } else {
          // Fallback to Clerk currentUser lookup only when not synced yet
          const clerkUser = await currentUser();
          if (clerkUser) {
            email = clerkUser.primaryEmailAddress?.emailAddress?.toLowerCase() || "guest@example.com";
            dbUser = {
              name: clerkUser.fullName || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" "),
              imageUrl: clerkUser.imageUrl,
              email: email,
            };
          }
        }
      }
    }

    const { room } = (await request.json()) as { room?: string };

    if (!room) {
      return new NextResponse("Bad Request: room is required", { status: 400 });
    }

    // Room ID format "kanban-{boardId}"
    if (!room.startsWith("kanban-")) {
      return new NextResponse("Forbidden: Invalid room prefix", { status: 403 });
    }

    const boardId = room.replace("kanban-", "");

    // Check if the board has shares
    const shares = await db
      .select()
      .from(kanbanBoardShares)
      .where(eq(kanbanBoardShares.boardId, boardId));

    let isAllowed = false;

    if (shares.length === 0) {
      // Bootstrap the owner of this board in the db
      await db
        .insert(kanbanBoardShares)
        .values({
          boardId,
          email,
        });
      isAllowed = true;
    } else {
      // Check if current user email is in the list
      isAllowed = shares.some((s) => s.email.toLowerCase() === email);
    }

    if (!isAllowed) {
      return new NextResponse("Forbidden: You do not have access to this board", { status: 403 });
    }

    const displayName = dbUser?.name || email;

    // Start Liveblocks session
    const session = liveblocks.prepareSession(activeUserId, {
      userInfo: {
        name: displayName,
        avatar: dbUser?.imageUrl || "",
        email: email,
      },
    });

    // Grant write permission to this specific room
    session.allow(room, ["room:write"]);

    // Race authorization with a 4-second timeout to avoid indefinite hanging
    const authPromise = session.authorize();
    const timeoutPromise = new Promise<{ status: number; body: string }>((_, reject) =>
      setTimeout(() => reject(new Error("Liveblocks auth timed out on server")), 1500)
    );

    const { status, body } = await Promise.race([authPromise, timeoutPromise]);
    return new Response(body, { status });
  } catch (error) {
    console.error("Liveblocks Auth Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
