// app/[locale]/exif-cleaner/page.tsx
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ExifCleanerComponent from "@/app/components/ExifCleanerComponent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools.exifCleaner" });

  return {
    title: t("title"),
    description: t("desc"),
  };
}

export default async function ExifCleanerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="container mx-auto px-4 py-8 grow flex flex-col justify-center">
      <ExifCleanerComponent />
    </main>
  );
}
