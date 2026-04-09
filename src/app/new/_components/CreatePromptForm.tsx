"use client";

import { useState, useTransition } from "react";
import { createPrompt, CreatePromptInput } from "@/app/actions/create-prompt";
import { Recurrence, RevealAnchor } from "@prisma/client";

export default function CreatePromptForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("ONCE");
  const [submissionWindowDays, setSubmissionWindowDays] = useState(7);
  const [songsPerPerson, setSongsPerPerson] = useState<string>("");
  const [requireSubmitToView, setRequireSubmitToView] = useState(true);
  const [revealAnchor, setRevealAnchor] = useState<RevealAnchor>("ON_DEADLINE");
  const [revealOffsetDays, setRevealOffsetDays] = useState(0);

  // Participants
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
    <form onSubmit={handleSubmit} className="space-y-10">

      {/* Details */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Details</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summer road trip vibes"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Description <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add some context for your friends..."
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 resize-none"
            />
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Schedule</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Frequency</label>
            <div className="flex gap-2 flex-wrap">
              {(["ONCE", "WEEKLY", "MONTHLY", "YEARLY"] as Recurrence[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRecurrence(r)}
                  className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                    recurrence === r
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Days to submit
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={365}
                value={submissionWindowDays}
                onChange={(e) => setSubmissionWindowDays(parseInt(e.target.value) || 7)}
                className="w-20 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
              <span className="text-sm text-zinc-500">days to add songs after the prompt is sent</span>
            </div>
          </div>
        </div>
      </section>

      {/* Submissions */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Submissions</h2>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Songs per person <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-3">
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
      </section>

      {/* Reveal */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Playlist reveal</h2>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requireSubmitToView}
                onChange={(e) => setRequireSubmitToView(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              />
              <span className="text-sm text-zinc-700">Require submission to receive playlist link</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Send playlist link</label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="revealAnchor"
                  checked={revealAnchor === "ON_SUBMISSION"}
                  onChange={() => {
                    setRevealAnchor("ON_SUBMISSION");
                    setRevealOffsetDays(0);
                  }}
                  className="mt-0.5 accent-zinc-900"
                />
                <span className="text-sm text-zinc-700">As soon as someone submits</span>
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
                        <span className="text-sm text-zinc-400">(at the deadline)</span>
                      )}
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Participants */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Participants</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              placeholder="friend@example.com"
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
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
            <ul className="space-y-2">
              {emails.map((email) => (
                <li key={email} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
                  <span className="text-sm text-zinc-700">{email}</span>
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="text-zinc-400 hover:text-zinc-700 text-xs"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Create & send playlist prompt"}
      </button>
    </form>
  );
}
