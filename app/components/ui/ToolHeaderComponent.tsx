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
  return (
    <div
      className={`flex flex-col gap-2 border-b border-base-content/10 pb-6 print:hidden ${className}`}
    >
      <ToolBreadcrumb current={title} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 grow">
          <div className="flex justify-between items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-base-content flex items-center gap-2.5">
              {icon && <span className={`${icon} size-6 text-primary shrink-0`}></span>}
              <span>{title}</span>
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          <p className="text-xs text-base-content/60 leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>

        {actions && (
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
