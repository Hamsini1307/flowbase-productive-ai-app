import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, notes } from "@/db";

export async function GET() {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const userNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, activeUserId))
      .orderBy(desc(notes.isPinned), desc(notes.updatedAt));

    return NextResponse.json({ notes: userNotes });
  } catch (error) {
    console.error("GET notes error:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const body = await request.json();
    const { id, title, content, icon, color } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const [newNote] = await db
      .insert(notes)
      .values({
        id,
        userId: activeUserId,
        title: title || "Untitled",
        content: content || "",
        icon: icon || "📝",
        color: color || "#ff6b4a",
        isPinned: false,
        isTrash: false,
      })
      .returning();

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error("POST note error:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const body = await request.json();
    const { id, title, content, icon, color, isPinned, isTrash } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const [updatedNote] = await db
      .update(notes)
      .set({
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(isPinned !== undefined && { isPinned }),
        ...(isTrash !== undefined && { isTrash }),
        updatedAt: new Date(),
      })
      .where(and(eq(notes.id, id), eq(notes.userId, activeUserId)))
      .returning();

    if (!updatedNote) {
      return NextResponse.json({ error: "Note not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error("PUT note error:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
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
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, activeUserId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Note not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE note error:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
