// app/components/landing/FaqAccordionComponent.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface FaqAccordionProps {
  locale?: string;
}

interface FaqItemConfig {
  id: string;
  qKey: "faqQ1" | "faqQ2" | "faqQ3" | "faqQ4";
  aKey: "faqA1" | "faqA2" | "faqA3" | "faqA4";
  badge: string;
  icon: string;
}

const FAQ_ITEMS: FaqItemConfig[] = [
  {
    id: "faq-privacy",
    qKey: "faqQ1",
    aKey: "faqA1",
    badge: "Privacy & Storage",
    icon: "icon-[lucide--shield-check]",
  },
  {
    id: "faq-runner",
    qKey: "faqQ2",
    aKey: "faqA2",
    badge: "API Runner",
    icon: "icon-[lucide--terminal]",
  },
  {
    id: "faq-comparison",
    qKey: "faqQ3",
    aKey: "faqA3",
    badge: "Comparison",
    icon: "icon-[lucide--git-compare]",
  },
  {
    id: "faq-offline",
    qKey: "faqQ4",
    aKey: "faqA4",
    badge: "Architecture",
    icon: "icon-[lucide--wifi-off]",
  },
];

export default function FaqAccordionComponent({ locale }: FaqAccordionProps) {
  const t = useTranslations("landing");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 my-4 md:my-0 flex flex-col gap-10 relative">
      {/* Ambient Radial Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="badge badge-soft badge-primary font-mono text-xs font-semibold px-3 py-2 gap-1.5 rounded-full">
          <span className="icon-[lucide--help-circle] size-3.5 text-primary"></span>
          <span>Knowledge Base</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-base-content tracking-tight">
          {t("faqTitle")}
        </h2>
        <p className="text-xs sm:text-sm text-base-content/70 max-w-md leading-relaxed">
          Learn how 0w handles client-side execution, data retention, and
          zero-telemetry workflows.
        </p>
      </div>

      {/* Accordion Group */}
      <div className="flex flex-col gap-3">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={item.id}
              className={`card card-border rounded-2xl transition-all duration-300 overflow-hidden ${
                isOpen
                  ? "bg-base-200/60 border-primary/40 shadow-sm"
                  : "bg-base-200/30 border-base-content/10 hover:border-base-content/20 hover:bg-base-200/40"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="w-full inline-flex items-center justify-between text-start p-4 sm:p-5 focus:outline-none transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isOpen
                        ? "bg-primary text-primary-content shadow-xs"
                        : "bg-base-100/80 border border-base-content/10 text-base-content/60"
                    }`}
                  >
                    <span className={`${item.icon} size-4.5`}></span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-base-content leading-snug">
                    {t(item.qKey)}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`badge badge-xs font-mono font-medium hidden sm:inline-flex py-2 px-2.5 ${
                      isOpen
                        ? "badge-primary badge-soft font-bold"
                        : "badge-neutral badge-soft text-base-content/60"
                    }`}
                  >
                    {item.badge}
                  </span>
                  <span
                    className={`icon-[lucide--chevron-down] size-4 text-base-content/50 transition-transform duration-300 ${
                      isOpen ? "-rotate-180 text-primary" : ""
                    }`}
                  ></span>
                </div>
              </button>

              {/* Zero-Jank CSS Grid Height Transition */}
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
                role="region"
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 pt-2 border-t border-base-content/5 text-xs sm:text-sm text-base-content/75 leading-relaxed">
                    <p>{t(item.aKey)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Community Help Card */}
      <div className="card card-border bg-base-200/30 border-base-content/10 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl backdrop-blur-xs transition-colors hover:bg-base-200/50">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="icon-[lucide--message-square-plus] size-5"></span>
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-sm font-bold text-base-content">
              {t("haveQuestionOrRequest")}
            </h4>
            <p className="text-xs text-base-content/60">
              {t("faqHelper")}
            </p>
          </div>
        </div>

        <Link
          href="https://github.com/raizestudio/zerow/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-soft btn-neutral gap-2 shrink-0 font-semibold px-4 rounded-xl border border-base-content/10 hover:scale-[1.02] transition-transform"
        >
          <span className="icon-[lucide--github] size-4"></span>
          <span>{t("openIssue")}</span>
        </Link>
      </div>
    </section>
  );
}
