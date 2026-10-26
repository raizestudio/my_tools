// app/components/DashboardGridComponent.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ToolItem, ToolCategory } from "@/app/lib/tools";
import AppCardComponent from "@/app/components/AppCardComponent";

interface DashboardGridProps {
  apps: ToolItem[];
}

const CATEGORY_META: { id: ToolCategory; icon: string }[] = [
  { id: "security", icon: "icon-[lucide--shield-check]" },
  { id: "developer", icon: "icon-[lucide--code]" },
  { id: "network", icon: "icon-[lucide--network]" },
];

export default function DashboardGrid({ apps }: DashboardGridProps) {
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const tTools = useTranslations("tools");

  const [isLive, setIsLive] = useState<boolean | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const checkHealth = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      try {
        const res = await fetch(`${apiUrl}/health`, {
          signal: AbortSignal.timeout(2500),
        });
        setIsLive(res.ok);
      } catch {
        setIsLive(false);
      }
    };

    checkHealth();
  }, []);

  const isOffline = isLive === false;

  // Filtrage combiné catégorie + recherche multilingue via les messages next-intl
  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return apps.filter((app) => {
      const matchesCategory =
        selectedCategory === "all" || app.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;

      const title = tTools.has(`${app.i18nKey}.title` as any)
        ? tTools(`${app.i18nKey}.title` as any).toLowerCase()
        : app.id.toLowerCase();
      const desc = tTools.has(`${app.i18nKey}.desc` as any)
        ? tTools(`${app.i18nKey}.desc` as any).toLowerCase()
        : "";

      return title.includes(q) || desc.includes(q);
    });
  }, [apps, selectedCategory, searchQuery, tTools]);

  return (
    <div className="flex flex-col gap-8">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="alert alert-soft alert-warning flex items-start gap-3 animate-in fade-in duration-200">
          <span className="icon-[lucide--alert-triangle] size-5 text-warning shrink-0 mt-0.5"></span>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {tCommon("offlineTitle")}
            </span>
            <span className="text-xs text-base-content/70">
              {tCommon("offlineDesc")}
            </span>
          </div>
        </div>
      )}

      {/* Control Bar: Search + Category Pills */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`btn btn-sm ${
              selectedCategory === "all"
                ? "btn-primary"
                : "btn-ghost text-primary-content/70 dark:text-base-content hover:text-primary-content"
            }`}
          >
            {tCommon("allCategories")}
            <span className="badge badge-xs badge-soft ml-1 text-base-content">
              {apps.length}
            </span>
          </button>

          {CATEGORY_META.map((cat) => {
            const count = apps.filter((a) => a.category === cat.id).length;
            const isActive = selectedCategory === cat.id;
            const title = tCategories.has(`${cat.id}.title` as any)
              ? tCategories(`${cat.id}.title` as any)
              : cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`btn btn-sm flex items-center gap-1.5 ${
                  isActive
                    ? "btn-primary"
                    : "btn-ghost text-primary-content/70 dark:text-base-content hover:text-primary-content"
                }`}
              >
                <span className={`${cat.icon} size-4`}></span>
                <span>{title}</span>
                <span className="badge badge-xs badge-soft ml-1 text-base-content">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-65 md:max-w-xs">
          <span className="icon-[lucide--search] size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tCommon("searchPlaceholder")}
            className="input input-sm w-full pl-9 pr-8 bg-base-200/50 focus:bg-base-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
            >
              <span className="icon-[lucide--x] size-3.5"></span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredApps.length === 0 && (
        <div className="card card-border bg-base-100 p-12 text-center flex flex-col items-center justify-center gap-3">
          <span className="icon-[lucide--search-x] size-10 text-base-content/40"></span>
          <p className="text-sm text-base-content/70">
            {tCommon("noResults")}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="btn btn-xs btn-outline"
          >
            {tCommon("clearSearch")}
          </button>
        </div>
      )}

      {/* Grouped View: When viewing "all" with no search query */}
      {selectedCategory === "all" && searchQuery.trim() === "" ? (
        <div className="flex flex-col gap-10">
          {CATEGORY_META.map((cat) => {
            const categoryApps = apps.filter((app) => app.category === cat.id);
            if (categoryApps.length === 0) return null;

            const catTitle = tCategories.has(`${cat.id}.title` as any)
              ? tCategories(`${cat.id}.title` as any)
              : cat.id;
            const catDesc = tCategories.has(`${cat.id}.desc` as any)
              ? tCategories(`${cat.id}.desc` as any)
              : "";

            return (
              <section key={cat.id} className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5 border-b border-base-content/10 pb-2">
                  <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <span className={`${cat.icon} size-4`}></span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-base font-semibold text-base-content">
                      {catTitle}
                    </h2>
                    {catDesc && (
                      <span className="text-xs text-base-content/50 hidden sm:inline">
                        — {catDesc}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {categoryApps.map((app) => (
                    <AppCardComponent
                      key={app.id}
                      app={app}
                      disabled={isOffline}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* Flat Filtered Grid: When a specific category or search query is active */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredApps.map((app) => (
            <AppCardComponent
              key={app.id}
              app={app}
              disabled={isOffline}
            />
          ))}
        </div>
      )}
    </div>
  );
}
