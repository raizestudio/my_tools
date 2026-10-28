// app/[locale]/not-found.tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function NotFoundPage() {
  const tCommon = useTranslations("common");

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 relative isolate">
      {/* Ambient Radial Halo */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-1"
      />

      <div className="card card-border bg-base-100/80 backdrop-blur-md border-base-content/10 max-w-lg w-full p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col items-center text-center gap-6">
        {/* Status Badge */}
        <div className="badge badge-soft badge-error font-mono text-xs font-bold px-3 py-2 gap-1.5 rounded-full border border-error/20">
          <span className="size-1.5 rounded-full bg-error animate-ping" />
          <span>HTTP_404 // ROUTE_NOT_FOUND</span>
        </div>

        {/* Big Code Graphic */}
        <div className="relative">
          <span className="text-7xl sm:text-8xl font-black font-mono tracking-tighter text-base-content/15 select-none">
            0x194
          </span>
          {/*<div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-base-content">
              404
            </span>
          </div>*/}
        </div>

        {/* Message */}
        <div className="flex flex-col gap-2 -mt-2">
          <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
            Terminal Endpoint Missing
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-sm">
            The target URI does not resolve to an active in-memory relay or
            client-side utility. The tool may have been relocated or deprecated.
          </p>
        </div>

        {/* Navigation CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full">
          <Link
            href="/tools"
            className="btn btn-primary btn-sm sm:btn-md gap-2 font-semibold rounded-xl shadow-xs px-5"
          >
            <span className="icon-[lucide--layout-grid] size-4"></span>
            <span>Browse Active Tools</span>
          </Link>

          <Link
            href="/"
            className="btn btn-soft btn-neutral btn-sm sm:btn-md gap-2 font-semibold rounded-xl border border-base-content/10 px-5"
          >
            <span className="icon-[lucide--home] size-4"></span>
            <span>Return to Base</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
