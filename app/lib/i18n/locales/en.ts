// app/lib/i18n/locales/en.ts
export const en = {
    common: {
        offlineTitle: "Backend server offline",
        offlineDesc: "API-dependent tools are temporarily unavailable.",
        copy: "Copy",
        copied: "Copied!",
        login: "Login",
        allCategories: "All",
        searchPlaceholder: "Search tool...",
        noResults: "No results found",
        clearSearch: "Reset",
        help: "Help",
        contribute: "Contribute",
        buyMeACoffee: "Buy me a coffee",
    },
    privacyNotice: {
      badge: 'Privacy-First Architecture',
      title: 'Zero-Knowledge & Data Privacy',
      subtitle: '0w is built with an uncompromising focus on privacy and client-side processing.',
      points: [
        {
          icon: 'icon-[lucide--cpu]',
          title: 'Client-Side Execution',
          desc: 'JWT inspection, JSON conversions, and password generation happen entirely inside your browser sandbox.',
        },
        {
          icon: 'icon-[lucide--flame]',
          title: 'Ephemeral Storage',
          desc: 'Encrypted secrets and temporary webhooks are stored using strict time-to-live policies and auto-purged on schedule.',
        },
        {
          icon: 'icon-[lucide--shield-off]',
          title: 'Zero Tracking',
          desc: 'No advertising networks, no third-party profiling cookies, and no telemetry selling.',
        },
      ],
      supportTitle: 'Independent & Open Source',
      supportDesc: '0w is completely ad-free and community-driven. If these tools help your workflow, consider starring the repo or buying a coffee to support infrastructure costs.',
      button: 'I Understand & Continue',
    },
    categories: {
        security: {
            title: "Security & Privacy",
            desc: "Client-side cryptography, credential generation, and zero-knowledge sharing.",
        },
        developer: {
            title: "Developer Utilities",
            desc: "Formatters, parsers, and live HTTP debugging utilities.",
        },
        network: {
            title: "Web & Network",
            desc: "Link redirection, QR cards, and networking utilities.",
        },
    },
    tools: {
        urlShortener: {
            title: "URL Shortener",
            desc: "Fast URL shortening with custom vanity slugs.",
        },
        passwdGenerator: {
            title: "Password Generator",
            desc: "Generate secure random passwords and passphrases in your browser.",
        },
        jsonConverter: {
            title: "JSON Converter & Formatter",
            desc: "Generate TypeScript interfaces and Pydantic v2 models directly from raw JSON.",
        },
        qrCode: {
            title: "QR Code & Wi-Fi Card",
            desc: "Generate QR codes for links and create printable Wi-Fi sign-in sheets.",
        },
        secretShare: {
            title: "End-to-End Encrypted Secret Sharing",
            desc: "Share sensitive credentials with client-side AES-GCM and zero-knowledge self-destruction.",
        },
        webhookCatcher: {
            title: "Webhook Catcher",
            desc: "Inspect incoming HTTP requests and webhooks in real time via WebSockets.",
        },
        jwtInspector: {
            title: "JWT Inspector & Debugger",
            desc: "Decode, inspect claims, and verify JSON Web Token signatures locally in your browser.",
        },
    },
};
