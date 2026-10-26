// app/components/AppCardComponent.tsx
"use client";

import Link from "next/link";
import { ToolItem } from "@/app/lib/tools";
import { useI18n } from "@/app/context/I18nContext";

interface AppCardProps {
  app: ToolItem;
  disabled?: boolean;
}

export default function AppCardComponent({ app, disabled = false }: AppCardProps) {
  const { t } = useI18n();
  const toolDetails = t.tools[app.i18nKey];

  const cardContent = (
    <div
      className={`card card-border bg-base-100 p-5 flex flex-col justify-between h-full transition-all duration-200 ${
        disabled && app.networkRequired
          ? "opacity-50 grayscale cursor-not-allowed select-none bg-base-200/40"
          : "hover:bg-base-200/60 cursor-pointer group"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`size-10 rounded-lg flex items-center justify-center transition-transform ${
            disabled && app.networkRequired
              ? "bg-base-content/10 text-base-content/40"
              : "bg-primary/10 text-primary group-hover:scale-105"
          }`}
        >
          <span className={`${app.icon} size-5`}></span>
        </div>

        {disabled && app.networkRequired && (
          <span className="badge badge-sm badge-soft badge-warning text-[10px]">
            {t.common.offlineTitle}
          </span>
        )}
      </div>

      <div className="flex flex-col grow">
        <h2
          className={`text-base font-semibold transition-colors ${
            disabled && app.networkRequired
              ? "text-base-content/60"
              : "text-base-content group-hover:text-primary"
          }`}
        >
          {toolDetails?.title ?? app.id}
        </h2>
        <p className="text-xs text-base-content/60 mt-1 line-clamp-2">
          {toolDetails?.desc ?? ""}
        </p>
      </div>
    </div>
  );

  if (disabled && app.networkRequired) {
    return <div className="h-full">{cardContent}</div>;
  }

  return (
    <Link href={app.href} className="h-full block">
      {cardContent}
    </Link>
  );
}
