// app/components/AppCardComponent.tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ToolItem } from "@/app/lib/tools";

interface AppCardProps {
  app: ToolItem;
  disabled?: boolean;
}

export default function AppCardComponent({ app, disabled = false }: AppCardProps) {
  const tCommon = useTranslations("common");
  const tTools = useTranslations("tools");

  type ToolKey = Parameters<typeof tTools>[0];

  const titleKey = `${app.i18nKey}.title` as ToolKey;
  const descKey = `${app.i18nKey}.desc` as ToolKey;

  const title = tTools.has(titleKey) ? tTools(titleKey) : app.id;
  const desc = tTools.has(descKey) ? tTools(descKey) : "";

  const isLocked = disabled && app.networkRequired;

  const cardContent = (
    <div
      className={`relative card card-border p-5 rounded-2xl flex flex-col justify-between h-full transition-all duration-200 ease-out overflow-hidden ${
        isLocked
          ? "opacity-50 grayscale cursor-not-allowed select-none bg-base-200/30 border-base-content/10"
          : "bg-base-100/90 border-base-content/10 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:bg-base-100 active:translate-y-0 cursor-pointer group"
      }`}
    >
      {/* 1. Subtle Radial Corner Glow on Hover */}
      {!isLocked && (
        <div
          aria-hidden="true"
          className="absolute -top-10 -right-10 size-24 bg-primary/0 group-hover:bg-primary/10 rounded-full blur-xl pointer-events-none transition-colors duration-300"
        />
      )}

      {/* 2. Top Bar: Icon + Status Indicators */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`size-11 rounded-xl flex items-center justify-center transition-all duration-200 shadow-2xs ${
            isLocked
              ? "bg-base-content/10 text-base-content/40"
              : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content group-hover:scale-105"
          }`}
        >
          <span className={`${app.icon} size-5.5`}></span>
        </div>

        {/* Offline Badge OR Launch Arrow indicator */}
        {isLocked ? (
          <span className="badge badge-xs badge-soft badge-warning font-mono text-[10px] py-2 px-2 gap-1">
            <span className="size-1 rounded-full bg-warning"></span>
            <span>{tCommon("offlineTitle")}</span>
          </span>
        ) : (
          <div className="size-7 rounded-lg bg-base-200/50 flex items-center justify-center text-base-content/40 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
            <span className="icon-[lucide--arrow-up-right] size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"></span>
          </div>
        )}
      </div>

      {/* 3. Text Body */}
      <div className="flex flex-col grow">
        <h2
          className={`text-base font-bold tracking-tight transition-colors ${
            isLocked
              ? "text-base-content/60"
              : "text-base-content group-hover:text-primary"
          }`}
        >
          {title}
        </h2>
        <p className="text-xs text-base-content/65 mt-1.5 leading-relaxed line-clamp-2">
          {desc}
        </p>
      </div>

      {/* 4. Bottom Specs Footer */}
      <div className="mt-4 pt-3.5 border-t border-base-content/5 flex items-center justify-between text-[11px] font-mono text-base-content/40">
        <span className="capitalize">{app.category}</span>
        {app.networkRequired ? (
          <span className="flex items-center gap-1 text-base-content/50">
            <span className="size-1.5 rounded-full bg-warning/80"></span>
            <span>Relay</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-success font-medium">
            <span className="size-1.5 rounded-full bg-success"></span>
            <span>WASM/Local</span>
          </span>
        )}
      </div>
    </div>
  );

  if (isLocked) {
    return <div className="h-full select-none">{cardContent}</div>;
  }

  return (
    <Link href={app.href} className="h-full block no-underline">
      {cardContent}
    </Link>
  );
}
