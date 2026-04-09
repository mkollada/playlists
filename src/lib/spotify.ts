import { prisma } from "@/lib/prisma";

const SPOTIFY_API = "https://api.spotify.com/v1";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

async function refreshSpotifyToken(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (!user.spotifyRefreshToken) throw new Error("No Spotify refresh token");

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: user.spotifyRefreshToken,
    }),
  });

  if (!res.ok) throw new Error("Failed to refresh Spotify token");

  const data = await res.json();

  await prisma.user.update({
    where: { id: userId },
    data: {
      spotifyAccessToken: data.access_token,
      spotifyTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token;
}

async function getAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const isExpired =
    !user.spotifyTokenExpiresAt ||
    user.spotifyTokenExpiresAt.getTime() < Date.now() + 60_000; // refresh 1 min early

  if (isExpired) return refreshSpotifyToken(userId);
  return user.spotifyAccessToken!;
}

export async function createSpotifyPlaylist(
  userId: string,
  name: string,
  description?: string
): Promise<string> {
  const token = await getAccessToken(userId);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const res = await fetch(`${SPOTIFY_API}/users/${user.spotifyId}/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description, public: false }),
  });

  if (!res.ok) throw new Error("Failed to create Spotify playlist");
  const data = await res.json();
  return data.id;
}

export async function addTracksToPlaylist(
  userId: string,
  playlistId: string,
  uris: string[]
): Promise<void> {
  const token = await getAccessToken(userId);

  // Spotify allows max 100 tracks per request
  for (let i = 0; i < uris.length; i += 100) {
    const batch = uris.slice(i, i + 100);
    const res = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: batch }),
    });
    if (!res.ok) throw new Error("Failed to add tracks to Spotify playlist");
  }
}

export async function getTrack(
  userId: string,
  trackId: string
): Promise<{ id: string; uri: string; title: string; artist: string }> {
  const token = await getAccessToken(userId);

  const res = await fetch(`${SPOTIFY_API}/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Failed to fetch track ${trackId}`);
  const data = await res.json();

  return {
    id: data.id,
    uri: data.uri,
    title: data.name,
    artist: data.artists.map((a: { name: string }) => a.name).join(", "),
  };
}

export function parseSpotifyTrackId(url: string): string | null {
  // Handles:
  // https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
  // spotify:track:4iV5W9uYEdYUVa79Axb7Rh
  const urlMatch = url.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  const uriMatch = url.match(/spotify:track:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  return null;
}
