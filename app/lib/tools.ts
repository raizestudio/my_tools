// app/lib/tools.ts
import { Dictionary } from "@/app/lib/i18n/types";

export type ToolCategory = "general" | "security" | "developer" | "network";

export interface ToolItem {
    id: string;
    i18nKey: keyof Dictionary["tools"];
    href: string;
    icon: string;
    category: ToolCategory;
    networkRequired: boolean;
}

export const AVAILABLE_TOOLS: ToolItem[] = [
    // General
    {
        id: "pdf-toolkit",
        href: "/pdf-toolkit",
        icon: "icon-[lucide--file-stack]",
        i18nKey: "pdfToolkit",
        category: "general",
        networkRequired: false,
    },
    // --- Security & Privacy ---
    {
        id: "passwd-generator",
        i18nKey: "passwordGenerator",
        href: "/passwd-generator",
        icon: "icon-[lucide--lock]",
        category: "security",
        networkRequired: false,
    },
    {
        id: "secret-share",
        i18nKey: "secretShare",
        href: "/secret-share",
        icon: "icon-[lucide--shield-alert]",
        category: "security",
        networkRequired: true,
    },
    {
        id: "exif-cleaner",
        href: "/exif-cleaner",
        icon: "icon-[lucide--image-minus]",
        category: "security",
        i18nKey: "exifCleaner",
        networkRequired: false,
    },
    {
        id: "har-sanitize",
        i18nKey: "harSanitizer",
        href: "/har-sanitize",
        icon: "icon-[lucide--shield-check]",
        category: "security",
        networkRequired: false,
    },
    {
        id: "cert-inspector",
        i18nKey: "certInspector",
        href: "/cert-inspector",
        icon: "icon-[lucide--shield-alert]",
        category: "security",
        networkRequired: false,
    },
    {
        id: "browser-leak-detector",
        i18nKey: "privacyAuditor",
        href: "/browser-leak-detector",
        icon: "icon-[lucide--scan-eye]",
        category: "security",
        networkRequired: false,
    },
    {
        id: "hex-analyzer",
        i18nKey: "hexAnalyzer",
        href: "/hex-analyzer",
        icon: "icon-[lucide--binary]",
        category: "security",
        networkRequired: false,
    },

    // --- Developer Utilities ---
    {
        id: "json-converter",
        i18nKey: "jsonConverter",
        href: "/json-converter",
        icon: "icon-[lucide--code-xml]",
        category: "developer",
        networkRequired: false,
    },
    {
        id: "webhook-catcher",
        i18nKey: "webhookCatcher",
        href: "/webhook-catcher",
        icon: "icon-[lucide--radio]",
        category: "developer",
        networkRequired: true,
    },
    {
        id: "jwt-inspector",
        i18nKey: "jwtInspector",
        href: "/jwt-inspector",
        icon: "icon-[lucide--key-round]",
        category: "developer",
        networkRequired: false,
    },
    {
        id: "cron-builder",
        i18nKey: "cronBuilder",
        href: "/cron-builder",
        icon: "icon-[lucide--clock]",
        category: "developer",
        networkRequired: false,
    },

    // --- Web & Network ---
    {
        id: "url-shtnr",
        i18nKey: "urlShortener",
        href: "/url-shtnr",
        icon: "icon-[lucide--link-2]",
        category: "network",
        networkRequired: true,
    },
    {
        id: "qr-code",
        i18nKey: "qrCode",
        href: "/qr-code",
        icon: "icon-[lucide--qr-code]",
        category: "network",
        networkRequired: false,
    },
];
