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
  iconBgClass: string;
  borderHoverClass: string;
  glowClass: string;
  accentTextClass: string;
}

const CATEGORY_ITEMS: CategoryCardItem[] = [
  {
    category: "security",
    titleKey: "catSecurityTitle",
    descKey: "catSecurityDesc",
    icon: "icon-[lucide--shield-check]",
    badgeClass: "badge-soft badge-primary text-primary",
    iconBgClass:
      "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content",
    borderHoverClass: "hover:border-primary/40",
    glowClass: "group-hover:bg-primary/10",
    accentTextClass: "text-primary",
  },
  {
    category: "developer",
    titleKey: "catDevTitle",
    descKey: "catDevDesc",
    icon: "icon-[lucide--code-2]",
    badgeClass: "badge-soft badge-info text-info",
    iconBgClass:
      "bg-info/10 text-info group-hover:bg-info group-hover:text-info-content",
    borderHoverClass: "hover:border-info/40",
    glowClass: "group-hover:bg-info/10",
    accentTextClass: "text-info",
  },
  {
    category: "network",
    titleKey: "catNetTitle",
    descKey: "catNetDesc",
    icon: "icon-[lucide--network]",
    badgeClass: "badge-soft badge-warning text-warning",
    iconBgClass:
      "bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-content",
    borderHoverClass: "hover:border-warning/40",
    glowClass: "group-hover:bg-warning/10",
    accentTextClass: "text-warning",
  },
  {
    category: "general",
    titleKey: "catGenTitle",
    descKey: "catGenDesc",
    icon: "icon-[lucide--sparkles]",
    badgeClass: "badge-soft badge-secondary text-secondary",
    iconBgClass:
      "bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-content",
    borderHoverClass: "hover:border-secondary/40",
    glowClass: "group-hover:bg-secondary/10",
    accentTextClass: "text-secondary",
  },
];

export default async function CategoryShowcaseComponent({
  locale,
}: CategoryShowcaseProps) {
  const tLanding = await getTranslations({ locale, namespace: "landing" });
  const tTools = await getTranslations({ locale, namespace: "tools" });

  type ToolKey = Parameters<typeof tTools>[0];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 my-4 md:my-6 flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto">
        <div className="badge badge-soft badge-primary font-mono text-xs font-semibold px-3 py-2 gap-1.5 rounded-full">
          <span className="icon-[lucide--layout-grid] size-3.5 text-primary"></span>
          <span>Tool Ecosystem</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-base-content tracking-tight">
          {tLanding("catTitle")}
        </h2>
        <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
          {tLanding("catSub")}
        </p>
      </div>

      {/* 2x2 Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CATEGORY_ITEMS.map((cat) => {
          const categoryTools = AVAILABLE_TOOLS.filter(
            (tool) => tool.category === cat.category
          );
          const count = categoryTools.length;
          const previewTools = categoryTools.slice(0, 3);

          return (
            <Link
              key={cat.category}
              href={`/${locale}/tools?category=${cat.category}`}
              className={`group relative card card-border bg-base-200/30 border-base-content/10 ${cat.borderHoverClass} p-6 sm:p-7 rounded-2xl shadow-xs transition-all duration-300 flex flex-col justify-between gap-6 overflow-hidden hover:bg-base-200/60`}
            >
              {/* Corner Ambient Glow on Hover */}
              <div
                className={`absolute -top-16 -right-16 size-36 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${cat.glowClass}`}
              />

              {/* Top Bar: Icon + Count Badge */}
              <div className="flex items-center justify-between">
                <div
                  className={`size-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-2xs ${cat.iconBgClass}`}
                >
                  <span className={`${cat.icon} size-6`}></span>
                </div>
                <span
                  className={`badge badge-sm font-mono font-semibold py-2 px-3 ${cat.badgeClass}`}
                >
                  {tLanding("categoryToolCount", { count })}
                </span>
              </div>

              {/* Middle Section: Title, Description & Tool Chips */}
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-xl font-bold text-base-content tracking-tight group-hover:text-primary transition-colors">
                    {tLanding(cat.titleKey)}
                  </h3>
                  <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed mt-1">
                    {tLanding(cat.descKey)}
                  </p>
                </div>

                {/* Sample Tool Preview Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  {previewTools.map((tool) => {
                    const titleKey = `${tool.i18nKey}.title` as ToolKey;
                    const toolTitle = tTools.has(titleKey)
                      ? tTools(titleKey)
                      : tool.id;

                    return (
                      <span
                        key={tool.id}
                        className="badge badge-xs bg-base-100/80 border border-base-content/10 font-mono text-[11px] py-2 px-2.5 gap-1.5 text-base-content/80 group-hover:border-base-content/20 transition-colors"
                      >
                        <span className={`${tool.icon} size-3 shrink-0`}></span>
                        <span className="truncate max-w-[130px]">
                          {toolTitle}
                        </span>
                      </span>
                    );
                  })}
                  {count > 3 && (
                    <span className="text-[11px] font-mono text-base-content/40 pl-1">
                      +{count - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="border-t border-base-content/10 pt-4 flex items-center justify-between">
                <span
                  className={`text-xs font-semibold flex items-center gap-1.5 ${cat.accentTextClass}`}
                >
                  <span>{tLanding("viewToolsInCat")}</span>
                  <span className="icon-[lucide--arrow-right] size-3.5 group-hover:translate-x-1.5 transition-transform duration-200"></span>
                </span>

                <span className="text-[11px] font-mono text-base-content/40 uppercase tracking-wider">
                  0w Suite
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
