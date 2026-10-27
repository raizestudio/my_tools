// app/components/landing/HeroSectionComponent.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AVAILABLE_TOOLS } from "@/app/lib/tools";

interface HeroSectionProps {
  locale: string;
}

export default async function HeroSectionComponent({
  locale,
}: HeroSectionProps) {
  const t = await getTranslations({ locale, namespace: "landing" });
  const toolCount = AVAILABLE_TOOLS.length;

  return (
    <section className="pt-12 md:pt-20 flex flex-col items-center text-center gap-6 relative">
      {/* Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Feature Badge */}
      <div className="badge badge-soft badge-primary py-3 px-4 text-xs font-mono font-medium gap-2 shadow-xs">
        <span className="icon-[lucide--shield-check] size-3.5 text-primary"></span>
        <span>{t("badge", { count: toolCount })}</span>
      </div>

      {/* H1 Heading */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-base-content max-w-4xl leading-[1.15]">
        {t("heroTitle1")}{" "}
        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {t("heroTitle2")}
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-lg text-base-content/70 max-w-2xl leading-relaxed">
        {t("heroSub")}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href={`/${locale}/tools`}
          className="btn btn-primary btn-md gap-2 shadow-sm font-semibold px-6"
        >
          <span>{t("ctaExplore", { count: toolCount })}</span>
          <span className="icon-[lucide--arrow-right] size-4"></span>
        </Link>

        <Link
          href={`/${locale}/api-runner`}
          className="btn btn-outline btn-md gap-2 font-semibold"
        >
          <span className="icon-[lucide--terminal] size-4 text-primary"></span>
          <span>{t("ctaRunner")}</span>
        </Link>
      </div>

      {/* Dynamic Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl mt-8 pt-8 border-t border-base-content/10">
        <div className="flex flex-col items-center p-3 rounded-xl bg-base-200/30 border border-base-content/5">
          <span className="text-xl sm:text-2xl font-bold font-mono text-primary">
            {toolCount}
          </span>
          <span className="text-xs text-base-content/60">
            {t("statsTools")}
          </span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-base-200/30 border border-base-content/5">
          <span className="text-xl sm:text-2xl font-bold font-mono text-success">
            0
          </span>
          <span className="text-xs text-base-content/60">{t("statsLogs")}</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-base-200/30 border border-base-content/5">
          <span className="text-xl sm:text-2xl font-bold font-mono text-warning">
            0
          </span>
          <span className="text-xs text-base-content/60">{t("statsDb")}</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-base-200/30 border border-base-content/5">
          <span className="text-xl sm:text-2xl font-bold font-mono text-info">
            0
          </span>
          <span className="text-xs text-base-content/60">
            {t("statsTrackers")}
          </span>
        </div>
      </div>
    </section>
  );
}
