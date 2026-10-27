// app/components/ui/ToolBreadcrumbComponent.tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

interface ToolBreadcrumbProps {
  current: string;
}

export default function ToolBreadcrumb({ current }: ToolBreadcrumbProps) {
  const t = useTranslations("common");

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-1">
      <Link
        href="/"
        className="text-xs text-base-content/60 hover:text-primary transition-colors"
      >
        {t("home")}
      </Link>
      <span className="text-xs text-base-content/30 select-none">/</span>
      <span className="text-xs text-primary font-medium truncate max-w-50 sm:max-w-none">
        {current}
      </span>
    </nav>
  );
}
