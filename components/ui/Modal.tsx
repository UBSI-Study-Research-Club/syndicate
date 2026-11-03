"use client";

import { useEffect, HTMLAttributes } from "react";

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = "",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative bg-syndicate-surface border border-syndicate-border rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ${className}`}
      >
        {title && (
          <div className="px-6 py-4 border-b border-syndicate-border flex items-center justify-between sticky top-0 bg-syndicate-surface/95 backdrop-blur-sm z-10">
            <h2 className="text-base font-mono font-bold text-syndicate-text tracking-wide">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-syndicate-muted hover:text-syndicate-text transition-colors font-mono text-sm p-1 rounded-sm hover:bg-syndicate-bg cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
