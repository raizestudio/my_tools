// app/[locale]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, isValidLocale } from "@/i18n/routing";

import HeroSectionComponent from "@/app/components/landing/HeroSectionComponent";
import ThreatMatrixComponent from "@/app/components/landing/ThreatMatrixComponent";
import TechnicalPillarsComponent from "@/app/components/landing/TechnicalPillarsComponent";
import CategoryShowcaseComponent from "@/app/components/landing/CategoryShowcaseComponent";
import FaqAccordionComponent from "@/app/components/landing/FaqAccordionComponent";
import CtaBannerComponent from "@/app/components/landing/CtaBannerComponent";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://0w.lat";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "landing" });
  const isFr = locale === "fr";

  return {
    title: `0w — ${t("heroTitle1")} ${t("heroTitle2")}`,
    description: t("heroSub"),
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        en: `${siteUrl}/en`,
        fr: `${siteUrl}/fr`,
      },
    },
    openGraph: {
      title: `0w — Privacy-First Developer & Security Toolbox`,
      description: t("heroSub"),
      url: `${siteUrl}/${locale}`,
      locale: isFr ? "fr_FR" : "en_US",
      type: "website",
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "landing" });

  // Schema.org Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "0w Developer & Security Toolkit",
        url: `${siteUrl}/${locale}`,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "All",
        browserRequirements: "Requires JavaScript. Requires HTML5.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description: t("heroSub"),
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: t("faqQ1"),
            acceptedAnswer: { "@type": "Answer", text: t("faqA1") },
          },
          {
            "@type": "Question",
            name: t("faqQ2"),
            acceptedAnswer: { "@type": "Answer", text: t("faqA2") },
          },
          {
            "@type": "Question",
            name: t("faqQ3"),
            acceptedAnswer: { "@type": "Answer", text: t("faqA3") },
          },
          {
            "@type": "Question",
            name: t("faqQ4"),
            acceptedAnswer: { "@type": "Answer", text: t("faqA4") },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex flex-col gap-24 pb-20 max-w-6xl mx-auto w-full px-4 md:px-6">
        <HeroSectionComponent locale={locale} />
        <ThreatMatrixComponent locale={locale} />
        <TechnicalPillarsComponent locale={locale} />
        <CategoryShowcaseComponent locale={locale} />
        <FaqAccordionComponent locale={locale} />
        <CtaBannerComponent locale={locale} />
      </div>
    </>
  );
}
