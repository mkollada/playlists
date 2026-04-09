import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const SPOTIFY_SCOPES = [
  "user-read-email",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(SPOTIFY_SCOPES)}&redirect_uri=${encodeURIComponent(process.env.AUTH_URL + "/api/auth/callback/spotify")}`,
      token: {
        url: `https://accounts.spotify.com/api/token`,
        params: { redirect_uri: process.env.AUTH_URL + "/api/auth/callback/spotify" },
      },
      checks: ["none"],
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "spotify" && account.access_token) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            spotifyId: account.providerAccountId,
            spotifyAccessToken: account.access_token,
            spotifyRefreshToken: account.refresh_token,
            spotifyTokenExpiresAt: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          },
        });
      }
      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
