import { currentUser, auth } from "@clerk/nextjs/server";
import { eq, or, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, kanbanTasks, kanbanBoards, kanbanBoardShares, users } from "@/db";

function todayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(amount: number) {
  const date = new Date();
  date.setDate(date.getDate() + amount);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET() {
  try {
    const { userId } = await auth();
    let email = "guest@example.com";
    let activeUserId = "guest-user";

    if (userId) {
      activeUserId = userId;
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1);
      
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
      .select({ id: kanbanBoards.id, columns: kanbanBoards.columns })
      .from(kanbanBoards)
      .where(
        or(
          eq(kanbanBoards.userId, activeUserId),
          sharedBoardIds.length > 0 ? inArray(kanbanBoards.id, sharedBoardIds) : undefined
        )
      );

    const visibleBoardIds = boardsList.map((b) => b.id);

    // Query tasks owned by user or belonging to their visible boards
    let tasksList = await db
      .select()
      .from(kanbanTasks)
      .where(
        or(
          eq(kanbanTasks.userId, activeUserId),
          visibleBoardIds.length > 0 ? inArray(kanbanTasks.boardId, visibleBoardIds) : undefined
        )
      );

    return NextResponse.json({ tasks: tasksList });
  } catch (error) {
    console.error("GET tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const body = await request.json();

    const [newTask] = await db
      .insert(kanbanTasks)
      .values({
        ...body,
        userId: activeUserId,
      })
      .returning();

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    console.error("POST task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const [updatedTask] = await db
      .update(kanbanTasks)
      .set(updates)
      .where(eq(kanbanTasks.id, id))
      .returning();

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("PUT task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.delete(kanbanTasks).where(eq(kanbanTasks.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE task error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
