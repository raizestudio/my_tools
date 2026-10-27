// app/components/navbar/NavbarComponent.tsx
"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import LanguageSwitcher from "@/app/components/LanguageSwitcherComponent";
import ThemeToggleComponent from "@/app/components/ThemeToggleComponent";
import { AVAILABLE_TOOLS, ToolCategory } from "@/app/lib/tools";

interface CategoryNavConfig {
  id: ToolCategory;
  titleKey:
    "security.title" | "developer.title" | "network.title" | "general.title";
  icon: string;
}

const CATEGORIES: CategoryNavConfig[] = [
  {
    id: "security",
    titleKey: "security.title",
    icon: "icon-[lucide--shield-check]",
  },
  {
    id: "developer",
    titleKey: "developer.title",
    icon: "icon-[lucide--code-2]",
  },
  { id: "network", titleKey: "network.title", icon: "icon-[lucide--network]" },
  { id: "general", titleKey: "general.title", icon: "icon-[lucide--sparkles]" },
];

export default function NavbarComponent() {
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const tTools = useTranslations("tools");
  const pathname = usePathname();

  type ToolKey = Parameters<typeof tTools>[0];
  type CategoryKey = Parameters<typeof tCategories>[0];

  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] =
    useState<ToolCategory>("security");
  const [mobileExpandedCat, setMobileExpandedCat] =
    useState<ToolCategory | null>("security");

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const activeCategoryConfig =
    CATEGORIES.find((c) => c.id === activeCategory) ?? CATEGORIES[0];
  const currentCategoryTools = AVAILABLE_TOOLS.filter(
    (t) => t.category === activeCategory,
  );

  return (
    <header className="bg-base-200/90 backdrop-blur-md sticky top-0 z-40 flex w-full border-b border-base-content/10 py-2.5 text-sm">
      <nav className="mx-auto w-full max-w-7xl px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* 1. Navbar Start: Brand Logo */}
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 bg-primary rounded-lg px-1 py-0.5 no-underline tracking-tight"
          >
            <span className="text-xl font-black text-primary-content">
              {process.env.NEXT_PUBLIC_APP_TITLE || "0w"}
            </span>
          </Link>
        </div>

        {/* 2. Navbar End: Apps Dropdown, Login, Theme, Language */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Unified Apps Launcher Button & Popover */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className={`btn btn-sm gap-1.5 p-0 transition-all bg-transparent border-none shadow-none ${
                isOpen
                  ? "text-primary"
                  : "hover:text-base-content/80 text-base-content"
              }`}
              aria-haspopup="menu"
              aria-expanded={isOpen}
            >
              <span className="icon-[lucide--layout-grid] size-6"></span>
            </button>

            {/* Apps Menu Container */}
            {isOpen && (
              <div
                className="max-sm:fixed max-sm:left-4 max-sm:right-4 max-sm:top-14 max-sm:w-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-145 md:w-160 bg-base-100 rounded-2xl border border-base-content/10 shadow-2xl p-3 sm:p-4 z-50 max-h-[82vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
                role="menu"
              >
                {/* Desktop View: Split Two-Pane (Categories -> Tools) */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-4">
                  {/* Left Pane: Categories List */}
                  <div className="sm:col-span-5 flex flex-col gap-1 border-r border-base-content/10 pr-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/40 font-mono px-2 py-1">
                      Categories
                    </span>

                    {CATEGORIES.map((cat) => {
                      const count = AVAILABLE_TOOLS.filter(
                        (t) => t.category === cat.id,
                      ).length;
                      const isSelected = activeCategory === cat.id;
                      const catTitleKey = cat.titleKey as CategoryKey;
                      const catTitle = tCategories.has(catTitleKey)
                        ? tCategories(catTitleKey)
                        : cat.id;

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onMouseEnter={() => setActiveCategory(cat.id)}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-start transition-all ${
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "text-base-content/75 hover:bg-base-200/60 hover:text-base-content"
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className={`${cat.icon} size-4`}></span>
                            <span>{catTitle}</span>
                          </span>
                          <span
                            className={`badge badge-xs font-mono ${
                              isSelected
                                ? "badge-primary badge-soft font-bold"
                                : "badge-neutral badge-soft"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}

                    {/* Bottom Link to Full Tools Grid */}
                    <div className="mt-auto pt-3 border-t border-base-content/10">
                      <Link
                        href="/tools"
                        onClick={() => setIsOpen(false)}
                        className="btn btn-xs btn-outline w-full justify-between font-medium"
                      >
                        <span>{tCommon("allCategories")}</span>
                        <span className="icon-[lucide--arrow-right] size-3"></span>
                      </Link>
                    </div>
                  </div>

                  {/* Right Pane: Tools Submenu for Active Category */}
                  <div className="sm:col-span-7 flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-2 border-b border-base-content/10 px-1">
                      <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                        <span
                          className={`${activeCategoryConfig.icon} size-3.5 text-primary`}
                        ></span>
                        <span>
                          {tCategories(
                            activeCategoryConfig.titleKey as CategoryKey,
                          )}
                        </span>
                      </span>

                      <Link
                        href={`/tools?category=${activeCategory}`}
                        onClick={() => setIsOpen(false)}
                        className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
                      >
                        <span>Filter view</span>
                        <span className="icon-[lucide--arrow-right] size-3"></span>
                      </Link>
                    </div>

                    {/* Scrollable Tool Items */}
                    <div className="grid grid-cols-1 gap-1 max-h-[360px] overflow-y-auto pr-1">
                      {currentCategoryTools.map((tool) => {
                        const titleKey = `${tool.i18nKey}.title` as ToolKey;
                        const descKey = `${tool.i18nKey}.desc` as ToolKey;
                        const title = tTools.has(titleKey)
                          ? tTools(titleKey)
                          : tool.id;
                        const desc = tTools.has(descKey) ? tTools(descKey) : "";

                        return (
                          <Link
                            key={tool.id}
                            href={tool.href}
                            onClick={() => setIsOpen(false)}
                            className="group flex items-start gap-3 p-2 rounded-xl hover:bg-base-200/70 transition-colors text-start"
                          >
                            <div className="size-7 rounded-lg bg-base-200 group-hover:bg-primary/10 text-base-content/70 group-hover:text-primary flex items-center justify-center shrink-0 transition-colors mt-0.5">
                              <span className={`${tool.icon} size-3.5`}></span>
                            </div>

                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-semibold text-base-content group-hover:text-primary transition-colors truncate">
                                  {title}
                                </span>
                                {!tool.networkRequired && (
                                  <span
                                    className="size-1.5 rounded-full bg-success shrink-0"
                                    title="100% Client-Side"
                                  ></span>
                                )}
                              </div>
                              {desc && (
                                <span className="text-[11px] text-base-content/50 line-clamp-1 leading-snug">
                                  {desc}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Mobile View: Collapsible Accordion by Category */}
                <div className="sm:hidden flex flex-col gap-2">
                  <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
                    <span className="text-xs font-bold font-mono text-base-content/50 uppercase">
                      Select Category
                    </span>
                    <Link
                      href="/tools"
                      onClick={() => setIsOpen(false)}
                      className="text-xs text-primary font-medium"
                    >
                      View all ({AVAILABLE_TOOLS.length})
                    </Link>
                  </div>

                  {CATEGORIES.map((cat) => {
                    const tools = AVAILABLE_TOOLS.filter(
                      (t) => t.category === cat.id,
                    );
                    const isExpanded = mobileExpandedCat === cat.id;
                    const catTitleKey = cat.titleKey as CategoryKey;
                    const catTitle = tCategories.has(catTitleKey)
                      ? tCategories(catTitleKey)
                      : cat.id;

                    return (
                      <div
                        key={cat.id}
                        className="border border-base-content/10 rounded-xl overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setMobileExpandedCat(isExpanded ? null : cat.id)
                          }
                          className="w-full flex items-center justify-between p-2.5 bg-base-200/50 text-xs font-semibold text-base-content"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`${cat.icon} size-3.5 text-primary`}
                            ></span>
                            <span>{catTitle}</span>
                          </span>
                          <span
                            className={`icon-[lucide--chevron-down] size-3.5 transition-transform ${
                              isExpanded ? "-rotate-180 text-primary" : ""
                            }`}
                          ></span>
                        </button>

                        {isExpanded && (
                          <div className="p-2 flex flex-col gap-1 bg-base-100">
                            {tools.map((tool) => {
                              const titleKey =
                                `${tool.i18nKey}.title` as ToolKey;
                              const title = tTools.has(titleKey)
                                ? tTools(titleKey)
                                : tool.id;

                              return (
                                <Link
                                  key={tool.id}
                                  href={tool.href}
                                  onClick={() => setIsOpen(false)}
                                  className="flex items-center justify-between p-2 rounded-lg text-xs hover:bg-base-200/70 text-base-content font-medium"
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    <span
                                      className={`${tool.icon} size-3.5 text-base-content/60`}
                                    ></span>
                                    <span className="truncate">{title}</span>
                                  </span>
                                  {!tool.networkRequired && (
                                    <span className="size-1.5 rounded-full bg-success shrink-0"></span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Login Button */}
          <button
            type="button"
            className="btn btn-sm p-0 bg-transparent border-none disabled:cursor-not-allowed"
            disabled
          >
            <span className="icon-[lucide--user] size-6 text-base-content"></span>
          </button>

          {/* Theme Toggle */}
          <ThemeToggleComponent />

          {/* Language Switcher */}
          <Suspense
            fallback={
              <div className="join">
                <span className="join-item btn btn-xs btn-ghost opacity-50">
                  ...
                </span>
              </div>
            }
          >
            <LanguageSwitcher />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
