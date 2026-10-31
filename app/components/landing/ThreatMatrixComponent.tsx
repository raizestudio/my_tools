// app/components/landing/ThreatMatrixComponent.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ThreatMatrixComponent() {
  const t = useTranslations("landing");
  const [mobileTab, setMobileTab] = useState<"legacy" | "zerow">("zerow");

  const rows = [
    { id: "01", bad: t("m1Bad"), good: t("m1Good") },
    { id: "02", bad: t("m2Bad"), good: t("m2Good") },
    { id: "03", bad: t("m3Bad"), good: t("m3Good") },
    { id: "04", bad: t("m4Bad"), good: t("m4Good") },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 my-4 md:my-6 flex flex-col gap-8 relative">
      <div className="absolute top-1/2 right-10 -translate-y-1/2 size-96 bg-success/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto">
        <div className="badge badge-soft badge-warning font-mono text-xs font-semibold px-3 py-2 gap-1.5 rounded-full">
          <span className="icon-[lucide--shield-alert] size-3.5 text-warning"></span>
          <span>Security & Threat Model</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-base-content tracking-tight">
          {t("matrixTitle")}
        </h2>
        <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
          {t("matrixSub")}
        </p>
      </div>

      {/* Mobile Segmented Toggle (Hidden on Desktop) */}
      <div className="flex md:hidden justify-center">
        <div className="join gap-2 bg-base-200/80 p-1 rounded-2xl border border-base-content/10 w-full max-w-sm">
          <button
            type="button"
            onClick={() => setMobileTab("legacy")}
            className={`btn btn-sm join-item flex-1 rounded-xl font-mono text-xs gap-1.5 ${
              mobileTab === "legacy"
                ? "btn-error font-bold shadow-xs"
                : "btn-ghost text-base-content/60"
            }`}
          >
            <span className="icon-[lucide--x-circle] size-4"></span>
            <span>Legacy Tools</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("zerow")}
            className={`btn btn-sm join-item flex-1 rounded-xl font-mono text-xs gap-1.5 ${
              mobileTab === "zerow"
                ? "btn-success font-bold shadow-xs"
                : "btn-ghost text-base-content/60"
            }`}
          >
            <span className="icon-[lucide--shield-check] size-4"></span>
            <span>0w Protocol</span>
          </button>
        </div>
      </div>

      {/* Desktop Column Headers */}
      <div className="hidden md:grid md:grid-cols-2 gap-6 items-center px-2">
        <div className="flex items-center justify-between pb-2 border-b border-error/20">
          <div className="flex items-center gap-2">
            <span className="icon-[lucide--x-circle] size-5 text-error"></span>
            <span className="font-bold text-sm text-base-content/80 uppercase tracking-wider font-mono">
              {t("colOther")}
            </span>
          </div>
          <span className="badge badge-xs badge-soft badge-error font-mono whitespace-nowrap">Legacy Model</span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-success/30">
          <div className="flex items-center gap-2">
            <span className="icon-[lucide--shield-check] size-5 text-success"></span>
            <span className="font-bold text-sm text-base-content uppercase tracking-wider font-mono">
              {t("colZeroW")}
            </span>
          </div>
          <span className="badge badge-xs badge-soft badge-success font-mono font-bold whitespace-nowrap">0w Protocol</span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Bad Card (Visible on desktop OR when mobileTab === 'legacy') */}
            <div
              className={`card card-border bg-base-200/30 border-error/15 p-4 sm:p-5 rounded-2xl items-start gap-3.5 transition-colors ${
                mobileTab === "legacy" ? "flex" : "hidden md:flex"
              }`}
            >
              <div className="size-7 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0 mt-0.5">
                <span className="icon-[lucide--x] size-4"></span>
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[10px] font-mono text-error/70 md:hidden">#{row.id} • Legacy Risk</span>
                <p className="text-xs sm:text-sm text-base-content/75 leading-relaxed">{row.bad}</p>
              </div>
            </div>

            {/* Good Card (Visible on desktop OR when mobileTab === 'zerow') */}
            <div
              className={`card card-border bg-base-200/40 border-success/20 p-4 sm:p-5 rounded-2xl items-start gap-3.5 transition-all shadow-xs ${
                mobileTab === "zerow" ? "flex" : "hidden md:flex"
              }`}
            >
              <div className="size-7 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0 mt-0.5">
                <span className="icon-[lucide--check] size-4"></span>
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[10px] font-mono text-success md:hidden">#{row.id} • 0w Standard</span>
                <p className="text-xs sm:text-sm text-base-content font-medium leading-relaxed">{row.good}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
