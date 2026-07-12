import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, spaces } from "@/db";

export async function GET() {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const userSpaces = await db
      .select()
      .from(spaces)
      .where(eq(spaces.userId, activeUserId))
      .orderBy(desc(spaces.updatedAt));

    return NextResponse.json({ spaces: userSpaces });
  } catch (error) {
    console.error("GET spaces error:", error);
    return NextResponse.json({ error: "Failed to fetch spaces" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const body = await request.json();
    const { id, name, description, color } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }

    const [newSpace] = await db
      .insert(spaces)
      .values({
        id,
        userId: activeUserId,
        name,
        description: description || "",
        color: color || "#7c5dfa",
        isFavorite: false,
        isArchived: false,
      })
      .returning();

    return NextResponse.json({ space: newSpace }, { status: 201 });
  } catch (error) {
    console.error("POST space error:", error);
    return NextResponse.json({ error: "Failed to create space" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const body = await request.json();
    const { id, name, description, color, isFavorite, isArchived } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const [updatedSpace] = await db
      .update(spaces)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(isArchived !== undefined && { isArchived }),
        updatedAt: new Date(),
      })
      .where(and(eq(spaces.id, id), eq(spaces.userId, activeUserId)))
      .returning();

    if (!updatedSpace) {
      return NextResponse.json({ error: "Space not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ space: updatedSpace });
  } catch (error) {
    console.error("PUT space error:", error);
    return NextResponse.json({ error: "Failed to update space" }, { status: 500 });
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
      .delete(spaces)
      .where(and(eq(spaces.id, id), eq(spaces.userId, activeUserId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Space not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE space error:", error);
    return NextResponse.json({ error: "Failed to delete space" }, { status: 500 });
  }
}
