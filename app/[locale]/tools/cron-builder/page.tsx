// app/[locale]/tools/cron-builder/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, isValidLocale } from "@/i18n/routing";
import CronBuilderComponent from "@/app/components/CronBuilderComponent";

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
        notFound();
    }

    const t = await getTranslations({ locale, namespace: "tools.cronBuilder" });
    const isFr = locale === "fr";

    return {
        title: t("title"),
        description: t("desc"),
        alternates: {
            canonical: `${siteUrl}/${locale}/cron-builder`,
            languages: {
                en: `${siteUrl}/en/cron-builder`,
                fr: `${siteUrl}/fr/cron-builder`,
            },
        },
        openGraph: {
            title: `${t("title")} | 0w`,
            description: t("desc"),
            url: `${siteUrl}/${locale}/cron-builder`,
            locale: isFr ? "fr_FR" : "en_US",
            type: "website",
        },
    };
}

export default async function CronBuilderPage({
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
            <CronBuilderComponent />
        </main>
    );
}
