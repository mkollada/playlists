import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="mx-auto max-w-sm px-6 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900">Playlists</h1>
          <p className="text-zinc-500">
            Create collaborative music playlists with your friends via email.
          </p>
        </div>
        <a
          href="/api/auth/spotify"
          className="block w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white text-center hover:opacity-80 transition-opacity"
        >
          Sign in with Spotify
        </a>
      </div>
    </main>
  );
}
