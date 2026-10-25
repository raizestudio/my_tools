// app/components/NavbarComponent.tsx
"use client";

import Link from "next/link";
import LanguageSwitcher from "@/app/components/LanguageSwitcherComponent";
import ThemeToggleComponent from "@/app/components/ThemeToggleComponent";
import { useI18n } from "@/app/context/I18nContext";

export default function NavbarComponent() {
  const { t } = useI18n();

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
      <div className="navbar-end gap-4">
        <button className="btn btn-sm btn-primary" disabled>
          {t.common.login}
        </button>
        <ThemeToggleComponent />
        <LanguageSwitcher />
      </div>
    </div>
  );
}
