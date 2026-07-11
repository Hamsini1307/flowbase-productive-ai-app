import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, whiteboards } from "@/db";

export async function GET() {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const userWhiteboards = await db
      .select()
      .from(whiteboards)
      .where(eq(whiteboards.userId, activeUserId))
      .orderBy(desc(whiteboards.updatedAt));

    return NextResponse.json({ whiteboards: userWhiteboards });
  } catch (error) {
    console.error("GET whiteboards error:", error);
    return NextResponse.json({ error: "Failed to fetch whiteboards" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const body = await request.json();
    const { id, name, color } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const [newWhiteboard] = await db
      .insert(whiteboards)
      .values({
        id,
        userId: activeUserId,
        name: name || "Untitled Whiteboard",
        color: color || "#ff6b4a",
        elements: [],
        appState: {},
      })
      .returning();

    return NextResponse.json({ whiteboard: newWhiteboard }, { status: 201 });
  } catch (error) {
    console.error("POST whiteboard error:", error);
    return NextResponse.json({ error: "Failed to create whiteboard" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const body = await request.json();
    const { id, name, elements, appState, color } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const [updatedWhiteboard] = await db
      .update(whiteboards)
      .set({
        ...(name !== undefined && { name }),
        ...(elements !== undefined && { elements }),
        ...(appState !== undefined && { appState }),
        ...(color !== undefined && { color }),
        updatedAt: new Date(),
      })
      .where(and(eq(whiteboards.id, id), eq(whiteboards.userId, activeUserId)))
      .returning();

    if (!updatedWhiteboard) {
      return NextResponse.json({ error: "Whiteboard not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ whiteboard: updatedWhiteboard });
  } catch (error) {
    console.error("PUT whiteboard error:", error);
    return NextResponse.json({ error: "Failed to update whiteboard" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const deleted = await db
      .delete(whiteboards)
      .where(and(eq(whiteboards.id, id), eq(whiteboards.userId, activeUserId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Whiteboard not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE whiteboard error:", error);
    return NextResponse.json({ error: "Failed to delete whiteboard" }, { status: 500 });
  }
}
