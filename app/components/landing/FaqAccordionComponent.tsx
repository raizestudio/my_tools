// app/components/landing/FaqAccordionComponent.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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

export default function FaqAccordionComponent() {
  const t = useTranslations("landing");
  // Default to first item expanded
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="flex flex-col gap-10 max-w-3xl mx-auto w-full">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="badge badge-sm badge-soft badge-primary font-mono font-medium px-3 py-1">
          FAQ
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
          {t("faqTitle")}
        </h2>
        <p className="text-xs sm:text-sm text-base-content/60 max-w-md">
          Learn how 0w handles client-side execution, data retention, and
          zero-telemetry workflows.
        </p>
      </div>

      {/* FlyonUI Accordion Group */}
      <div className="accordion flex flex-col gap-3">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={item.id}
              className={`accordion-item card card-border bg-base-100 transition-all duration-200 ${
                isOpen
                  ? "active border-primary/40 shadow-sm"
                  : "hover:border-base-content/20 hover:bg-base-200/20"
              }`}
            >
              {/* FlyonUI Accordion Toggle Button */}
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="accordion-toggle inline-flex items-center justify-between text-start w-full px-5 py-4 focus:outline-none"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? "bg-primary/10 text-primary"
                        : "bg-base-200/70 text-base-content/60"
                    }`}
                  >
                    <span className={`${item.icon} size-4`}></span>
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-base-content leading-snug">
                    {t(item.qKey)}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`badge badge-xs font-mono hidden sm:inline-flex ${
                      isOpen
                        ? "badge-primary badge-soft font-semibold"
                        : "badge-neutral badge-soft"
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

              {/* FlyonUI Accordion Content Container */}
              <div
                className={`accordion-content overflow-hidden transition-all duration-300 ${
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
                role="region"
              >
                <div className="px-5 pb-5 pt-2 border-t border-base-content/5 text-xs sm:text-sm text-base-content/75 leading-relaxed">
                  <p>{t(item.aKey)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FlyonUI Community Help Card */}
      <div className="card card-border bg-base-200/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border-dashed">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="icon-[lucide--help-circle] size-5"></span>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-base-content">
              Have another question or request?
            </h4>
            <p className="text-[11px] text-base-content/60">
              0w is open-source and welcomes community suggestions.
            </p>
          </div>
        </div>

        <Link
          href="https://github.com/raizestudio/my_tools/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-xs sm:btn-sm btn-outline gap-1.5 shrink-0"
        >
          <span className="icon-[lucide--github] size-3.5"></span>
          <span>Open an Issue</span>
        </Link>
      </div>
    </section>
  );
}
