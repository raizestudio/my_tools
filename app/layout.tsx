import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Components
import FlyonuiScript from "@/app/components/FlyonuiScript";
import NavbarComponent from "@/app/components/navbar/NavbarComponent";
import FooterComponent from "@/app/components/footer/FooterComponent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_TITLE,
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
                    (function() {
                      try {
                        var saved = localStorage.getItem('theme');
                        var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                        document.documentElement.setAttribute('data-theme', theme);
                      } catch (e) {}
                    })();
                  `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <NavbarComponent />
        <div className="flex flex-col grow">{children}</div>
        <FooterComponent />
        <FlyonuiScript />
        <Analytics />
      </body>
    </html>
  );
}
