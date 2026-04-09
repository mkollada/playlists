import { NextResponse } from "next/server";
import crypto from "crypto";

const SCOPES = [
  "user-read-email",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: `${process.env.AUTH_URL}/api/auth/spotify/callback`,
    scope: SCOPES,
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params}`
  );

  response.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
