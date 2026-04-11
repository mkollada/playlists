import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSpotifyPlaylist } from "@/lib/spotify";
import { Resend } from "resend";
import { Client } from "@upstash/qstash";

const resend = new Resend(process.env.RESEND_API_KEY);
const qstash = new Client({ token: process.env.QSTASH_TOKEN!, baseUrl: process.env.QSTASH_URL! });

const RECURRENCE_MS: Record<string, number> = {
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
  YEARLY: 365 * 24 * 60 * 60 * 1000,
};

export async function POST(req: NextRequest) {
  const { promptId } = await req.json();

  const prompt = await prisma.playlistPrompt.findUniqueOrThrow({
    where: { id: promptId },
    include: {
      participants: { include: { participant: true } },
      creator: true,
    },
  });

  const now = new Date();
  const deadline = new Date(now.getTime() + prompt.submissionWindowDays * 24 * 60 * 60 * 1000);

  let revealAt: Date;
  if (prompt.revealAnchor === "ON_SUBMISSION") {
    revealAt = new Date(now.getTime() + prompt.revealOffsetHours * 60 * 60 * 1000);
  } else {
    revealAt = new Date(deadline.getTime() + prompt.revealOffsetHours * 60 * 60 * 1000);
  }

  const spotifyPlaylistId = await createSpotifyPlaylist(
    prompt.creatorId,
    prompt.title,
    prompt.description ?? undefined
  );

  const round = await prisma.round.create({
    data: {
      promptId,
      spotifyPlaylistId,
      sentAt: now,
      deadline,
      revealAt,
    },
  });

  const replyTo = `playlist-${round.id}@${process.env.REPLY_DOMAIN}`;

  await Promise.all(
    prompt.participants.map(({ participant }) =>
      resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: participant.email,
        replyTo,
        subject: `🎵 Add your songs: ${prompt.title}`,
        text: [
          prompt.title,
          prompt.description ? `\n${prompt.description}` : null,
          "",
          "─────────────────────────",
          "",
          `It's time to add your songs to the "${prompt.title}" playlist!`,
          "",
          `Just reply to this email with your Spotify song links${prompt.songsPerPerson ? ` (we're looking for ${prompt.songsPerPerson} song${prompt.songsPerPerson !== 1 ? "s" : ""} from each person)` : ""} and we'll add them to the playlist automatically.`,
          "",
          "How to get a Spotify link:",
          "  1. Find a song in Spotify",
          "  2. Right-click the song (or tap the three dots on mobile)",
          "  3. Share → Copy Song Link",
          "  4. Paste the link in your reply",
          "",
          `Deadline: ${deadline.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
          "",
          "─────────────────────────",
          "Collective Record",
        ]
          .filter((l) => l !== null)
          .join("\n"),
      })
    )
  );

  // Only schedule reveal job for deadline-based reveals.
  // ON_SUBMISSION reveals are handled directly in the inbound webhook.
  if (prompt.revealAnchor === "ON_DEADLINE") {
    await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/reveal-playlist`,
      body: { roundId: round.id },
      notBefore: Math.floor(revealAt.getTime() / 1000),
    });
  }

  if (prompt.recurrence !== "ONCE") {
    const nextSendAt = new Date(now.getTime() + RECURRENCE_MS[prompt.recurrence]);
    await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/send-round`,
      body: { promptId },
      notBefore: Math.floor(nextSendAt.getTime() / 1000),
    });
  }

  return NextResponse.json({ roundId: round.id });
}
