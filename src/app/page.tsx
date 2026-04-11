import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-md space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
              Collective Record
            </h1>
            <p className="text-lg text-zinc-500 leading-relaxed">
              Send a prompt. Friends reply with songs.<br />
              A playlist builds itself.
            </p>
          </div>

          <a
            href="/api/auth/spotify"
            className="inline-block rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white hover:opacity-80 transition-opacity"
          >
            Sign in with Spotify
          </a>

          <div className="pt-4 grid grid-cols-3 gap-6 text-left border-t border-zinc-100">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">1. Create</p>
              <p className="text-sm text-zinc-600">Set a theme and invite friends by email.</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">2. Collect</p>
              <p className="text-sm text-zinc-600">They reply with Spotify links. Songs get added automatically.</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">3. Reveal</p>
              <p className="text-sm text-zinc-600">Everyone gets the playlist at the same time.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
