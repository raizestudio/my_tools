// app/lib/i18n/locales/en.ts
export const en = {
    meta: {
        title: "0w | Privacy-First Web Toolbox",
        desc: "Fast, secure, and client-side focused developer and privacy utilities with zero tracking.",
    },
    common: {
        home: "Home",
        offlineTitle: "Backend server offline",
        offlineDesc: "API-dependent tools are temporarily unavailable.",
        copy: "Copy",
        copied: "Copied!",
        login: "Login",
        tools: "Outils",
        allCategories: "All",
        searchPlaceholder: "Search tool...",
        noResults: "No results found",
        clearSearch: "Reset",
        help: "Help",
        contribute: "Contribute",
        buyMeACoffee: "Buy me a coffee",
    },
    privacyNotice: {
        badge: "Privacy-First Architecture",
        title: "Zero-Knowledge & Data Privacy",
        subtitle:
            "0w is built with an uncompromising focus on privacy and client-side processing.",
        points: [
            {
                icon: "icon-[lucide--cpu]",
                title: "Client-Side Execution",
                desc: "JWT inspection, JSON conversions, and password generation happen entirely inside your browser sandbox.",
            },
            {
                icon: "icon-[lucide--flame]",
                title: "Ephemeral Storage",
                desc: "Encrypted secrets and temporary webhooks are stored using strict time-to-live policies and auto-purged on schedule.",
            },
            {
                icon: "icon-[lucide--shield-off]",
                title: "Zero Tracking",
                desc: "No advertising networks, no third-party profiling cookies, and no telemetry selling.",
            },
        ],
        supportTitle: "Independent & Open Source",
        supportDesc:
            "0w is completely ad-free and community-driven. If these tools help your workflow, consider starring the repo or buying a coffee to support infrastructure costs.",
        button: "I Understand & Continue",
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
        passwordGenerator: {
          title: "Password & Secret Generator",
          desc: "Generate cryptographically secure passwords, human-friendly Diceware passphrases, and raw secrets.",
          tabPassword: "Password",
          tabPassphrase: "Passphrase (Diceware)",
          tabSecret: "Dev Secret",

          // Password Mode
          length: "Length: {length}",
          uppercase: "Uppercase (A-Z)",
          lowercase: "Lowercase (a-z)",
          numbers: "Numbers (0-9)",
          symbols: "Symbols (!@#$...)",
          avoidAmbiguous: "Exclude ambiguous chars (0, O, 1, l, I)",

          // Passphrase Mode
          wordsCount: "Words count: {count}",
          separator: "Separator",
          separatorHyphen: "Hyphen (-)",
          separatorDot: "Dot (.)",
          separatorUnderscore: "Underscore (_)",
          separatorSpace: "Space ( )",
          capitalize: "Capitalize words",
          includeNumber: "Include random number",

          // Secret Mode
          secretType: "Secret Format",
          bytesCount: "Entropy size: {bytes} bytes ({bits} bits)",
          formatHex: "Hex (e.g. openssl rand -hex)",
          formatBase64: "Base64",
          formatBase64Url: "Base64URL (JWT secret)",
          formatUuid: "UUID v4",

          // Output & Entropy
          regenerate: "Regenerate",
          copy: "Copy",
          copied: "Copied!",
          entropyBits: "{bits} bits of entropy",
          strengthWeak: "Weak",
          strengthFair: "Fair",
          strengthStrong: "Strong",
          strengthCryptographic: "Cryptographic",
          estimatedCrackTime: "Offline GPU crack estimate: {time}",
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
        exifCleaner: {
          title: "EXIF Stripper & Inspector",
          desc: "Inspect and purge GPS coordinates, device data, and private metadata from your photos.",
          dropzone: "Drop an image here or click to browse",
          dropzoneHint: "Supports JPEG, PNG, WebP — Inspected and stripped 100% offline in your browser",
          inspecting: "Analyzing metadata...",
          cleaning: "Stripping metadata...",
          auditTitle: "Metadata Audit",
          metadataFoundTitle: "Detected Metadata ({count} tags)",
          noMetadataTitle: "No Metadata Detected",
          noMetadataDesc: "This image contains no EXIF, GPS, or camera tags. It is already safe to share!",
          gpsAlertTitle: "Precise GPS Location Detected",
          gpsAlertDesc: "This photo exposes the exact coordinates where it was taken.",
          viewOnMap: "View on OpenStreetMap",
          device: "Camera / Device",
          capturedAt: "Date Taken",
          software: "Software",
          lens: "Lens",
          exposure: "Exposure",
          rawTags: "All Raw Tags ({count})",
          stripAndDownload: "Strip Metadata & Download",
          cleanSuccessBadge: "Sanitized",
          cleanedSuccessTitle: "Metadata Successfully Purged",
          originalSize: "Original size",
          cleanedSize: "Cleaned size",
          cleanedFileNameSuffix: "_cleaned",
          newImage: "Inspect another image",
        },
    },
};
