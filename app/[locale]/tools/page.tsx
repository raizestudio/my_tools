// app/[locale]/tools/page.tsx
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import DashboardGrid from "@/app/components/DashboardGridComponent";
import { AVAILABLE_TOOLS } from "@/app/lib/tools";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface ToolsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ToolsPage({ params }: ToolsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="max-w-7xl w-full mx-auto p-6 md:p-8">
      <Suspense fallback={<div className="min-h-100" />}>
        <DashboardGrid apps={AVAILABLE_TOOLS} />
      </Suspense>
    </div>
  );
}
