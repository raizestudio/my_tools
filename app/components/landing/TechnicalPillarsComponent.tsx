// app/components/landing/TechnicalPillarsComponent.tsx
import { getTranslations } from "next-intl/server";

interface TechnicalPillarsProps {
  locale: string;
}

export default async function TechnicalPillarsComponent({
  locale,
}: TechnicalPillarsProps) {
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="card card-border bg-base-100 p-6 shadow-sm flex flex-col gap-3">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <span className="icon-[lucide--cpu] size-5"></span>
        </div>
        <h3 className="font-bold text-sm text-base-content">
          {t("pillarClientTitle")}
        </h3>
        <p className="text-xs text-base-content/70 leading-relaxed">
          {t("pillarClientDesc")}
        </p>
      </div>

      <div className="card card-border bg-base-100 p-6 shadow-sm flex flex-col gap-3">
        <div className="size-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
          <span className="icon-[lucide--server] size-5"></span>
        </div>
        <h3 className="font-bold text-sm text-base-content">
          {t("pillarRelayTitle")}
        </h3>
        <p className="text-xs text-base-content/70 leading-relaxed">
          {t("pillarRelayDesc")}
        </p>
      </div>

      <div className="card card-border bg-base-100 p-6 shadow-sm flex flex-col gap-3">
        <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
          <span className="icon-[lucide--shield-alert] size-5"></span>
        </div>
        <h3 className="font-bold text-sm text-base-content">
          {t("pillarSsrfTitle")}
        </h3>
        <p className="text-xs text-base-content/70 leading-relaxed">
          {t("pillarSsrfDesc")}
        </p>
      </div>
    </section>
  );
}
