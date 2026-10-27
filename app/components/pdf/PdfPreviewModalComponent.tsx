"use client";

import { useEffect } from "react";

interface PdfPreviewModalProps {
  url: string | null;
  title: string;
  onClose: () => void;
}

export default function PdfPreviewModal({
  url,
  title,
  onClose,
}: PdfPreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (url) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-base-100 rounded-2xl shadow-2xl border border-base-content/10 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-base-content/10 bg-base-200/50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="icon-[lucide--file-text] size-4 text-primary shrink-0"></span>
            <span className="font-bold text-sm text-base-content truncate">
              {title || "PDF Preview"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-xs btn-ghost gap-1.5 text-base-content/70"
            >
              <span className="icon-[lucide--external-link] size-3.5"></span>
              <span className="hidden sm:inline">New Tab</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-xs btn-circle btn-ghost"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="grow w-full bg-base-300/40 relative">
          <iframe
            src={`${url}#toolbar=1&navpanes=0&view=Fit`}
            title="PDF Document Preview"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
