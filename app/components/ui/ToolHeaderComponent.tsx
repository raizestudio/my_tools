// app/components/ui/ToolHeader.tsx
"use client";

import { ReactNode } from "react";
import ToolBreadcrumb from "@/app/components/ui/ToolBreadcrumbComponent";

interface ToolHeaderProps {
  title: string;
  description: string;
  icon?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function ToolHeader({
  title,
  description,
  icon,
  badge,
  actions,
  className = "",
}: ToolHeaderProps) {
  const hasRightColumn = Boolean(badge || actions);

  return (
    <div
      className={`flex flex-col gap-3 border-b border-base-content/10 pb-6 print:hidden ${className}`}
    >
      <ToolBreadcrumb current={title} />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Colonne Gauche : Titre & Description */}
        <div className="flex flex-col gap-1.5 grow min-w-0">
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2.5">
            {icon && <span className={`${icon} size-6 text-primary shrink-0`}></span>}
            <span className="truncate">{title}</span>
          </h1>
          <p className="text-xs text-base-content/60 leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>

        {/* Colonne Droite : Badge en haut à droite, Actions en dessous */}
        {hasRightColumn && (
          <div className="flex flex-wrap md:flex-col items-start md:items-end justify-between md:justify-start gap-2.5 shrink-0 self-stretch md:self-auto">
            {badge && <div>{badge}</div>}
            {actions && (
              <div className="flex items-center gap-2 flex-wrap">
                {actions}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
