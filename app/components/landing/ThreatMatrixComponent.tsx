// app/components/landing/ThreatMatrixComponent.tsx
import { getTranslations } from "next-intl/server";

interface ThreatMatrixProps {
  locale: string;
}

export default async function ThreatMatrixComponent({
  locale,
}: ThreatMatrixProps) {
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col items-center text-center gap-2 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-base-content tracking-tight">
          {t("matrixTitle")}
        </h2>
        <p className="text-xs sm:text-sm text-base-content/70">
          {t("matrixSub")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Competitor Pitfalls */}
        <div className="card card-border bg-base-100 p-6 shadow-sm border-error/20 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-base-content/10">
            <span className="icon-[lucide--x-circle] size-5 text-error"></span>
            <span className="font-bold text-sm text-base-content">
              {t("colOther")}
            </span>
          </div>
          <ul className="flex flex-col gap-3.5 text-xs text-base-content/80">
            <li className="flex items-start gap-2.5">
              <span className="icon-[lucide--x] size-4 text-error shrink-0 mt-0.5"></span>
              <span>{t("m1Bad")}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="icon-[lucide--x] size-4 text-error shrink-0 mt-0.5"></span>
              <span>{t("m2Bad")}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="icon-[lucide--x] size-4 text-error shrink-0 mt-0.5"></span>
              <span>{t("m3Bad")}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="icon-[lucide--x] size-4 text-error shrink-0 mt-0.5"></span>
              <span>{t("m4Bad")}</span>
            </li>
          </ul>
        </div>

        {/* 0w Architecture */}
        <div className="card card-border bg-base-100 p-6 shadow-sm border-success/20 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-base-content/10">
            <span className="icon-[lucide--shield-check] size-5 text-success"></span>
            <span className="font-bold text-sm text-base-content">
              {t("colZeroW")}
            </span>
          </div>
          <ul className="flex flex-col gap-3.5 text-xs text-base-content/90 font-medium">
            <li className="flex items-start gap-2.5">
              <span className="icon-[lucide--check] size-4 text-success shrink-0 mt-0.5"></span>
              <span>{t("m1Good")}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="icon-[lucide--check] size-4 text-success shrink-0 mt-0.5"></span>
              <span>{t("m2Good")}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="icon-[lucide--check] size-4 text-success shrink-0 mt-0.5"></span>
              <span>{t("m3Good")}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="icon-[lucide--check] size-4 text-success shrink-0 mt-0.5"></span>
              <span>{t("m4Good")}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
