// app/components/api-runner/CurlModalComponent.tsx
"use client";

import { useState } from "react";

interface CurlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rawCurl: string) => void;
}

export default function CurlModalComponent({ isOpen, onClose, onImport }: CurlModalProps) {
  const [curlText, setCurlText] = useState("");

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-base-100 rounded-2xl shadow-2xl border border-base-content/10 w-full max-w-xl p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-base-content/10 pb-3">
          <span className="font-bold text-sm text-base-content flex items-center gap-2">
            <span className="icon-[lucide--terminal] size-4 text-primary"></span>
            Import from cURL Command
          </span>
          <button type="button" onClick={onClose} className="btn btn-xs btn-circle btn-ghost">
            ✕
          </button>
        </div>

        <p className="text-xs text-base-content/60">
          Paste any standard cURL command (from Chrome DevTools, Postman, or terminal).
        </p>

        <textarea
          value={curlText}
          onChange={(e) => setCurlText(e.target.value)}
          rows={6}
          placeholder={`curl 'https://api.example.com/v1/upload' \\\n  -X POST \\\n  -H 'Authorization: Bearer key_123' \\\n  -F 'document=@file.pdf'`}
          className="textarea textarea-bordered font-mono text-xs w-full focus:outline-primary"
        />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            disabled={!curlText.trim()}
            onClick={() => {
              onImport(curlText);
              onClose();
              setCurlText("");
            }}
            className="btn btn-sm btn-primary gap-1.5"
          >
            <span className="icon-[lucide--check] size-4"></span>
            <span>Parse & Populate</span>
          </button>
        </div>
      </div>
    </div>
  );
}
