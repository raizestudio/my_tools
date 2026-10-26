# 0w — Privacy-First Developer & Security Toolbox

> **Zero telemetry. Zero tracking. 100% Client-Side where it matters.**  
> A modern suite of high-utility developer tools built with Next.js 15, designed to inspect, sanitize, encrypt, and convert data without exposing sensitive payloads to third-party servers.

🌐 **Live:** [0w.lat](https://0w.lat)

---

## 🛠 Features & Available Tools

| Tool | Core Capability | Privacy & Tech Highlights |
| :--- | :--- | :--- |
| **HAR Sanitizer & Analyzer** | Inspect & strip sensitive auth tokens, cookies, and secrets from HTTP Archives (`.har`). | Offloads processing to a dedicated **Web Worker**; parses 100MB+ archives in browser memory without freezing the UI. |
| **JWT Inspector & Debugger** | Decode tokens, check RFC 7519 claims, monitor live expiration, and verify signatures. | Zero-knowledge decoding; instant client-side HMAC (HS256/384/512) verification via the **Web Crypto API**. |
| **Encrypted Secret Share** | Share one-time passwords, private keys, or credentials with self-destruct rules. | **AES-GCM 256-bit** client-side encryption. The decryption key stays strictly inside the URL hash fragment (`#`) and is never sent to the backend. |
| **Password & Secret Generator** | Generate character passwords, human-memorable Diceware passphrases, and raw secrets. | Mathematical Shannon entropy estimation; true Diceware wordlists; instant `openssl`-equivalent Hex, Base64, and UUIDv4 generation via `crypto.getRandomValues()`. |
| **JSON Converter & Formatter** | Convert raw JSON into TypeScript interfaces, Pydantic v2 models, or beautified/minified text. | Real-time AST generator running 100% offline with zero server calls. |
| **QR Code & Wi-Fi Card** | Generate printable guest Wi-Fi access cards, URLs, and plain text QR codes. | Pure SVG/Canvas rendering; physical byte capacity validation; printer-friendly stylesheets (`print:hidden`). |
| **Webhook & Request Catcher** | Catch, inspect, and debug external webhooks and HTTP calls in real time. | Low-latency **WebSockets** connection with formatted payload, headers, and query param inspectors. |
| **URL Shortener** | Shorten destination URLs with custom vanity slugs and instant QR code generation. | Fast redirects with client-side domain formatting and QR preview. |
| **EXIF Metadata Cleaner** | Remove GPS coordinates, camera serials, and device metadata from photos. | Client-side metadata stripping using `exifr` and binary blob reconstruction. |

---

## 🏗 Architecture & Design System

* **Strict SSR / Client Boundary:** Static generation and multilingual metadata (`generateMetadata`) run on the server, while crypto and interactive inspectors are isolated in Client Components (`"use client"`).
* **Zero-FOUC Theme Management:** Flash of Unstyled Content (FOUC) is prevented via an early client-mounted script (`ThemeScript`) without triggering React 19 hydration or dynamic navigation console warnings.
* **Full Multi-Language Support:** Fully localized in **English** and **French** using `next-intl` App Router routing (`/[locale]/...`).

---

## ⚡ Tech Stack

* **Framework:** [Next.js 15](https://nextjs.org/) (App Router, React 19)
* **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
* **Localization:** [next-intl](https://next-intl-docs.vercel.app/) (Subpath routing `/en` and `/fr`)
* **Cryptography:** Native browser [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (`SubtleCrypto`, `getRandomValues`)
* **Parallel Processing:** Native in-memory [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
* **Icons:** [Iconify](https://iconify.design/) (`@iconify/tailwind` + Lucide icon set)
* **Backend API (Optional / Hybrid):** FastAPI (used strictly for ephemeral encrypted payload storage, URL shortener persistence, and WebSocket broadcasting).

---

## 🚀 Getting Started

### Prerequisites

* **Node.js:** `v20.x` or higher
* **Package Manager:** `pnpm`, `npm`, or `yarn`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/0w.git
   cd 0w
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the project root:
   ```env
   # Base canonical URL for OpenGraph and Sitemaps
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   # Optional: Ephemeral backend for Secret Sharing, Webhooks & Shortener
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```text
├── app/
│   ├── [locale]/                 # next-intl dynamic route segments
│   │   ├── layout.tsx            # Single RootLayout with <html>, <body>, ThemeScript
│   │   ├── page.tsx              # Toolkit Directory / Homepage
│   │   ├── har-sanitizer/        # HAR Sanitizer page
│   │   ├── jwt-inspector/        # JWT Inspector page
│   │   ├── password-generator/   # Passphrase & Secret generator page
│   │   ├── secret-share/         # AES-GCM Encrypted Sharing page
│   │   ├── json-converter/       # JSON to TypeScript/Pydantic page
│   │   ├── qr-generator/         # QR Code & Wi-Fi Card page
│   │   ├── webhook-catcher/      # WebSocket Request Catcher page
│   │   └── url-shortener/        # URL Shortener page
│   ├── components/
│   │   ├── ui/                   # Reusable UI Blocks (ToolHeader, CopyButton, ToolBreadcrumb)
│   │   ├── navbar/               # Global Navbar & Locale/Theme pickers
│   │   ├── footer/               # Standardized Footer
│   │   ├── har/                  # HarSanitizerComponent + Web Worker definition
│   │   ├── jwt/                  # JwtInspectorComponent
│   │   ├── secret/               # SecretCreateComponent
│   │   ├── password/             # PasswordGeneratorComponent
│   │   ├── json/                 # JsonConverterComponent
│   │   └── qr/                   # QrCodeGeneratorComponent
│   └── lib/
│       ├── crypto.ts             # WebCrypto AES-GCM & HMAC helpers
│       └── i18n/
│           └── locales/          # Localization dictionaries (en.ts, fr.ts)
├── i18n/
│   ├── routing.ts                # next-intl path & locale configuration
│   └── request.ts                # Request configuration for SSR
├── public/                       # Static assets
└── tailwind.config.ts            # Tailwind + Flyonui theme definitions
```

---

## 🔒 Security & Privacy Guarantees

1. **Client-Side Processing:** Files uploaded to the **HAR Sanitizer** or **EXIF Cleaner** never leave your local machine. They are parsed into memory, sanitized, and re-downloaded via object URLs (`blob:`).
2. **True Zero-Knowledge Encryption:** The **Secret Sharing** tool encrypts payloads locally with AES-GCM before making an HTTP POST. The key is appended to the link as a hash parameter (`#<key>`). Browsers never send the hash fragment to HTTP servers, making server-side decryption mathematically impossible.
3. **No External Analytics:** No third-party trackers, beacons, or surveillance cookies are used.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
