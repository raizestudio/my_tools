// app/components/landing/CategoryShowcaseComponent.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AVAILABLE_TOOLS, ToolCategory } from "@/app/lib/tools";

interface CategoryShowcaseProps {
  locale: string;
}

interface CategoryCardItem {
  category: ToolCategory;
  titleKey: "catSecurityTitle" | "catDevTitle" | "catNetTitle" | "catGenTitle";
  descKey: "catSecurityDesc" | "catDevDesc" | "catNetDesc" | "catGenDesc";
  icon: string;
  badgeClass: string;
  arrowClass: string;
}

const CATEGORY_ITEMS: CategoryCardItem[] = [
  {
    category: "security",
    titleKey: "catSecurityTitle",
    descKey: "catSecurityDesc",
    icon: "icon-[lucide--shield]",
    badgeClass: "badge-soft badge-primary text-primary",
    arrowClass: "text-primary",
  },
  {
    category: "developer",
    titleKey: "catDevTitle",
    descKey: "catDevDesc",
    icon: "icon-[lucide--code-2]",
    badgeClass: "badge-soft badge-info text-info",
    arrowClass: "text-info",
  },
  {
    category: "network",
    titleKey: "catNetTitle",
    descKey: "catNetDesc",
    icon: "icon-[lucide--network]",
    badgeClass: "badge-soft badge-warning text-warning",
    arrowClass: "text-warning",
  },
  {
    category: "general",
    titleKey: "catGenTitle",
    descKey: "catGenDesc",
    icon: "icon-[lucide--sparkles]",
    badgeClass: "badge-soft badge-secondary text-secondary",
    arrowClass: "text-secondary",
  },
];

export default async function CategoryShowcaseComponent({
  locale,
}: CategoryShowcaseProps) {
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col items-center text-center gap-2 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-base-content tracking-tight">
          {t("catTitle")}
        </h2>
        <p className="text-xs sm:text-sm text-base-content/70">{t("catSub")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORY_ITEMS.map((cat) => {
          const count = AVAILABLE_TOOLS.filter(
            (tool) => tool.category === cat.category
          ).length;

          return (
            <Link
              key={cat.category}
              href={`/${locale}/tools?category=${cat.category}`}
              className="card card-border bg-base-100 p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-base-content flex items-center gap-2">
                    <span className={`${cat.icon} size-4`}></span>
                    {t(cat.titleKey)}
                  </span>
                  <span className={`badge badge-xs font-mono ${cat.badgeClass}`}>
                    {t("categoryToolCount", { count })}
                  </span>
                </div>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  {t(cat.descKey)}
                </p>
              </div>

              <span
                className={`text-xs font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform ${cat.arrowClass}`}
              >
                <span>{t("viewToolsInCat")}</span>
                <span className="icon-[lucide--chevron-right] size-3.5"></span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
