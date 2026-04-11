import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/actions/sign-out";

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
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">
              {session.user.name ? `Hey, ${session.user.name.split(" ")[0]}` : "Your prompts"}
            </h1>
            {session.user.name && (
              <p className="text-sm text-zinc-400 mt-0.5">Your playlist prompts</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <form action={signOut}>
              <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
                Sign out
              </button>
            </form>
            <Link
              href="/new"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-80 transition-opacity"
            >
              + New prompt
            </Link>
          </div>
        </div>

        {prompts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-8 py-20 text-center">
            <p className="text-zinc-500">No prompts yet.</p>
            <Link
              href="/new"
              className="mt-3 inline-block text-sm font-medium text-zinc-900 underline underline-offset-4"
            >
              Create your first one
            </Link>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {prompts.map((prompt) => {
              const round = prompt.rounds[0];
              const isActive = round?.status === "ACTIVE";
              return (
                <li key={prompt.id}>
                  <Link
                    href={`/prompts/${prompt.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4 hover:border-zinc-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-medium text-zinc-900 truncate">{prompt.title}</span>
                        {isActive && (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Active
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                        <span>{prompt._count.participants} participant{prompt._count.participants !== 1 ? "s" : ""}</span>
                        {round && (
                          <>
                            <span>·</span>
                            <span>{round._count.submissions} / {prompt._count.participants} submitted</span>
                            {isActive && (
                              <>
                                <span>·</span>
                                <span>Due {round.deadline.toLocaleDateString()}</span>
                              </>
                            )}
                          </>
                        )}
                        <span>·</span>
                        <span className="capitalize">{prompt.recurrence.toLowerCase()}</span>
                      </div>
                    </div>
                    <svg className="h-4 w-4 shrink-0 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
