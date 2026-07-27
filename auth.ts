import PostgresAdapter from "@auth/pg-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { pool } from "@/lib/db";
import { isGoogleCustomerAuthConfigured } from "@/lib/customerAuthConfig";

const providers = isGoogleCustomerAuthConfigured() ? [Google] : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  providers,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn({ account, profile }) {
      return (
        account?.provider === "google" && profile?.email_verified === true
      );
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = String(user.id);
      }

      return session;
    },
  },
});
