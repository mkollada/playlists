import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreatePromptForm from "./_components/CreatePromptForm";

export default async function NewPromptPage() {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-xl px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900">New playlist prompt</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Set a theme, invite your friends, and we&apos;ll handle the rest.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-8">
          <CreatePromptForm />
        </div>
      </div>
    </main>
  );
}
