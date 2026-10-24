// app/page.tsx
import DashboardGrid from "@/app/components/DashboardGridComponent";
import { AppItem } from "@/app/components/AppCardComponent";

const availableApps: AppItem[] = [
  {
    id: "url-shtnr",
    name: "URL Shortener",
    href: "/url-shtnr",
    icon: "icon-[lucide--link-2]",
    description: "Raccourcisseur de liens rapide avec 0w.lat",
  },
  {
    id: "passwd-generator",
    name: "Password Generator",
    href: "/passwd-generator",
    icon: "icon-[lucide--link-2]",
    description: "Générateur de mots de passe",
  },
];

export default function Home() {
  return (
    <div className="max-w-7xl w-full mx-auto p-6 md:p-8">
      <DashboardGrid apps={availableApps} />
    </div>
  );
}
