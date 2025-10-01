/**
 * Session management utilities
 * Creates and validates user sessions
 */

import { prisma } from "./db";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "qb_session_id";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Get or create a session ID from cookies
 */
export async function getOrCreateSession(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // If no session cookie, create a new session
  if (!sessionId) {
    const newSession = await prisma.userSession.create({
      data: {
        sessionId: crypto.randomUUID(),
      },
    });
    sessionId = newSession.sessionId;
  } else {
    // Verify session exists in database
    const existingSession = await prisma.userSession.findUnique({
      where: { sessionId },
    });

    if (!existingSession) {
      // Session cookie exists but not in DB, create new one
      const newSession = await prisma.userSession.create({
        data: {
          sessionId: crypto.randomUUID(),
        },
      });
      sessionId = newSession.sessionId;
    }
  }

  return sessionId;
}

/**
 * Set session cookie in response
 */
export async function setSessionCookie(sessionId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}
