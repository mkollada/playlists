import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

const REDIRECT_URI = `${process.env.AUTH_URL}/api/auth/spotify/callback`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const base = new URL(process.env.AUTH_URL!);

  if (error || !code) {
    return NextResponse.redirect(new URL("/?error=spotify_denied", base));
  }

  const savedState = req.cookies.get("spotify_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/?error=invalid_state", base));
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/?error=token_exchange", base));
  }

  const tokens = await tokenRes.json();

  // Fetch Spotify profile
  const profileRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!profileRes.ok) {
    return NextResponse.redirect(new URL("/?error=profile_fetch", base));
  }

  const profile = await profileRes.json();

  // Upsert user
  const user = await prisma.user.upsert({
    where: { spotifyId: profile.id },
    update: {
      spotifyAccessToken: tokens.access_token,
      spotifyRefreshToken: tokens.refresh_token ?? null,
      spotifyTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      name: profile.display_name ?? null,
      image: profile.images?.[0]?.url ?? null,
    },
    create: {
      email: profile.email,
      spotifyId: profile.id,
      spotifyAccessToken: tokens.access_token,
      spotifyRefreshToken: tokens.refresh_token ?? null,
      spotifyTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      name: profile.display_name ?? null,
      image: profile.images?.[0]?.url ?? null,
    },
  });

  const sessionToken = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  const response = NextResponse.redirect(new URL("/dashboard", base));
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  response.cookies.delete("spotify_oauth_state");

  return response;
}
