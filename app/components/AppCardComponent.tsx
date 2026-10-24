// app/components/AppCardComponent.tsx
import Link from "next/link";

export interface AppItem {
  id: string;
  name: string;
  href: string;
  icon: string;
  description: string;
}

interface AppCardProps {
  app: AppItem;
  disabled?: boolean;
}

export default function AppCardComponent({ app, disabled = false }: AppCardProps) {
  const cardContent = (
    <div
      className={`card card-border bg-base-100 p-5 flex flex-col gap-3 transition-all duration-200 ${
        disabled
          ? "opacity-50 grayscale cursor-not-allowed select-none bg-base-200/40"
          : "hover:bg-base-200/60 cursor-pointer group"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`size-10 rounded-lg flex items-center justify-center transition-transform ${
            disabled
              ? "bg-base-content/10 text-base-content/40"
              : "bg-primary/10 text-primary group-hover:scale-105"
          }`}
        >
          <span className={`${app.icon} size-5`}></span>
        </div>

        {disabled && (
          <span className="badge badge-sm badge-soft badge-warning text-[10px]">
            Hors ligne
          </span>
        )}
      </div>

      <div>
        <h2
          className={`text-base font-semibold transition-colors ${
            disabled
              ? "text-base-content/60"
              : "text-base-content group-hover:text-primary"
          }`}
        >
          {app.name}
        </h2>
        <p className="text-xs text-base-content/60 mt-1">
          {app.description}
        </p>
      </div>
    </div>
  );

  // If disabled, render plain element without navigation
  if (disabled) {
    return cardContent;
  }

  return <Link href={app.href}>{cardContent}</Link>;
}
