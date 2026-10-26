// app/page.tsx
import DashboardGrid from "@/app/components/DashboardGridComponent";
import { AppItem } from "@/app/components/AppCardComponent";

const availableApps: AppItem[] = [
    // --- Security & Privacy ---
    {
        id: "passwd-generator",
        name: "Password Generator",
        href: "/passwd-generator",
        icon: "icon-[lucide--lock]",
        description:
            "Générateur de mots de passe aléatoires et phrases de passe sécurisées.",
        networkRequired: false,
        category: "security",
    },
    {
        id: "secret-share",
        name: "Secret Sharing",
        href: "/secret-share",
        icon: "icon-[lucide--shield-alert]",
        description:
            "Partagez des identifiants chiffrés de bout en bout avec autodestruction.",
        networkRequired: true,
        category: "security",
    },

    // --- Developer Utilities ---
    {
        id: "json-converter",
        name: "JSON Converter",
        description:
            "Formatez et convertissez du JSON vers TypeScript ou Pydantic v2.",
        href: "/json-converter",
        icon: "icon-[lucide--code-xml]",
        networkRequired: false,
        category: "developer",
    },
    {
        id: "webhook-catcher",
        name: "Webhook Catcher",
        href: "/webhook-catcher",
        icon: "icon-[lucide--radio]",
        description:
            "Testez et inspectez des requêtes HTTP et webhooks en direct via WebSockets.",
        networkRequired: true,
        category: "developer",
    },

    // --- Web & Network ---
    {
        id: "url-shtnr",
        name: "URL Shortener",
        href: "/url-shtnr",
        icon: "icon-[lucide--link-2]",
        description:
            "Raccourcisseur de liens rapide avec domaine personnalisé 0w.lat.",
        networkRequired: true,
        category: "network",
    },
    {
        id: "qr-code",
        name: "QR Code & Wi-Fi Card",
        href: "/qr-code",
        icon: "icon-[lucide--qr-code]",
        description:
            "Générez des QR codes pour liens et créez une fiche de connexion Wi-Fi.",
        networkRequired: false,
        category: "network",
    },
];

export default function Home() {
    return (
        <div className="max-w-7xl w-full mx-auto p-6 md:p-8">
            <DashboardGrid apps={availableApps} />
        </div>
    );
}
