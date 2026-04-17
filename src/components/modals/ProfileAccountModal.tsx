"use client";

import Link from "next/link";
import { createPortal } from "react-dom";

import { useModalA11y } from "@/hooks/useModalA11y";

type ProfileAccountModalProps = {
  open: boolean;
  email: string;
  initials: string;
  displayName: string;
  signOutPending?: boolean;
  statusMessage?: string;
  onCloseAction: () => void;
  onManageAccountAction: () => void;
  onAddAccountAction: () => void;
  onSignOutAction: () => void;
};

export function ProfileAccountModal({
  open,
  email,
  initials,
  displayName,
  signOutPending = false,
  statusMessage,
  onCloseAction,
  onManageAccountAction,
  onAddAccountAction,
  onSignOutAction,
}: ProfileAccountModalProps) {
  const dialogRef = useModalA11y<HTMLDivElement>({
    open,
    onClose: onCloseAction,
  });

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999] overflow-y-auto bg-black/80 px-4 py-8"
      onClick={onCloseAction}
      role="presentation"
      aria-hidden={!open}
    >
      <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-account-title"
          tabIndex={-1}
          className="w-full max-w-[640px] rounded-[32px] border border-white/10 bg-gradient-to-b from-[#2a2f37] to-[#1d2128] p-6 shadow-[0_30px_110px_rgba(0,0,0,0.65)] sm:p-8"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-3">
            <p id="profile-account-title" className="max-w-[82%] truncate text-base font-medium tracking-[0.01em] text-slate-200">
              {email}
            </p>
            <button
              type="button"
              onClick={onCloseAction}
              disabled={signOutPending}
              data-autofocus
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-slate-300 transition hover:border-[var(--qx-primary)] hover:text-white"
              aria-label="Close profile panel"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M18.3 5.71 12 12.01l-6.29-6.3-1.42 1.42 6.3 6.29-6.3 6.29 1.42 1.42 6.29-6.3 6.29 6.3 1.42-1.42-6.3-6.29 6.3-6.29z" />
              </svg>
            </button>
          </header>

          <div className="mt-7 flex flex-col items-center text-center">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-[conic-gradient(from_40deg,#f97316,#ef4444,#3b82f6,#22c55e,#f97316)] p-[3px]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#3b2e3b] text-4xl font-semibold uppercase tracking-[0.04em] text-slate-100">
                  {initials}
                </div>
              </div>
              <span className="absolute bottom-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-slate-200">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M9 2 7.17 4H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2H9zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                </svg>
              </span>
            </div>

            <h3 className="mt-5 text-5xl font-semibold tracking-tight text-slate-100">Hi, {displayName}!</h3>

            <button
              type="button"
              onClick={onManageAccountAction}
              disabled={signOutPending}
              className="mt-6 w-full max-w-md rounded-full border border-slate-500/70 bg-slate-700/20 px-7 py-3 text-lg font-medium text-sky-200 transition hover:border-[var(--qx-primary)] hover:bg-slate-700/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Manage your Qexur account
            </button>
          </div>

          <div className="mt-7 rounded-[26px] border border-white/10 bg-black/35 p-3">
            <button
              type="button"
              onClick={onAddAccountAction}
              disabled={signOutPending}
              className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-xl font-medium text-slate-100 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-700/60 text-slate-100">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                  <path d="M19 11H13V5h-2v6H5v2h6v6h2v-6h6z" />
                </svg>
              </span>
              <span>Add account</span>
            </button>

            <button
              type="button"
              onClick={onSignOutAction}
              disabled={signOutPending}
              className="mt-2 flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-xl font-medium text-slate-100 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-700/60 text-slate-100">
                {signOutPending ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-100 border-t-transparent" aria-hidden="true" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                    <path d="M10 17v-3H3v-4h7V7l5 5-5 5zm8-12h-6v2h6v10h-6v2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
                  </svg>
                )}
              </span>
              <span>{signOutPending ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>

          {statusMessage && (
            <p role="alert" className="mt-4 rounded-2xl border border-rose-400/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {statusMessage}
            </p>
          )}

          <div className="mt-6 flex items-center justify-center gap-3 text-sm font-medium text-slate-300/90">
            <Link href="/privacy-policy" className="transition hover:text-[var(--qx-primary)]">
              Privacy Policy
            </Link>
            <span aria-hidden="true">•</span>
            <Link href="/terms-and-conditions" className="transition hover:text-[var(--qx-primary)]">
              Terms of Service
            </Link>
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
}
