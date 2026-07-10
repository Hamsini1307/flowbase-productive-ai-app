import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, kanbanBoardShares, users } from "@/db";
import { getCachedUser } from "@/lib/user-cache";

export async function GET(request: Request) {
  const { userId } = await auth();

  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get("boardId")?.trim();

  if (!boardId) {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }

  // Fetch shares
  let shares = await db
    .select()
    .from(kanbanBoardShares)
    .where(eq(kanbanBoardShares.boardId, boardId));

  // If no shares exist, bootstrap the current user as the first share (owner/creator)
  if (shares.length === 0) {
    let userEmail = "guest@example.com";
    if (userId) {
      const dbUser = await getCachedUser(userId);
      if (dbUser?.email) {
        userEmail = dbUser.email;
      }
    }
    if (userEmail) {
      const [newShare] = await db
        .insert(kanbanBoardShares)
        .values({
          boardId,
          email: userEmail.toLowerCase(),
        })
        .returning();
      shares = [newShare];
    }
  }

  // Fetch matching user details for these emails to display their names/avatars
  const emails = shares.map((s) => s.email.toLowerCase());
  const dbUsers = emails.length > 0 
    ? await db.select().from(users) 
    : [];

  const results = shares.map((share) => {
    const matchedUser = dbUsers.find((u) => u.email.toLowerCase() === share.email.toLowerCase());
    return {
      id: share.id,
      boardId: share.boardId,
      email: share.email,
      name: matchedUser?.name || null,
      imageUrl: matchedUser?.imageUrl || null,
      createdAt: share.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ shares: results });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    boardId?: string;
    email?: string;
  };

  const boardId = body.boardId?.trim();
  const email = body.email?.trim()?.toLowerCase();

  if (!boardId || !email) {
    return NextResponse.json({ error: "boardId and email are required" }, { status: 400 });
  }

  // Check if already shared
  const [existingShare] = await db
    .select()
    .from(kanbanBoardShares)
    .where(
      and(
        eq(kanbanBoardShares.boardId, boardId),
        eq(kanbanBoardShares.email, email)
      )
    )
    .limit(1);

  if (existingShare) {
    return NextResponse.json({ share: existingShare }, { status: 200 });
  }

  const [newShare] = await db
    .insert(kanbanBoardShares)
    .values({
      boardId,
      email,
    })
    .returning();

  // Try to find user info to return complete details
  const [matchedUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return NextResponse.json(
    {
      share: {
        id: newShare.id,
        boardId: newShare.boardId,
        email: newShare.email,
        name: matchedUser?.name || null,
        imageUrl: matchedUser?.imageUrl || null,
        createdAt: newShare.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
