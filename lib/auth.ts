import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";

const isDev = process.env.NODE_ENV === "development" && process.env.DEV_MODE === "true";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "repo user",
        },
      },
    }),
    ...(isDev
      ? [
          CredentialsProvider({
            name: "Dev Mode",
            credentials: {
              token: { label: "Token", type: "password" },
            },
            async authorize(credentials) {
              if (credentials?.token === "dev-mode-active") {
                return {
                  id: "dev-user",
                  name: "Dev User",
                  email: "dev@shipwright.local",
                  image: null,
                };
              }
              return null;
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.profile = profile;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.accessToken = token.accessToken || process.env.DEV_GITHUB_TOKEN || undefined;
      }
      return session;
    },
    async signIn({ account, user, profile }) {
      // Allow dev mode users (they have an id but no profile)
      if (user?.id === "dev-user") {
        return true;
      }
      // Require account and profile for GitHub OAuth
      if (!account || !profile) {
        console.error("SignIn callback: Missing account or profile", {
          account: !!account,
          profile: !!profile,
        });
        return false;
      }
      return true;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log("SignIn event:", { userId: user?.id, provider: account?.provider, isNewUser });
    },
  },
  pages: {
    signIn: "/",
  },
};
