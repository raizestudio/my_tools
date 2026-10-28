// app/components/landing/CtaBannerComponent.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AVAILABLE_TOOLS } from "@/app/lib/tools";

interface CtaBannerProps {
  locale: string;
}

export default async function CtaBannerComponent({ locale }: CtaBannerProps) {
  const t = await getTranslations({ locale, namespace: "landing" });
  const toolCount = AVAILABLE_TOOLS.length;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 my-12 md:my-20">
      <div className="relative rounded-3xl border border-primary/25 bg-gradient-to-b from-base-200/90 via-base-100 to-base-200/50 p-8 sm:p-14 lg:p-16 text-center shadow-xl overflow-hidden flex flex-col items-center gap-6">
        {/* 1. Ambient Background Glows */}
        <div className="absolute -top-24 -right-24 size-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        {/* 2. Subtle Background Grid Pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:16px_16px]"
        />

        {/* 3. Top Eyebrow Badge */}
        <div className="badge badge-soft badge-primary font-mono text-xs font-semibold px-3.5 py-2.5 gap-2 rounded-full border border-primary/20 backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          <span>Zero Configuration • Instant Client-Side Execution</span>
        </div>

        {/* 4. Main Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-base-content tracking-tight max-w-3xl leading-[1.15]">
          {t("bannerTitle")}
        </h2>

        {/* 5. Subtitle */}
        <p className="text-sm sm:text-base text-base-content/70 max-w-xl leading-relaxed">
          {t("bannerSub", { count: toolCount })}
        </p>

        {/* 6. Dual Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 z-10">
          <Link
            href={`/${locale}/tools`}
            className="btn btn-primary btn-md gap-2 font-semibold shadow-md shadow-primary/20 px-6 rounded-xl hover:scale-[1.02] transition-transform"
          >
            <span>{t("bannerBtn")}</span>
            <span className="icon-[lucide--arrow-right] size-4"></span>
          </Link>

          <a
            href="https://github.com/raizestudio/zerow"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-soft btn-neutral btn-md gap-2 font-semibold px-6 rounded-xl border border-base-content/10 hover:scale-[1.02] transition-transform"
          >
            <span className="icon-[lucide--github] size-4"></span>
            <span>Star on GitHub</span>
          </a>
        </div>

        {/* 7. Bottom Trust / Guarantee Checklist */}
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-base-content/60 font-mono pt-4 border-t border-base-content/10 w-full max-w-lg z-10">
          <span className="flex items-center gap-1.5">
            <span className="icon-[lucide--check] size-3.5 text-success"></span>
            <span>No sign-up required</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="icon-[lucide--check] size-3.5 text-success"></span>
            <span>Zero telemetry</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="icon-[lucide--check] size-3.5 text-success"></span>
            <span>MIT Open Source</span>
          </span>
        </div>
      </div>
    </section>
  );
}
