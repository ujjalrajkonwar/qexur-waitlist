"use client";

import { useEffect, useRef } from "react";

type UseModalA11yOptions = {
  open: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
};

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const focusable = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );

  return Array.from(focusable).filter((element) => {
    if (element.hasAttribute("disabled")) {
      return false;
    }

    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}

export function useModalA11y<T extends HTMLElement>({
  open,
  onClose,
  closeOnEscape = true,
}: UseModalA11yOptions) {
  const dialogRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frameId = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const [firstFocusable] = getFocusableElements(dialog);

      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        dialog.focus();
      }
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && closeOnEscape) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const focusableElements = getFocusableElements(dialog);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.cancelAnimationFrame(frameId);
      document.body.style.overflow = previousOverflow;
      previousActiveElement.current?.focus();
    };
  }, [open, onClose, closeOnEscape]);

  return dialogRef;
}
