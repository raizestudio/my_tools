// app/[locale]/tools/url-shortener/page.tsx
import type { Metadata } from "next";
import UrlShortenerComponent from "@/app/components/UrlShortenerComponent";

const appTitle = process.env.NEXT_PUBLIC_APP_TITLE || "0w.lat";

export const metadata: Metadata = {
  title: `Raccourcisseur d'URL | ${appTitle}`,
  description: "Raccourcissez vos liens rapidement et créez des URLs épurées et personnalisées.",
  openGraph: {
    title: `Raccourcisseur d'URL - ${appTitle}`,
    description: "Raccourcissez vos liens rapidement et créez des URLs épurées et personnalisées.",
    type: "website",
  },
};

export default function UrlShortenerPage() {
  return (
    <main className="container mx-auto px-4 py-8 flex flex-col grow">
      <UrlShortenerComponent />
    </main>
  );
}
