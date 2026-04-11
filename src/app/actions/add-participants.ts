"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addParticipants(promptId: string, emails: string[]) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const prompt = await prisma.playlistPrompt.findUniqueOrThrow({
    where: { id: promptId },
  });
  if (prompt.creatorId !== session.user.id) throw new Error("Forbidden");

  const normalized = emails.map((e) => e.toLowerCase().trim()).filter(Boolean);

  const participants = await Promise.all(
    normalized.map((email) =>
      prisma.participant.upsert({
        where: { email },
        update: {},
        create: { email },
      })
    )
  );

  await Promise.all(
    participants.map((p) =>
      prisma.promptParticipant.upsert({
        where: { promptId_participantId: { promptId, participantId: p.id } },
        update: {},
        create: { promptId, participantId: p.id },
      })
    )
  );

  revalidatePath(`/prompts/${promptId}`);
}
