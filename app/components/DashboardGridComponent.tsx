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

interface CategoryMetaItem {
  id: ToolCategory;
  icon: string;
  activeColor: string;
  iconBg: string;
}

const CATEGORY_META: CategoryMetaItem[] = [
  {
    id: "general",
    icon: "icon-[lucide--sparkles]",
    activeColor: "btn-secondary text-secondary-content",
    iconBg: "bg-secondary/10 text-secondary",
  },
  {
    id: "security",
    icon: "icon-[lucide--shield-check]",
    activeColor: "btn-primary text-primary-content",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    id: "developer",
    icon: "icon-[lucide--code-2]",
    activeColor: "btn-info text-info-content",
    iconBg: "bg-info/10 text-info",
  },
  {
    id: "network",
    icon: "icon-[lucide--network]",
    activeColor: "btn-warning text-warning-content",
    iconBg: "bg-warning/10 text-warning",
  },
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
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* 1. Offline Alert Banner (Engine Offline Notification) */}
      {isOffline && (
        <div className="alert alert-soft alert-warning flex items-start gap-3.5 shadow-sm rounded-2xl border border-warning/30 bg-warning/5 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="size-8 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0 mt-0.5">
            <span className="icon-[lucide--alert-triangle] size-4.5"></span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-base-content">
                {tCommon("offlineTitle")}
              </span>
              <span className="badge badge-xs badge-warning font-mono text-[10px]">
                RELAY_OFFLINE
              </span>
            </div>
            <span className="text-xs text-base-content/75 leading-relaxed">
              {tCommon("offlineDesc")}
            </span>
          </div>
        </div>
      )}

      {/* 2. Command Console (Control Bar) */}
      <div className="card card-border bg-base-100/70 backdrop-blur-md p-3 sm:p-4 rounded-3xl border-base-content/10 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => handleCategoryChange("all")}
            className={`btn btn-sm rounded-xl transition-all ${
              selectedCategory === "all"
                ? "btn-primary shadow-xs font-semibold"
                : "btn-soft text-base-content/70 hover:text-base-content hover:bg-base-200/80"
            }`}
          >
            <span>{tCommon("allCategories")}</span>
            <span
              className={`badge badge-xs font-mono ml-1 ${
                selectedCategory === "all"
                  ? "bg-primary-content text-primary font-bold"
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
                className={`btn btn-sm rounded-xl flex items-center gap-1.5 transition-all ${
                  isActive
                    ? `${cat.activeColor} shadow-xs font-semibold`
                    : "btn-soft text-base-content/70 hover:text-base-content hover:bg-base-200/80"
                }`}
              >
                <span className={`${cat.icon} size-4`}></span>
                <span>{title}</span>
                <span
                  className={`badge badge-xs font-mono ml-0.5 ${
                    isActive
                      ? "bg-base-100/30 text-current font-bold"
                      : "badge-soft"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Actions: Offline Toggle + Live Search Bar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOfflineOnly(!offlineOnly)}
            className={`btn btn-sm rounded-xl gap-2 transition-all shrink-0 font-medium ${
              offlineOnly
                ? "btn-success font-semibold shadow-xs"
                : "btn-soft text-base-content/75 hover:bg-base-200 border border-base-content/10"
            }`}
            title="Filter tools that execute 100% in-browser with zero network calls"
          >
            <span
              className={`size-2 rounded-full ${
                offlineOnly ? "bg-success-content animate-pulse" : "bg-base-content/40"
              }`}
            />
            <span className="icon-[lucide--shield-check] size-4"></span>
            <span className="hidden sm:inline">100% Client-Side</span>
          </button>

          {/* Quick Search */}
          <div className="relative flex-1 sm:w-64">
            <span className="icon-[lucide--search] size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"></span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tCommon("searchPlaceholder")}
              className="input input-sm w-full pl-9 pr-14 rounded-xl bg-base-200/50 border border-base-content/10 focus:border-primary/40 focus:bg-base-100 transition-all font-sans text-xs"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="btn btn-ghost btn-circle btn-xs size-5 pointer-events-auto text-base-content/40 hover:text-base-content"
                >
                  <span className="icon-[lucide--x] size-3"></span>
                </button>
              ) : (
                <span className="flex items-center gap-0.5">
                  <kbd className="kbd kbd-xs bg-base-300/60 text-[10px] text-base-content/50 border-none font-mono hidden sm:inline-block px-1.5 py-0.5 rounded">
                    ⌘K
                  </kbd>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Active Search & Filter Feedback Line */}
      {(searchQuery.trim() || offlineOnly || selectedCategory !== "all") && (
        <div className="flex flex-wrap items-center justify-between text-xs text-base-content/70 px-2 font-mono -mt-4 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base-content/50">
              {filteredApps.length}{" "}
              {filteredApps.length === 1 ? "tool matching" : "tools matching"}
            </span>

            {/* Category Breadcrumb */}
            {selectedCategory !== "all" && (
              <span className="badge badge-sm badge-soft badge-primary font-mono capitalize gap-1 py-1 px-2.5 rounded-lg">
                <span>category: {selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => handleCategoryChange("all")}
                  className="hover:text-primary-content transition-colors"
                >
                  <span className="icon-[lucide--x] size-3"></span>
                </button>
              </span>
            )}

            {/* Offline Breadcrumb */}
            {offlineOnly && (
              <span className="badge badge-sm badge-soft badge-success font-mono gap-1 py-1 px-2.5 rounded-lg">
                <span>client-only</span>
                <button
                  type="button"
                  onClick={() => setOfflineOnly(false)}
                  className="hover:text-success-content transition-colors"
                >
                  <span className="icon-[lucide--x] size-3"></span>
                </button>
              </span>
            )}

            {/* Query Breadcrumb */}
            {searchQuery.trim() && (
              <span className="badge badge-sm badge-soft badge-neutral font-mono gap-1 py-1 px-2.5 rounded-lg">
                <span className="truncate max-w-[120px]">"{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="hover:text-base-content transition-colors"
                >
                  <span className="icon-[lucide--x] size-3"></span>
                </button>
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
            className="link link-hover text-primary font-sans text-xs flex items-center gap-1 font-medium"
          >
            <span>Clear all filters</span>
            <span className="icon-[lucide--rotate-ccw] size-3"></span>
          </button>
        </div>
      )}

      {/* 4. Empty State */}
      {filteredApps.length === 0 && (
        <div className="card card-border border-dashed border-base-content/15 bg-base-100/40 p-12 sm:p-16 text-center flex flex-col items-center justify-center gap-3.5 rounded-3xl">
          <div className="size-14 rounded-2xl bg-base-200/70 flex items-center justify-center text-base-content/40">
            <span className="icon-[lucide--search-x] size-7"></span>
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <span className="font-mono text-xs font-bold text-base-content/40 uppercase tracking-widest">
              [ NO_TOOL_MATCH ]
            </span>
            <p className="text-sm text-base-content/75 font-medium">
              {tCommon("noResults")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              handleCategoryChange("all");
              setSearchQuery("");
              setOfflineOnly(false);
            }}
            className="btn btn-sm btn-outline rounded-xl mt-2 font-medium"
          >
            {tCommon("clearSearch")}
          </button>
        </div>
      )}

      {/* 5. Grouped View (When viewing "all" with no query/offline filter) */}
      {selectedCategory === "all" && searchQuery.trim() === "" && !offlineOnly ? (
        <div className="flex flex-col gap-12">
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
              <section key={cat.id} className="flex flex-col gap-5">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-3 border-b border-base-content/10">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-8 rounded-xl flex items-center justify-center ${cat.iconBg} shadow-2xs`}
                    >
                      <span className={`${cat.icon} size-4.5`}></span>
                    </div>
                    <div className="flex items-baseline gap-2.5">
                      <h2 className="text-base font-bold text-base-content tracking-tight">
                        {catTitle}
                      </h2>
                      {catDesc && (
                        <span className="text-xs text-base-content/50 hidden sm:inline">
                          — {catDesc}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="badge badge-sm badge-soft font-mono font-semibold text-xs px-2.5 py-1 rounded-lg">
                    {categoryApps.length < 10 ? `0${categoryApps.length}` : categoryApps.length} tools
                  </span>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
