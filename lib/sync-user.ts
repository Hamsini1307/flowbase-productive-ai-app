import { currentUser } from "@clerk/nextjs/server";
import { eq, or } from "drizzle-orm";
import { db, users } from "@/db";

export async function syncCurrentUser() {
  const user = await currentUser();

  if (!user) return null;

  const email = user.primaryEmailAddress?.emailAddress;

  if (!email) return null;

  const name =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    null;

  const profile = {
    clerkId: user.id,
    name,
    email,
    imageUrl: user.imageUrl,
    updatedAt: new Date(),
  };

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.clerkId, user.id), eq(users.email, email)))
    .limit(1);

  if (existingUser) {
    const [savedUser] = await db
      .update(users)
      .set(profile)
      .where(eq(users.id, existingUser.id))
      .returning();

    return savedUser;
  }

  const [savedUser] = await db
    .insert(users)
    .values(profile)
    .returning();

  return savedUser;
}