"use client";

import { useState } from "react";
import { addParticipants } from "@/app/actions/add-participants";

export function AddParticipantsForm({ promptId }: { promptId: string }) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const emails = value.split(/[\s,]+/).filter(Boolean);
    if (emails.length === 0) return;
    setPending(true);
    try {
      await addParticipants(promptId, emails);
      setValue("");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-medium text-zinc-600">Add participants</label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste emails, separated by commas or newlines"
        rows={2}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 resize-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600">Added successfully.</p>}
      <button
        type="submit"
        disabled={pending || !value.trim()}
        className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {pending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
