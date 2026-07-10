import { currentUser, auth } from "@clerk/nextjs/server";
import { eq, or, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, kanbanBoards, kanbanBoardShares, users } from "@/db";
import { getCachedUser } from "@/lib/user-cache";

export async function GET() {
  try {
    const { userId } = await auth();
    let email = "guest@example.com";
    let activeUserId = "guest-user";

    if (userId) {
      activeUserId = userId;
      const dbUser = await getCachedUser(userId);
      if (dbUser?.email) {
        email = dbUser.email.toLowerCase();
      } else {
        const clerkUser = await currentUser();
        if (clerkUser) {
          email = clerkUser.primaryEmailAddress?.emailAddress?.toLowerCase() || "guest@example.com";
        }
      }
    }

    // Get shared board IDs
    const sharedShares = await db
      .select({ boardId: kanbanBoardShares.boardId })
      .from(kanbanBoardShares)
      .where(eq(kanbanBoardShares.email, email));

    const sharedBoardIds = sharedShares.map((s) => s.boardId);

    // Query boards owned by user or shared with user
    const boardsList = await db
      .select()
      .from(kanbanBoards)
      .where(
        or(
          eq(kanbanBoards.userId, activeUserId),
          sharedBoardIds.length > 0 ? inArray(kanbanBoards.id, sharedBoardIds) : undefined
        )
      );

    return NextResponse.json({ boards: boardsList });
  } catch (error) {
    console.error("GET boards error:", error);
    return NextResponse.json({ error: "Failed to fetch boards" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const body = await request.json();
    const { id, name, color, columns } = body;

    if (!id || !name || !color || !columns) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [newBoard] = await db
      .insert(kanbanBoards)
      .values({
        id,
        userId: activeUserId,
        name,
        color,
        columns,
      })
      .returning();

    return NextResponse.json({ board: newBoard }, { status: 201 });
  } catch (error) {
    console.error("POST board error:", error);
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, color, columns } = body;

    if (!id || !name || !color || !columns) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [updatedBoard] = await db
      .update(kanbanBoards)
      .set({
        name,
        color,
        columns,
      })
      .where(eq(kanbanBoards.id, id))
      .returning();

    return NextResponse.json({ board: updatedBoard });
  } catch (error) {
    console.error("PUT board error:", error);
    return NextResponse.json({ error: "Failed to update board" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.delete(kanbanBoards).where(eq(kanbanBoards.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE board error:", error);
    return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
  }
}
