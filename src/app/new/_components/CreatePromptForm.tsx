"use client";

import { useState, useTransition } from "react";
import { createPrompt, CreatePromptInput } from "@/app/actions/create-prompt";
import { Recurrence, RevealAnchor } from "@prisma/client";

const RECURRENCE_LABELS: Record<Recurrence, string> = {
  ONCE: "Once",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export default function CreatePromptForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("ONCE");
  const [submissionWindowDays, setSubmissionWindowDays] = useState(7);
  const [songsPerPerson, setSongsPerPerson] = useState<string>("");
  const [requireSubmitToView, setRequireSubmitToView] = useState(true);
  const [revealAnchor, setRevealAnchor] = useState<RevealAnchor>("ON_DEADLINE");
  const [revealOffsetDays, setRevealOffsetDays] = useState(0);

  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);

  function addEmail() {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed || emails.includes(trimmed)) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    setEmails((prev) => [...prev, trimmed]);
    setEmailInput("");
  }

  function removeEmail(email: string) {
    setEmails((prev) => prev.filter((e) => e !== email));
  }

  function handleEmailKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Title is required.");
    if (emails.length === 0) return setError("Add at least one participant.");

    const input: CreatePromptInput = {
      title: title.trim(),
      description: description.trim(),
      recurrence,
      submissionWindowDays,
      songsPerPerson: songsPerPerson ? parseInt(songsPerPerson) : null,
      requireSubmitToView,
      revealAnchor,
      revealOffsetHours: revealOffsetDays * 24,
      participantEmails: emails,
    };

    startTransition(async () => {
      try {
        await createPrompt(input);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Details */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Details</h2>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summer road trip vibes"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:ring-0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Description <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Give your friends some context..."
            rows={3}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 resize-none"
          />
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Schedule</h2>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Frequency</label>
          <div className="flex gap-2">
            {(["ONCE", "WEEKLY", "MONTHLY", "YEARLY"] as Recurrence[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRecurrence(r)}
                className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                  recurrence === r
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {RECURRENCE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Submission window</label>
          <div className="flex items-center gap-2.5">
            <input
              type="number"
              min={1}
              max={365}
              value={submissionWindowDays}
              onChange={(e) => setSubmissionWindowDays(parseInt(e.target.value) || 7)}
              className="w-20 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <span className="text-sm text-zinc-500">days to submit after the prompt is sent</span>
          </div>
        </div>
      </div>

      {/* Submissions */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Submissions</h2>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Songs per person <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <div className="flex items-center gap-2.5">
            <input
              type="number"
              min={1}
              value={songsPerPerson}
              onChange={(e) => setSongsPerPerson(e.target.value)}
              placeholder="Any"
              className="w-20 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <span className="text-sm text-zinc-500">leave blank for no limit</span>
          </div>
        </div>
      </div>

      {/* Reveal */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Reveal</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requireSubmitToView}
              onChange={(e) => setRequireSubmitToView(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            />
            <span className="text-sm text-zinc-700">Must submit to receive the playlist link</span>
          </label>

          <div>
            <p className="text-sm font-medium text-zinc-700 mb-2">Send playlist link</p>
            <div className="space-y-2 pl-0.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="revealAnchor"
                  checked={revealAnchor === "ON_SUBMISSION"}
                  onChange={() => { setRevealAnchor("ON_SUBMISSION"); setRevealOffsetDays(0); }}
                  className="mt-0.5 accent-zinc-900"
                />
                <span className="text-sm text-zinc-700">Immediately after someone submits</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="revealAnchor"
                  checked={revealAnchor === "ON_DEADLINE"}
                  onChange={() => setRevealAnchor("ON_DEADLINE")}
                  className="mt-0.5 accent-zinc-900"
                />
                <div className="space-y-2">
                  <span className="text-sm text-zinc-700">Relative to the deadline</span>
                  {revealAnchor === "ON_DEADLINE" && (
                    <div className="flex items-center gap-2">
                      <select
                        value={revealOffsetDays >= 0 ? "after" : "before"}
                        onChange={(e) =>
                          setRevealOffsetDays((d) =>
                            e.target.value === "before" ? -Math.abs(d) : Math.abs(d)
                          )
                        }
                        className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      >
                        <option value="after">After</option>
                        <option value="before">Before</option>
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={Math.abs(revealOffsetDays)}
                        onChange={(e) => {
                          const abs = parseInt(e.target.value) || 0;
                          setRevealOffsetDays(revealOffsetDays < 0 ? -abs : abs);
                        }}
                        className="w-16 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
                      />
                      <span className="text-sm text-zinc-500">days</span>
                      {revealOffsetDays === 0 && (
                        <span className="text-sm text-zinc-400">(on the deadline)</span>
                      )}
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Participants</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={handleEmailKeyDown}
            placeholder="friend@example.com"
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
          />
          <button
            type="button"
            onClick={addEmail}
            className="px-4 py-2 rounded-lg bg-zinc-100 text-sm font-medium text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            Add
          </button>
        </div>
        {emails.length > 0 && (
          <ul className="space-y-1.5">
            {emails.map((email) => (
              <li key={email} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                <span className="text-sm text-zinc-700">{email}</span>
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Create & send"}
      </button>
    </form>
  );
}
