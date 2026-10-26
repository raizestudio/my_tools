// app/components/navbar/NavbarComponent.tsx
"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import LanguageSwitcher from "@/app/components/LanguageSwitcherComponent";
import ThemeToggleComponent from "@/app/components/ThemeToggleComponent";

export default function NavbarComponent() {
  const t = useTranslations("common");

  return (
    <div className="navbar bg-base-200">
      <div className="navbar-start">
        <Link href="/" className="text-xl font-black text-base-content">
          {process.env.NEXT_PUBLIC_APP_TITLE}
        </Link>
      </div>
      <div className="navbar-center">
        {/*<button className="btn btn-sm">Apps</button>*/}
      </div>
      <div className="navbar-end items-center gap-4">
        <button className="btn btn-sm btn-primary" disabled>
          {t("login")}
        </button>
        <ThemeToggleComponent />
        <Suspense
          fallback={
            <div className="join">
              <span className="join-item btn btn-xs btn-ghost opacity-50">...</span>
            </div>
          }
        >
          <LanguageSwitcher />
        </Suspense>
      </div>
    </div>
  );
}
