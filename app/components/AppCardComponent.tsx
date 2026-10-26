// app/components/AppCardComponent.tsx
import Link from "next/link";

export type ToolCategory = 'security' | 'developer' | 'network';

export interface AppItem {
  id: string;
  name: string;
  href: string;
  icon: string;
  description: string;
  networkRequired: boolean;
  category: ToolCategory;
}

interface AppCardProps {
  app: AppItem;
  disabled?: boolean;
}

export default function AppCardComponent({ app, disabled = false }: AppCardProps) {
  const cardContent = (
    <div
      className={`card card-border bg-base-100 p-5 flex flex-col justify-between h-full transition-all duration-200 ${
        disabled && app.networkRequired
          ? "opacity-50 grayscale cursor-not-allowed select-none bg-base-200/40"
          : "hover:bg-base-200/60 cursor-pointer group"
      }`}
    >
      {/* Icône + Badge */}
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
            Hors ligne
          </span>
        )}
      </div>

      {/* Titre + Description */}
      <div className="flex flex-col grow">
        <h2
          className={`text-base font-semibold transition-colors ${
            disabled && app.networkRequired
              ? "text-base-content/60"
              : "text-base-content group-hover:text-primary"
          }`}
        >
          {app.name}
        </h2>
        {/* line-clamp-2 assure que le texte ne dépasse pas 2 lignes */}
        <p className="text-xs text-base-content/60 mt-1 line-clamp-2">
          {app.description}
        </p>
      </div>
    </div>
  );

  // Si désactivé, on rend le bloc tel quel avec h-full
  if (disabled && app.networkRequired) {
    return <div className="h-full">{cardContent}</div>;
  }

  // Si actif, le Link prend toute la hauteur de la case de la grille
  return (
    <Link href={app.href} className="h-full block">
      {cardContent}
    </Link>
  );
}
