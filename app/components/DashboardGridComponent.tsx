// app/components/DashboardGridComponent.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ToolItem, ToolCategory } from "@/app/lib/tools";
import AppCardComponent from "@/app/components/AppCardComponent";
import { useHealth } from "@/app/providers/HealthProvider";

interface DashboardGridProps {
  apps: ToolItem[];
}

const CATEGORY_META: { id: ToolCategory; icon: string }[] = [
  { id: "general", icon: "icon-[lucide--sparkles]" },
  { id: "security", icon: "icon-[lucide--shield-check]" },
  { id: "developer", icon: "icon-[lucide--code-2]" },
  { id: "network", icon: "icon-[lucide--network]" },
];

const VALID_CATEGORIES = new Set(["general", "security", "developer", "network"]);

export default function DashboardGrid({ apps }: DashboardGridProps) {
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const tTools = useTranslations("tools");

  type ToolKey = Parameters<typeof tTools>[0];
  type CategoryKey = Parameters<typeof tCategories>[0];

  const { isLive } = useHealth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Derive selectedCategory directly from URL
  const categoryParam = searchParams.get("category");
  const selectedCategory: ToolCategory | "all" =
    categoryParam && VALID_CATEGORIES.has(categoryParam)
      ? (categoryParam as ToolCategory)
      : "all";

  const [searchQuery, setSearchQuery] = useState("");
  const [offlineOnly, setOfflineOnly] = useState(false);

  // Keyboard shortcut listener (/ or ⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) &&
        document.activeElement !== searchInputRef.current &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCategoryChange = (cat: ToolCategory | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === "all") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    router.replace(`${pathname}${query}`, { scroll: false });
  };

  const isOffline = isLive === false;

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return apps.filter((app) => {
      const matchesCategory =
        selectedCategory === "all" || app.category === selectedCategory;
      if (!matchesCategory) return false;

      if (offlineOnly && app.networkRequired) return false;
      if (!q) return true;

      const titleKey = `${app.i18nKey}.title` as ToolKey;
      const descKey = `${app.i18nKey}.desc` as ToolKey;

      const title = tTools.has(titleKey)
        ? tTools(titleKey).toLowerCase()
        : app.id.toLowerCase();
      const desc = tTools.has(descKey)
        ? tTools(descKey).toLowerCase()
        : "";

      return (
        title.includes(q) ||
        desc.includes(q) ||
        app.id.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q)
      );
    });
  }, [apps, selectedCategory, searchQuery, offlineOnly, tTools]);

  return (
    <div className="flex flex-col gap-8">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="alert alert-soft alert-warning flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
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

      {/* Control Bar: Category Pills + Search + Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => handleCategoryChange("all")}
            className={`btn btn-sm transition-all ${
              selectedCategory === "all"
                ? "btn-primary shadow-xs font-semibold"
                : "btn-soft text-base-content/75 hover:bg-base-200/80"
            }`}
          >
            {tCommon("allCategories")}
            <span
              className={`badge badge-xs font-mono ml-1 ${
                selectedCategory === "all"
                  ? "badge-primary-content text-primary bg-primary-content"
                  : "badge-soft"
              }`}
            >
              {apps.length}
            </span>
          </button>

          {CATEGORY_META.map((cat) => {
            const count = apps.filter((a) => a.category === cat.id).length;
            const isActive = selectedCategory === cat.id;
            const titleKey = `${cat.id}.title` as CategoryKey;
            const title = tCategories.has(titleKey)
              ? tCategories(titleKey)
              : cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`btn btn-sm flex items-center gap-1.5 transition-all ${
                  isActive
                    ? "btn-primary shadow-xs font-semibold"
                    : "btn-soft text-base-content/75 hover:bg-base-200/80"
                }`}
              >
                <span className={`${cat.icon} size-4`}></span>
                <span>{title}</span>
                <span
                  className={`badge badge-xs font-mono ml-1 ${
                    isActive
                      ? "badge-primary-content text-primary bg-primary-content"
                      : "badge-soft"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Actions: Offline Toggle + Live Search */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOfflineOnly(!offlineOnly)}
            className={`btn btn-sm gap-1.5 transition-all shrink-0 ${
              offlineOnly
                ? "btn-success font-semibold shadow-xs"
                : "btn-outline text-base-content/70 hover:bg-base-200"
            }`}
            title="Filter tools that execute 100% in-browser with zero network calls"
          >
            <span className="icon-[lucide--shield-check] size-4"></span>
            <span className="hidden sm:inline">100% Client-Side</span>
          </button>

          <div className="relative flex-1 sm:w-64">
            <span className="icon-[lucide--search] size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tCommon("searchPlaceholder")}
              className="input input-sm w-full pl-9 pr-14 bg-base-200/50 focus:bg-base-100 transition-colors"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="btn btn-ghost btn-circle btn-xs size-5 text-base-content/40 hover:text-base-content"
                >
                  <span className="icon-[lucide--x] size-3"></span>
                </button>
              ) : (
                <kbd className="kbd kbd-xs bg-base-300/50 text-[10px] text-base-content/50 border-none font-mono hidden sm:inline-block">
                  /
                </kbd>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Line */}
      {(searchQuery.trim() || offlineOnly || selectedCategory !== "all") && (
        <div className="flex items-center justify-between text-xs text-base-content/60 px-1 font-mono -mt-3">
          <div className="flex items-center gap-2">
            <span>
              {filteredApps.length}{" "}
              {filteredApps.length === 1 ? "tool matching" : "tools matching"}
            </span>
            {selectedCategory !== "all" && (
              <span className="badge badge-xs badge-primary badge-soft font-mono capitalize">
                {selectedCategory}
              </span>
            )}
            {offlineOnly && (
              <span className="badge badge-xs badge-success badge-soft font-mono">
                100% Client-Side
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setOfflineOnly(false);
              handleCategoryChange("all");
            }}
            className="link link-hover text-primary font-sans text-xs"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredApps.length === 0 && (
        <div className="card card-border bg-base-100/60 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <span className="icon-[lucide--search-x] size-10 text-base-content/40"></span>
          <p className="text-sm text-base-content/70">
            {tCommon("noResults")}
          </p>
          <button
            type="button"
            onClick={() => {
              handleCategoryChange("all");
              setSearchQuery("");
              setOfflineOnly(false);
            }}
            className="btn btn-xs btn-outline mt-1"
          >
            {tCommon("clearSearch")}
          </button>
        </div>
      )}

      {/* Grouped View */}
      {selectedCategory === "all" && searchQuery.trim() === "" && !offlineOnly ? (
        <div className="flex flex-col gap-10">
          {CATEGORY_META.map((cat) => {
            const categoryApps = apps.filter((app) => app.category === cat.id);
            if (categoryApps.length === 0) return null;

            const catTitleKey = `${cat.id}.title` as CategoryKey;
            const catDescKey = `${cat.id}.desc` as CategoryKey;

            const catTitle = tCategories.has(catTitleKey)
              ? tCategories(catTitleKey)
              : cat.id;
            const catDesc = tCategories.has(catDescKey)
              ? tCategories(catDescKey)
              : "";

            return (
              <section key={cat.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-base-content/10 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
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

                  <span className="badge badge-xs badge-neutral badge-soft font-mono">
                    {categoryApps.length}
                  </span>
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
        /* Flat Filtered Grid */
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
