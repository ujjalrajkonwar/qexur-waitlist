"use client";

import { useMemo, useState } from "react";

import {
  getEntryPointsByIds,
  searchEntryPoints,
} from "@/lib/config/entry-points";

type CustomAttackVectorSelectorProps = {
  selectedEntryPointIds: string[];
  onSelectionChange: (entryPointIds: string[]) => void;
  onInitiateAttack: () => void;
  disabled: boolean;
  pending?: boolean;
  canInitiate: boolean;
  showInitiateButton?: boolean;
};

export function CustomAttackVectorSelector({
  selectedEntryPointIds,
  onSelectionChange,
  onInitiateAttack,
  disabled,
  pending = false,
  canInitiate,
  showInitiateButton = true,
}: CustomAttackVectorSelectorProps) {
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(selectedEntryPointIds), [selectedEntryPointIds]);
  const selectedEntryPoints = useMemo(() => getEntryPointsByIds(selectedEntryPointIds), [selectedEntryPointIds]);
  const searchResults = useMemo(() => query.trim() ? searchEntryPoints(query).slice(0, 8) : [], [query]);

  function handleSelect(entryPointId: string) {
    if (disabled || selectedSet.has(entryPointId)) {
      return;
    }

    onSelectionChange([...selectedEntryPointIds, entryPointId]);
  }

  function handleRemove(entryPointId: string) {
    if (disabled) {
      return;
    }

    onSelectionChange(selectedEntryPointIds.filter((id) => id !== entryPointId));
  }

  return (
    <section className="space-y-4 rounded-xl border border-[var(--qx-border)] bg-black/30 p-5">
      <header className="space-y-2">
        <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--qx-muted)]">Custom Attack Vector Selector</h3>
        <p className="text-xs text-[var(--qx-muted)]">
          Select specific entry points for a refined attack run. Vector selection is locked until DNS verification is complete.
        </p>
      </header>

      <input
        type="search"
        value={query}
        disabled={disabled}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Specific Entry Points/Vectors by ID or Name (e.g., EP-SQLi-001)"
        className="w-full rounded-xl border border-[var(--qx-border)] bg-black/35 px-4 py-3 text-sm text-[var(--qx-text)] outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:border-amber-300/50 disabled:text-slate-500"
      />

      {/* Chat-like box for selected items */}
      <div className="min-h-32 max-h-72 space-y-3 overflow-auto rounded-xl border border-[var(--qx-border)] bg-black/35 p-3">
        {selectedEntryPoints.length === 0 ? (
          <p className="text-xs text-[var(--qx-muted)]">No custom vectors added yet. Search and add vectors above.</p>
        ) : (
          selectedEntryPoints.map((entryPoint) => (
            <div
              key={`selected-${entryPoint.id}`}
              className="flex w-fit max-w-[90%] items-center gap-3 rounded-lg border border-cyan-500/35 bg-cyan-500/5 p-3"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">
                  {entryPoint.id}
                </p>
                <p className="text-xs text-slate-300">{entryPoint.label}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(entryPoint.id)}
                className="text-slate-500 transition hover:text-red-400"
                title="Remove Vector"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {query.trim().length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--qx-muted)]">Search Results</p>
          <div className="space-y-2">
            {searchResults.map((entryPoint) => {
              const alreadySelected = selectedSet.has(entryPoint.id);

              return (
                <div
                  key={entryPoint.id}
                  className={[
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition",
                    disabled
                      ? "border-amber-300/50 bg-amber-400/10 text-amber-100 opacity-50"
                      : alreadySelected
                        ? "border-cyan-300/70 bg-cyan-500/10 text-cyan-100"
                        : "border-slate-700 bg-slate-950/70",
                  ].join(" ")}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em]">{entryPoint.id}</p>
                    <p className="mt-1 text-xs text-[var(--qx-muted)]">{entryPoint.label}</p>
                  </div>
                  {!alreadySelected && !disabled && (
                    <button
                      type="button"
                      onClick={() => handleSelect(entryPoint.id)}
                      className="rounded border border-cyan-400/60 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/20"
                    >
                      Add
                    </button>
                  )}
                  {alreadySelected && (
                    <span className="text-[10px] uppercase tracking-wide text-cyan-400">Added</span>
                  )}
                </div>
              );
            })}

            {searchResults.length === 0 && (
              <div className="rounded-lg border border-[var(--qx-border)] bg-slate-950/60 p-3 text-xs text-[var(--qx-muted)]">
                No vectors matched your search query.
              </div>
            )}
          </div>
        </div>
      )}

      {showInitiateButton && (
        <button
          type="button"
          disabled={!canInitiate || disabled || pending}
          onClick={onInitiateAttack}
          className={[
            "rounded-xl border-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition",
            !canInitiate || disabled || pending
              ? "cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-400"
              : "border-cyan-400 bg-cyan-500 text-black shadow-[0_0_22px_rgba(6,182,212,0.25)] hover:bg-cyan-400",
          ].join(" ")}
        >
          {pending ? "Dispatching..." : "Initiate Refined Attack"}
        </button>
      )}
    </section>
  );
}
