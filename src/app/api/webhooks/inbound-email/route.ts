import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSpotifyTrackId, getTrack, addTracksToPlaylist } from "@/lib/spotify";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function extractRoundId(toAddress: string): string | null {
  const match = toAddress.match(/playlist-([a-z0-9]+)@/i);
  return match ? match[1] : null;
}

function extractEmail(address: string): string {
  // Handles "Display Name <email@domain.com>" or plain "email@domain.com"
  const match = address.match(/<([^>]+)>/);
  return (match ? match[1] : address).toLowerCase().trim();
}

function extractSpotifyTrackIds(text: string): string[] {
  const urls = text.match(/https?:\/\/[^\s]+|spotify:track:[^\s]+/g) ?? [];
  return urls.map(parseSpotifyTrackId).filter((id): id is string => id !== null);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Resend email.received webhook payload
  const data = body.data ?? {};
  const emailId: string = data.email_id ?? "";
  const toAddresses: string[] = Array.isArray(data.to) ? data.to : [data.to ?? ""];
  const fromRaw: string = data.from ?? "";
  const fromEmail = extractEmail(fromRaw);
  const toAddress = toAddresses[0] ?? "";

  const roundId = extractRoundId(toAddress);
  if (!roundId) return NextResponse.json({ error: "Invalid to address" }, { status: 400 });

  // Fetch full email content from Resend API
  let emailText = "";
  if (emailId) {
    const emailRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    if (emailRes.ok) {
      const emailData = await emailRes.json();
      emailText = emailData.text ?? emailData.html ?? "";
    }
  }

  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { prompt: true },
  });

  if (!round || round.status === "CLOSED") {
    return NextResponse.json({ error: "Round not found or closed" }, { status: 404 });
  }

  const participant = await prisma.participant.findUnique({
    where: { email: fromEmail },
  });

  if (!participant) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }

  const existing = await prisma.submission.findUnique({
    where: { roundId_participantId: { roundId, participantId: participant.id } },
  });
  if (existing) {
    return NextResponse.json({ message: "Already submitted" }, { status: 200 });
  }

  const trackIds = extractSpotifyTrackIds(emailText);
  if (trackIds.length === 0) {
    return NextResponse.json({ error: "No Spotify track links found" }, { status: 400 });
  }

  const creatorId = round.prompt.creatorId;
  const tracks = await Promise.all(trackIds.map((id) => getTrack(creatorId, id)));
  const uris = tracks.map((t) => t.uri);

  if (round.spotifyPlaylistId) {
    await addTracksToPlaylist(creatorId, round.spotifyPlaylistId, uris);
  }

  const submission = await prisma.submission.create({
    data: {
      roundId,
      participantId: participant.id,
      tracks: {
        create: tracks.map((t) => ({
          spotifyTrackId: t.id,
          spotifyUri: t.uri,
          title: t.title,
          artist: t.artist,
          addedToPlaylistAt: round.spotifyPlaylistId ? new Date() : null,
        })),
      },
    },
  });

  const revealNow =
    round.prompt.revealAnchor === "ON_SUBMISSION" ||
    (!round.prompt.requireSubmitToView && round.revealAt <= new Date());

  const playlistUrl = `https://open.spotify.com/playlist/${round.spotifyPlaylistId}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: fromEmail,
    subject: `Got your submission for "${round.prompt.title}"`,
    text: revealNow
      ? `Thanks for adding your songs! Here's the playlist: ${playlistUrl}`
      : `Thanks for adding your songs! You'll get the playlist link on ${round.revealAt.toDateString()}.`,
  });

  return NextResponse.json({ submissionId: submission.id });
}
