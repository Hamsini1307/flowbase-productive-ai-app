import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, spacePages } from "@/db";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get("spaceId");

    let query = db
      .select()
      .from(spacePages)
      .where(eq(spacePages.userId, activeUserId));

    if (spaceId) {
      query = db
        .select()
        .from(spacePages)
        .where(and(eq(spacePages.userId, activeUserId), eq(spacePages.spaceId, spaceId)));
    }

    const pages = await query.orderBy(desc(spacePages.updatedAt));
    return NextResponse.json({ pages });
  } catch (error) {
    console.error("GET space pages error:", error);
    return NextResponse.json({ error: "Failed to fetch space pages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const body = await request.json();
    const { id, spaceId, title, description, content, template, updatedBy } = body;

    if (!id || !spaceId || !title) {
      return NextResponse.json({ error: "id, spaceId, and title are required" }, { status: 400 });
    }

    const [newPage] = await db
      .insert(spacePages)
      .values({
        id,
        userId: activeUserId,
        spaceId,
        title,
        description: description || "",
        content: content || "",
        template: template || "Blank Page",
        isFavorite: false,
        isArchived: false,
        updatedBy: updatedBy || "JD",
        commentsCount: Math.floor(Math.random() * 8), // Default visual mock values for linked data
        linkedTasksCount: Math.floor(Math.random() * 5),
      })
      .returning();

    return NextResponse.json({ page: newPage }, { status: 201 });
  } catch (error) {
    console.error("POST space page error:", error);
    return NextResponse.json({ error: "Failed to create space page" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const body = await request.json();
    const { id, spaceId, title, description, content, template, isFavorite, isArchived, updatedBy, commentsCount, linkedTasksCount } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const [updatedPage] = await db
      .update(spacePages)
      .set({
        ...(spaceId !== undefined && { spaceId }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(template !== undefined && { template }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(isArchived !== undefined && { isArchived }),
        ...(updatedBy !== undefined && { updatedBy }),
        ...(commentsCount !== undefined && { commentsCount }),
        ...(linkedTasksCount !== undefined && { linkedTasksCount }),
        updatedAt: new Date(),
      })
      .where(and(eq(spacePages.id, id), eq(spacePages.userId, activeUserId)))
      .returning();

    if (!updatedPage) {
      return NextResponse.json({ error: "Page not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ page: updatedPage });
  } catch (error) {
    console.error("PUT space page error:", error);
    return NextResponse.json({ error: "Failed to update space page" }, { status: 500 });
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
      .delete(spacePages)
      .where(and(eq(spacePages.id, id), eq(spacePages.userId, activeUserId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Page not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE space page error:", error);
    return NextResponse.json({ error: "Failed to delete space page" }, { status: 500 });
  }
}
