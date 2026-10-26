// app/layout.tsx
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Components
import FlyonuiScript from "@/app/components/FlyonuiScript";
import NavbarComponent from "@/app/components/navbar/NavbarComponent";
import FooterComponent from "@/app/components/footer/FooterComponent";

// Context
import { I18nProvider } from "@/app/context/I18nContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://0w.lat";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "0w | Privacy-First Web Toolbox",
    template: "%s | 0w",
  },
  description:
    "Fast, secure, and client-side focused developer and privacy utilities.",
  openGraph: {
    siteName: "0w Toolbox",
    type: "website",
    locale: "en_US",
    alternateLocale: ["fr_FR"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  var theme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);

                  var savedLang = localStorage.getItem('0w_locale');
                  if (savedLang) {
                    document.documentElement.setAttribute('lang', savedLang);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      {/* suppressHydrationWarning élimine l'alerte causée par cz-shortcut-listen */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <I18nProvider>
          <NavbarComponent />
          <div className="flex flex-col grow">{children}</div>
          <FooterComponent />
        </I18nProvider>
        <FlyonuiScript />
        <Analytics />
      </body>
    </html>
  );
}
