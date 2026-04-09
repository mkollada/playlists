import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { roundId } = await req.json();

  const round = await prisma.round.findUniqueOrThrow({
    where: { id: roundId },
    include: {
      prompt: {
        include: {
          participants: { include: { participant: true } },
        },
      },
      submissions: { select: { participantId: true } },
    },
  });

  if (round.status === "CLOSED") {
    return NextResponse.json({ message: "Already closed" });
  }

  const submittedIds = new Set(round.submissions.map((s) => s.participantId));
  const playlistUrl = `https://open.spotify.com/playlist/${round.spotifyPlaylistId}`;

  const recipients = round.prompt.participants
    .map(({ participant }) => participant)
    .filter((p) => !round.prompt.requireSubmitToView || submittedIds.has(p.id));

  await Promise.all(
    recipients.map((participant) =>
      resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: participant.email,
        subject: `Playlist ready: ${round.prompt.title}`,
        text: `The playlist is ready! Listen here: ${playlistUrl}`,
      })
    )
  );

  await prisma.round.update({
    where: { id: roundId },
    data: { status: "CLOSED" },
  });

  return NextResponse.json({ sent: recipients.length });
}
