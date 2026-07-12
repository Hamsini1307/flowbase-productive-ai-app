import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, aiApps } from "@/db";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const [app] = await db
        .select()
        .from(aiApps)
        .where(and(eq(aiApps.id, id), eq(aiApps.userId, activeUserId)));
      
      if (!app) {
        return NextResponse.json({ error: "App not found" }, { status: 404 });
      }
      return NextResponse.json({ app });
    }

    const userApps = await db
      .select()
      .from(aiApps)
      .where(eq(aiApps.userId, activeUserId))
      .orderBy(desc(aiApps.createdAt));

    return NextResponse.json({ apps: userApps });
  } catch (error) {
    console.error("GET AI apps error:", error);
    return NextResponse.json({ error: "Failed to fetch AI apps" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const body = await request.json();
    const { id, name, description, icon, color, layout, data } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }

    const [newApp] = await db
      .insert(aiApps)
      .values({
        id,
        userId: activeUserId,
        name,
        description: description || "",
        icon: icon || "Flame",
        color: color || "#f97316",
        layout: layout || "single-page",
        data: data || {},
        inSidebar: false,
      })
      .returning();

    return NextResponse.json({ app: newApp }, { status: 201 });
  } catch (error) {
    console.error("POST AI app error:", error);
    return NextResponse.json({ error: "Failed to create AI app" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const body = await request.json();
    const { id, name, description, icon, color, inSidebar, data } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // If adding to sidebar, verify maximum limit of 3 in sidebar
    if (inSidebar === true) {
      const activeSidebarApps = await db
        .select()
        .from(aiApps)
        .where(and(eq(aiApps.userId, activeUserId), eq(aiApps.inSidebar, true)));
      
      if (activeSidebarApps.length >= 3) {
        return NextResponse.json({ error: "Sidebar limit reached (maximum 3 apps allowed)" }, { status: 400 });
      }
    }

    const [updatedApp] = await db
      .update(aiApps)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(inSidebar !== undefined && { inSidebar }),
        ...(data !== undefined && { data }),
        updatedAt: new Date(),
      })
      .where(and(eq(aiApps.id, id), eq(aiApps.userId, activeUserId)))
      .returning();

    if (!updatedApp) {
      return NextResponse.json({ error: "App not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ app: updatedApp });
  } catch (error) {
    console.error("PUT AI app error:", error);
    return NextResponse.json({ error: "Failed to update AI app" }, { status: 500 });
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
      .delete(aiApps)
      .where(and(eq(aiApps.id, id), eq(aiApps.userId, activeUserId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "App not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE AI app error:", error);
    return NextResponse.json({ error: "Failed to delete AI app" }, { status: 500 });
  }
}
