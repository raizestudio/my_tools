// app/[locale]/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import {
    getMessages,
    getTranslations,
    setRequestLocale,
} from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import "../globals.css";

// Components
import NavbarComponent from "@/app/components/navbar/NavbarComponent";
import FooterComponent from "@/app/components/footer/FooterComponent";
import PrivacyModalComponent from "@/app/components/PrivacyModalComponent";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://0w.lat";

// 1. Pré-génération des routes statiques pour le CDN
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

// 2. Métadonnées dynamiques localisées (Serveur & SEO)
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;

    if (!routing.locales.includes(locale as any)) {
        return {};
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

    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Active le rendu statique SSG
    setRequestLocale(locale);

    // Fournit les traductions aux Client Components
    const messages = await getMessages();

    return (
        <html
            lang={locale}
            className="h-full antialiased"
            suppressHydrationWarning
        >
            <head>
                <Script id="theme-script" strategy="beforeInteractive">
                    {`
              try {
                var savedTheme = localStorage.getItem('theme');
                var theme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `}
                </Script>
            </head>
            <body className="min-h-full flex flex-col" suppressHydrationWarning>
                <NextIntlClientProvider messages={messages}>
                    <NavbarComponent />
                    <div className="flex flex-col grow">{children}</div>
                    <FooterComponent />
                    <PrivacyModalComponent />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
