import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/");

  const prompts = await prisma.playlistPrompt.findMany({
    where: { creatorId: session.user.id },
    include: {
      rounds: {
        orderBy: { sentAt: "desc" },
        take: 1,
        include: {
          _count: { select: { submissions: true } },
        },
      },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">Your prompts</h1>
          <Link
            href="/new"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-80 transition-opacity"
          >
            New prompt
          </Link>
        </div>

        {prompts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 px-6 py-16 text-center">
            <p className="text-sm text-zinc-500">No prompts yet.</p>
            <Link href="/new" className="mt-3 inline-block text-sm font-medium text-zinc-900 underline underline-offset-2">
              Create your first one
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {prompts.map((prompt) => {
              const latestRound = prompt.rounds[0];
              return (
                <li key={prompt.id} className="rounded-xl border border-zinc-100 px-5 py-4 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-zinc-900">{prompt.title}</p>
                      {prompt.description && (
                        <p className="text-sm text-zinc-500 mt-0.5 line-clamp-1">{prompt.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400 capitalize">
                      {prompt.recurrence.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 pt-1 text-xs text-zinc-400">
                    <span>{prompt._count.participants} participant{prompt._count.participants !== 1 ? "s" : ""}</span>
                    {latestRound && (
                      <>
                        <span>·</span>
                        <span>
                          {latestRound._count.submissions} / {prompt._count.participants} submitted
                        </span>
                        <span>·</span>
                        <span className={latestRound.status === "CLOSED" ? "text-zinc-300" : "text-green-600"}>
                          {latestRound.status === "CLOSED" ? "Closed" : `Due ${latestRound.deadline.toLocaleDateString()}`}
                        </span>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
