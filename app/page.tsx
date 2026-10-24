// Components
import AppCardComponent from "@/app/components/AppCardComponent";

interface AppItem {
  id: string;
  name: string;
  href: string;
  icon: string;
  description: string;
}

const availableApps: AppItem[] = [
  {
    id: "url-shtnr",
    name: "URL Shortener",
    href: "/url-shtnr",
    icon: "icon-[lucide--link-2]",
    description: "Raccourcisseur de liens rapide avec 0w.lat",
  },
  // Future tools can be added here easily
];

export default function Home() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-8">
      {availableApps.map((app) => (
        <AppCardComponent key={app.id} app={app} />
      ))}
    </div>
  );
}
