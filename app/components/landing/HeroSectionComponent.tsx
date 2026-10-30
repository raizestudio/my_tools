// app/components/landing/HeroSectionComponent.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AVAILABLE_TOOLS } from "@/app/lib/tools";
import HeroAnimationWrapper from "./HeroAnimationWrapper";
import ScrollVelocityComponent from "./ScrollVelocityComponent";
import TypewriterTitleComponent from "./TypewriterTitleComponent";

interface HeroSectionProps {
  locale: string;
}

export default async function HeroSectionComponent({
  locale,
}: HeroSectionProps) {
  const t = await getTranslations({ locale, namespace: "landing" });
  const toolCount = AVAILABLE_TOOLS.length;

  const rotatingPhrases = [t("heroTitle2")];

  return (
    <section className="relative w-full overflow-hidden pt-10 md:pt-16 pb-8 flex flex-col items-center gap-8 isolate">
      {/* 1. Primary Top Ambient Glow (Wide Soft Aurora) */}
      <div
        aria-hidden="true"
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-137.5 sm:w-212.5 lg:w-250 h-80 sm:h-105 bg-linear-to-b from-primary/25 via-secondary/15 to-transparent rounded-full blur-[90px] sm:blur-[130px] pointer-events-none -z-1"
      />

      {/* 2. Concentrated Core Glow (Directly behind the H1 for contrast) */}
      <div
        aria-hidden="true"
        className="absolute top-16 left-1/2 -translate-x-1/2 w-70 sm:w-120 h-45 sm:h-60 bg-primary/20 rounded-full blur-[70px] sm:blur-[95px] pointer-events-none -z-1"
      />

      {/* Main Hero Content (Kept on z-10 above the glow) */}
      <div className="relative z-10 px-4 w-full max-w-4xl">
        <HeroAnimationWrapper>
          {/* Feature Badge */}
          <div className="badge badge-soft badge-primary py-4 sm:py-3 px-4 text-xs font-mono font-medium gap-2 shadow-xs mb-4 rounded-full border border-primary/25 backdrop-blur-md">
            <span className="icon-[lucide--shield-check] size-3.5 text-primary"></span>
            <span>{t("badge", { count: toolCount })}</span>
          </div>

          {/* Typewriter H1 Heading */}
          <TypewriterTitleComponent
            prefix={t("heroTitle1")}
            words={rotatingPhrases}
            typingSpeed={70}
            deletingSpeed={30}
            pauseDuration={2200}
          />

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-base-content/75 text-center max-w-2xl leading-relaxed mt-8 sm:mt-0 mb-8">
            {t("heroSub")}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}/tools`}
              className="btn btn-primary btn-md gap-2 shadow-lg shadow-primary/20 font-semibold px-6 rounded-xl transition-transform hover:scale-[1.02]"
            >
              <span>{t("ctaExplore", { count: toolCount })}</span>
              <span className="icon-[lucide--arrow-right] size-4"></span>
            </Link>

            <Link
              href={`/${locale}/api-runner`}
              className="btn btn-outline btn-md gap-2 font-semibold px-6 rounded-xl transition-transform hover:scale-[1.02] bg-base-100/50 backdrop-blur-sm"
            >
              <span className="icon-[lucide--terminal] size-4 text-primary"></span>
              <span>{t("ctaRunner")}</span>
            </Link>
          </div>

          {/* Dynamic Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl mt-12 pt-8 border-t border-base-content/10">
            {[
              { val: toolCount, label: t("statsTools"), color: "text-primary" },
              { val: "0", label: t("statsLogs"), color: "text-success" },
              { val: "0", label: t("statsDb"), color: "text-warning" },
              { val: "0", label: t("statsTrackers"), color: "text-info" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center p-3 rounded-xl bg-base-200/40 border border-base-content/10 backdrop-blur-xs transition-colors hover:bg-base-200/70"
              >
                <span
                  className={`text-xl sm:text-2xl font-bold font-mono ${stat.color}`}
                >
                  {stat.val}
                </span>
                <span className="text-xs text-base-content/60 mt-0.5">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </HeroAnimationWrapper>
      </div>

      {/* Infinite Velocity Stream with Word Hover */}
      <div className="relative z-10 w-full mt-4 mask-[linear-gradient(to_right,transparent_0,transparent_4rem,black_24rem,black_calc(100%-24rem),transparent_calc(100%-4rem),transparent_100%)]">
        {" "}
        <ScrollVelocityComponent
          texts={[
            "CLIENT-SIDE WASM",
            "ZERO TELEMETRY",
            "NO DATABASE",
            "WEBCRYPTO PRIMITIVES",
            "100% STATELESS",
            "OPEN SOURCE",
          ]}
          baseVelocity={1.2}
        />
        <ScrollVelocityComponent
          texts={[
            "NETWORK AUDITING",
            "JWT INSPECTION",
            "DNSSEC CHAIN",
            "ZERO-KNOWLEDGE",
            "API RUNNER",
            "PRIVACY FIRST",
          ]}
          baseVelocity={-1.2}
          className="-mt-2"
        />
      </div>
    </section>
  );
}
