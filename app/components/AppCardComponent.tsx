// app/components/AppCardComponent.tsx
import Link from "next/link";

interface AppCardProps {
  app: {
    id: string;
    name: string;
    href: string;
    icon: string;
    description: string;
  };
}

export default function AppCardComponent({ app }: AppCardProps) {
  return (
    <Link
      href={app.href}
      className="card card-border bg-base-100 hover:bg-base-200/60 transition-all duration-200 p-5 flex flex-col gap-3 group"
    >
      <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
        <span className={`${app.icon} size-5`}></span>
      </div>

      <div>
        <h2 className="text-base font-semibold text-base-content group-hover:text-primary transition-colors">
          {app.name}
        </h2>
        <p className="text-xs text-base-content/60 mt-1">
          {app.description}
        </p>
      </div>
    </Link>
  );
}
