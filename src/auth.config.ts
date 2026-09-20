import type { NextAuthConfig } from "next-auth";

// Edge-safe config used by middleware (no database access here).
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (
          session.user as typeof session.user & { role: string; id: string }
        ).role = token.role as string;
        (
          session.user as typeof session.user & { role: string; id: string }
        ).id = token.id as string;
      }
      return session;
    },
  },
};
