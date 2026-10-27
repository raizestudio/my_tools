// app/[locale]/hex-analyzer/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, isValidLocale } from "@/i18n/routing";
import HexAnalyzerComponent from "@/app/components/HexAnalyzerComponent";

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

  const t = await getTranslations({ locale, namespace: "tools.hexAnalyzer" });
  const isFr = locale === "fr";

  return {
    title: t("title"),
    description: t("desc"),
    alternates: {
      canonical: `${siteUrl}/${locale}/hex-analyzer`,
      languages: {
        en: `${siteUrl}/en/hex-analyzer`,
        fr: `${siteUrl}/fr/hex-analyzer`,
      },
    },
    openGraph: {
      title: `${t("title")} | 0w`,
      description: t("desc"),
      url: `${siteUrl}/${locale}/hex-analyzer`,
      locale: isFr ? "fr_FR" : "en_US",
      type: "website",
    },
  };
}

export default async function HexAnalyzerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <main className="container mx-auto px-4 py-8 flex flex-col items-center">
      <HexAnalyzerComponent />
    </main>
  );
}
