// app/[locale]/layout.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
    getMessages,
    getTranslations,
    setRequestLocale,
} from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { routing, isValidLocale } from "@/i18n/routing";
import "../globals.css";

// Components
import NavbarComponent from "@/app/components/navbar/NavbarComponent";
import FooterComponent from "@/app/components/footer/FooterComponent";
import PrivacyModalComponent from "@/app/components/PrivacyModalComponent";
import ThemeScript from "@/app/components/ThemeScript";

// Providers
import { HealthProvider } from "@/app/providers/HealthProvider";

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

    const t = await getTranslations({ locale, namespace: "meta" });
    const isFr = locale === "fr";

    return {
        metadataBase: new URL(siteUrl),
        title: {
            default: t("title"),
            template: "%s | 0w",
        },
        description: t("desc"),
        alternates: {
            canonical: `${siteUrl}/${locale}`,
            languages: {
                en: `${siteUrl}/en`,
                fr: `${siteUrl}/fr`,
            },
        },
        openGraph: {
            siteName: "0w Toolbox",
            type: "website",
            locale: isFr ? "fr_FR" : "en_US",
            alternateLocale: [isFr ? "en_US" : "fr_FR"],
            url: `${siteUrl}/${locale}`,
            title: t("title"),
            description: t("desc"),
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!isValidLocale(locale)) {
        notFound();
    }

    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <html
            lang={locale}
            className="h-full antialiased scrollbar-gutter-stable"
            suppressHydrationWarning
        >
            <head>
                <ThemeScript />
            </head>
            <body
                className="min-h-full flex flex-col bg-base-100 dark:bg-base-300"
                suppressHydrationWarning
            >
                <NextIntlClientProvider messages={messages}>
                    <HealthProvider>
                        <NavbarComponent />
                        <div className="flex flex-col grow">{children}</div>
                        <FooterComponent />
                        <PrivacyModalComponent />
                    </HealthProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
