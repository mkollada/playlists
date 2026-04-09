import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import CreatePromptForm from "./_components/CreatePromptForm";

export default async function NewPromptPage() {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-zinc-900">New playlist prompt</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Fill in the details and we&apos;ll email your friends to add songs.
          </p>
        </div>
        <CreatePromptForm />
      </div>
    </main>
  );
}
