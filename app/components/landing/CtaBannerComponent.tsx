// app/components/landing/CtaBannerComponent.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AVAILABLE_TOOLS } from "@/app/lib/tools";

interface CtaBannerProps {
  locale: string;
}

export default async function CtaBannerComponent({ locale }: CtaBannerProps) {
  const t = await getTranslations({ locale, namespace: "landing" });
  const toolCount = AVAILABLE_TOOLS.length;

  return (
    <section className="card card-border bg-linear-to-br from-base-100 via-base-200/40 to-base-100 p-8 sm:p-12 text-center shadow-lg border-primary/20 flex flex-col items-center gap-4 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 size-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      <h2 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
        {t("bannerTitle")}
      </h2>
      <p className="text-xs sm:text-sm text-base-content/70 max-w-xl">
        {t("bannerSub", { count: toolCount })}
      </p>
      <Link
        href={`/${locale}/tools`}
        className="btn btn-primary btn-md gap-2 font-semibold shadow-sm mt-2"
      >
        <span>{t("bannerBtn")}</span>
        <span className="icon-[lucide--arrow-right] size-4"></span>
      </Link>
    </section>
  );
}
