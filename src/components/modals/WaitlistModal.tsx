"use client";

import { createPortal } from "react-dom";
import { useModalA11y } from "@/hooks/useModalA11y";

type WaitlistModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
};

export function WaitlistModal({ open, onClose, onConfirm }: WaitlistModalProps) {
  const dialogRef = useModalA11y<HTMLDivElement>({
    open,
    onClose,
  });

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999] grid place-items-center bg-black/80 px-4 py-8"
      onClick={onClose}
      role="presentation"
      aria-hidden={!open}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-title"
        className="relative w-full max-w-md space-y-4 border border-[var(--qx-primary)] bg-[var(--qx-panel)] p-6 text-center shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-white"
          aria-label="Close"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h3 id="waitlist-title" className="font-display text-2xl uppercase tracking-[0.08em]">
          Sign Up For Join Waitlist
        </h3>

        <div className="mt-8 flex justify-center gap-4">
          <button
            type="button"
            onClick={onConfirm}
            data-autofocus
            className="rounded bg-cyan-500 px-6 py-2 text-sm font-bold uppercase tracking-wider text-black hover:bg-cyan-400"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
