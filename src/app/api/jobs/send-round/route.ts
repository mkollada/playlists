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
        subject: `Time to add songs: ${prompt.title}`,
        text: [
          prompt.description,
          "",
          `Reply to this email with Spotify track links${prompt.songsPerPerson ? ` (${prompt.songsPerPerson} songs please)` : ""}.`,
          "",
          `Deadline: ${deadline.toDateString()}`,
        ]
          .filter((l) => l !== undefined)
          .join("\n"),
      })
    )
  );

  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/reveal-playlist`,
    body: { roundId: round.id },
    notBefore: Math.floor(revealAt.getTime() / 1000),
  });

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
