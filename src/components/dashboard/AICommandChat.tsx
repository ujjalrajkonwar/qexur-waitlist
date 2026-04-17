"use client";

import { useMemo, useState, type FormEvent } from "react";

import {
  interpretOwnerCommand,
} from "@/lib/config/entry-points";
import type { DestroyerAttackLayer } from "@/types/qexur";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  entryPointIds?: string[];
  attackLayer?: DestroyerAttackLayer;
};

export type InterpreterResolution = {
  command: string;
  attackLayer: DestroyerAttackLayer;
  entryPointIds: string[];
  rationale: string;
};

type AICommandChatProps = {
  onResolutionAction: (resolution: InterpreterResolution) => void;
  disabled?: boolean;
};

function layerLabel(layer: DestroyerAttackLayer): string {
  if (layer === "super-destroyer") {
    return "Super Destroyer";
  }

  if (layer === "destroyer") {
    return "Destroyer";
  }

  return "Surface";
}

function buildAssistantMessage(resolution: InterpreterResolution): string {
  return `Interpreter mapped this request to ${layerLabel(resolution.attackLayer)} and prepared IDs for audit scope and fix planning.`;
}

export function AICommandChat({ onResolutionAction, disabled = false }: AICommandChatProps) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const canSubmit = useMemo(() => prompt.trim().length > 0 && !disabled, [prompt, disabled]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = prompt.trim();

    if (!trimmed || disabled) {
      return;
    }

    const interpretation = interpretOwnerCommand(trimmed);
    const resolution: InterpreterResolution = {
      command: trimmed,
      attackLayer: interpretation.attackLayer,
      entryPointIds: interpretation.entryPointIds,
      rationale: interpretation.rationale,
    };
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      text: buildAssistantMessage(resolution),
      entryPointIds: resolution.entryPointIds,
      attackLayer: resolution.attackLayer,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setPrompt("");
    onResolutionAction(resolution);
  }

  return (
    <div className="space-y-4">
      {messages.length > 0 && (
        <div className="min-h-[120px] max-h-[350px] space-y-3 overflow-auto rounded-xl border border-[var(--qx-border)] bg-black/35 p-4">
          {messages.map((message) => (
            <article
              key={message.id}
            className={[
              "space-y-2 rounded-lg border p-3",
              message.role === "assistant"
                ? "border-cyan-500/35 bg-cyan-500/5"
                : "border-slate-700 bg-slate-900/40",
            ].join(" ")}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--qx-muted)]">
              {message.role === "assistant" ? "Interpreter" : "Owner"}
            </p>
            <p className="text-sm text-slate-200">{message.text}</p>

            {message.attackLayer && (
              <p className="text-xs uppercase tracking-[0.12em] text-cyan-200">Layer: {layerLabel(message.attackLayer)}</p>
            )}

            {message.entryPointIds && message.entryPointIds.length > 0 && (
              <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">
                  Entry Point IDs: {message.entryPointIds.join(", ")}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={10}
          placeholder="Example: Map checkout flow object ownership and IDOR for fix planning"
          className="w-full rounded-xl border border-[var(--qx-border)] bg-black/35 px-4 py-3 text-sm text-[var(--qx-text)] outline-none transition focus:border-cyan-400"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className={[
            "rounded-xl border-2 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
            canSubmit
              ? "border-cyan-400 bg-cyan-500 text-black shadow-[0_0_18px_rgba(6,182,212,0.25)] hover:bg-cyan-400"
              : "cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-400",
          ].join(" ")}
        >
          Interpret Command
        </button>
      </form>
    </div>
  );
}
