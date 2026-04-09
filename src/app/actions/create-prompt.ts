"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Client } from "@upstash/qstash";
import { redirect } from "next/navigation";
import { Recurrence, RevealAnchor } from "@prisma/client";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export type CreatePromptInput = {
  title: string;
  description: string;
  recurrence: Recurrence;
  submissionWindowDays: number;
  songsPerPerson: number | null;
  requireSubmitToView: boolean;
  revealAnchor: RevealAnchor;
  revealOffsetHours: number;
  participantEmails: string[];
};

export async function createPrompt(input: CreatePromptInput) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const participants = await Promise.all(
    input.participantEmails.map((email) =>
      prisma.participant.upsert({
        where: { email: email.toLowerCase() },
        update: {},
        create: { email: email.toLowerCase() },
      })
    )
  );

  const prompt = await prisma.playlistPrompt.create({
    data: {
      creatorId: session.user.id,
      title: input.title,
      description: input.description || null,
      recurrence: input.recurrence,
      submissionWindowDays: input.submissionWindowDays,
      songsPerPerson: input.songsPerPerson,
      requireSubmitToView: input.requireSubmitToView,
      revealAnchor: input.revealAnchor,
      revealOffsetHours: input.revealOffsetHours,
      participants: {
        create: participants.map((p) => ({ participantId: p.id })),
      },
    },
  });

  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/send-round`,
    body: { promptId: prompt.id },
  });

  redirect("/dashboard");
}
