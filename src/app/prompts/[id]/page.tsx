import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AddParticipantsForm } from "./_components/AddParticipantsForm";

export default async function PromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) redirect("/");

  const prompt = await prisma.playlistPrompt.findUnique({
    where: { id },
    include: {
      participants: {
        include: { participant: true },
        orderBy: { participant: { email: "asc" } },
      },
      rounds: {
        orderBy: { sentAt: "desc" },
        include: {
          submissions: {
            include: {
              participant: true,
              tracks: { orderBy: { id: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!prompt || prompt.creatorId !== session.user.id) notFound();

  const latestRound = prompt.rounds[0];

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-2xl px-6 py-12 space-y-8">

        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>

        {/* Prompt header */}
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">{prompt.title}</h1>
              {prompt.description && (
                <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">{prompt.description}</p>
              )}
            </div>
            <span className="shrink-0 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500 capitalize">
              {prompt.recurrence.toLowerCase()}
            </span>
          </div>
          {latestRound && (
            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-4 text-sm">
              <span className={`inline-flex items-center gap-1.5 font-medium ${latestRound.status === "ACTIVE" ? "text-green-700" : "text-zinc-400"}`}>
                {latestRound.status === "ACTIVE" ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Active · due {latestRound.deadline.toLocaleDateString()}
                  </>
                ) : "Closed"}
              </span>
              <span className="text-zinc-300">·</span>
              <span className="text-zinc-500">{latestRound.submissions.length} / {prompt.participants.length} submitted</span>
            </div>
          )}
        </div>

        {/* Rounds */}
        {prompt.rounds.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest px-1">Rounds</h2>
            <ul className="space-y-2">
              {prompt.rounds.map((round, i) => (
                <li key={round.id} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-zinc-700">
                        Round {prompt.rounds.length - i}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        Sent {round.sentAt.toLocaleDateString()} · {round.submissions.length} of {prompt.participants.length} submitted
                      </p>
                    </div>
                    {round.spotifyPlaylistId && (
                      <a
                        href={`https://open.spotify.com/playlist/${round.spotifyPlaylistId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1.5 rounded-full bg-[#1DB954] px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        Open playlist
                      </a>
                    )}
                  </div>
                  {round.submissions.length > 0 && (
                    <div className="border-t border-zinc-100 divide-y divide-zinc-100">
                      {round.submissions.map((submission) => (
                        <div key={submission.id} className="px-5 py-3">
                          <p className="text-xs font-medium text-zinc-500 mb-1.5">{submission.participant.email}</p>
                          <ul className="space-y-1">
                            {submission.tracks.map((track) => (
                              <li key={track.id} className="flex items-baseline gap-2 text-sm">
                                <span className="font-medium text-zinc-800">{track.title}</span>
                                <span className="text-zinc-400 text-xs">{track.artist}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Participants */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest px-1">
            Participants · {prompt.participants.length}
          </h2>
          <div className="rounded-2xl border border-zinc-200 bg-white divide-y divide-zinc-100">
            {prompt.participants.map(({ participant }) => (
              <div key={participant.id} className="px-5 py-3">
                <span className="text-sm text-zinc-700">{participant.email}</span>
              </div>
            ))}
            <div className="px-5 py-5">
              <AddParticipantsForm promptId={prompt.id} />
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
