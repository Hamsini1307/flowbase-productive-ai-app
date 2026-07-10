import { db, users } from "@/db";
import { eq } from "drizzle-orm";

interface CachedUser {
  id: number;
  clerkId: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
}

const cache = new Map<string, CachedUser>();

export async function getCachedUser(clerkId: string): Promise<CachedUser | null> {
  if (cache.has(clerkId)) {
    return cache.get(clerkId)!;
  }

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (dbUser) {
    cache.set(clerkId, dbUser);
    return dbUser;
  }

  return null;
}

export function setCachedUser(clerkId: string, user: CachedUser) {
  cache.set(clerkId, user);
}

export function clearUserCache(clerkId: string) {
  cache.delete(clerkId);
}
