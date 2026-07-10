import { auth, currentUser } from "@clerk/nextjs/server";
import { asc, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, kanbanTaskComments, users } from "@/db";
import { getCachedUser } from "@/lib/user-cache";

function commentPayload(comment: typeof kanbanTaskComments.$inferSelect) {
  return {
    id: comment.id,
    taskId: comment.taskId,
    parentId: comment.parentId,
    message: comment.message,
    author: {
      id: comment.authorId,
      name: comment.authorName,
      email: comment.authorEmail,
      imageUrl: comment.authorImageUrl,
    },
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

async function getRequestUser() {
  const { userId } = await auth();
  if (!userId) {
    return {
      id: null,
      name: "Guest collaborator",
      email: "guest@example.com",
      imageUrl: null,
    };
  }

  // Look up user in local database cache
  const dbUser = await getCachedUser(userId);
  if (dbUser) {
    return {
      id: dbUser.id,
      name: dbUser.name || dbUser.email,
      email: dbUser.email,
      imageUrl: dbUser.imageUrl || null,
    };
  }

  // Fallback to clerk (rare)
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return {
      id: null,
      name: "Guest collaborator",
      email: "guest@example.com",
      imageUrl: null,
    };
  }
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const displayName =
    clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    email ||
    "Guest collaborator";

  return {
    id: null,
    name: displayName,
    email: email || "guest@example.com",
    imageUrl: clerkUser.imageUrl || null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId")?.trim();

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const comments = await db
    .select()
    .from(kanbanTaskComments)
    .where(eq(kanbanTaskComments.taskId, taskId))
    .orderBy(asc(kanbanTaskComments.createdAt), asc(kanbanTaskComments.id));

  return NextResponse.json({ comments: comments.map(commentPayload) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    taskId?: string;
    parentId?: number | null;
    message?: string;
  };

  const taskId = body.taskId?.trim();
  const message = body.message?.trim();

  if (!taskId || !message) {
    return NextResponse.json({ error: "taskId and message are required" }, { status: 400 });
  }

  const author = await getRequestUser();
  const [savedComment] = await db
    .insert(kanbanTaskComments)
    .values({
      taskId,
      parentId: body.parentId ?? null,
      message,
      authorId: author.id,
      authorName: author.name,
      authorEmail: author.email,
      authorImageUrl: author.imageUrl,
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ comment: commentPayload(savedComment) }, { status: 201 });
}
