// app/[locale]/error.tsx
"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/routing";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log exception to local telemetry / debugging layer
    console.error("[0w runtime failure]:", error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 relative isolate">
      {/* Ambient Red Alert Halo */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-error/10 rounded-full blur-3xl pointer-events-none -z-1"
      />

      <div className="card card-border bg-base-100/90 backdrop-blur-md border-error/30 max-w-lg w-full p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col items-center text-center gap-6">
        {/* Status Badge */}
        <div className="badge badge-soft badge-error font-mono text-xs font-bold px-3 py-2 gap-1.5 rounded-full border border-error/30">
          <span className="icon-[lucide--shield-alert] size-3.5 text-error"></span>
          <span>HTTP_500 // RUNTIME_PANIC</span>
        </div>

        {/* Panic Icon */}
        <div className="size-16 rounded-2xl bg-error/10 text-error flex items-center justify-center shadow-xs">
          <span className="icon-[lucide--terminal] size-8"></span>
        </div>

        {/* Message */}
        <div className="flex flex-col gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
            Execution Routine Interrupted
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-sm">
            An unhandled runtime state occurred during processing. Client memory
            has been isolated to prevent cascade faults.
          </p>
        </div>

        {/* Error Digest (Safe diagnostic reference) */}
        {error.digest && (
          <div className="w-full bg-base-200/60 border border-base-content/10 rounded-xl px-3 py-2 text-start font-mono text-[11px] text-base-content/60 flex items-center justify-between">
            <span className="text-base-content/40">Fault Digest:</span>
            <span className="truncate max-w-[200px] text-error font-semibold">
              {error.digest}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full">
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-primary btn-sm sm:btn-md gap-2 font-semibold rounded-xl shadow-xs px-5"
          >
            <span className="icon-[lucide--rotate-ccw] size-4"></span>
            <span>Re-execute Routine</span>
          </button>

          <Link
            href="/"
            className="btn btn-soft btn-neutral btn-sm sm:btn-md gap-2 font-semibold rounded-xl border border-base-content/10 px-5"
          >
            <span className="icon-[lucide--home] size-4"></span>
            <span>Return to Console</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
