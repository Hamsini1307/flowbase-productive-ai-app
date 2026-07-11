import { currentUser, auth } from "@clerk/nextjs/server";
import { eq, or } from "drizzle-orm";
import { db, users } from "@/db";
import { getCachedUser, setCachedUser } from "@/lib/user-cache";

export async function syncCurrentUser() {
  const { userId } = await auth();

  if (!userId) return null;

  // 1. Check local cache first (extremely fast)
  const cached = await getCachedUser(userId);
  if (cached) {
    return cached;
  }

  // 2. Check local database (fast)
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (existingUser) {
    setCachedUser(userId, existingUser);
    return existingUser;
  }

  // 3. Fallback to slow currentUser() only if the user is missing from DB
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

  const [existingEmailUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingEmailUser) {
    const [savedUser] = await db
      .update(users)
      .set(profile)
      .where(eq(users.id, existingEmailUser.id))
      .returning();

    setCachedUser(user.id, savedUser);
    return savedUser;
  }

  const [savedUser] = await db
    .insert(users)
    .values(profile)
    .returning();

  setCachedUser(user.id, savedUser);
  return savedUser;
}