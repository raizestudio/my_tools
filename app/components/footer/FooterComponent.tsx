// app/components/footer/FooterComponent.tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {version} from '@/package.json';

const currentYear = new Date().getFullYear();


export default function FooterComponent() {
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");

  return (
    <footer className="w-full bg-base-200/60 border-t border-base-content/10 text-base-content mt-auto">
      {/* 1. Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Manifesto (Spans 2 columns on large screens) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center">
              <Link
                href="/"
                className="flex items-center gap-2 bg-primary rounded-lg px-1 py-0.5 no-underline tracking-tight"
              >
                <span className="text-xl font-black text-primary-content">
                  {process.env.NEXT_PUBLIC_APP_TITLE || "0w"}
                </span>
              </Link>
            </div>

            <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-sm">
              Privacy-first developer utilities and network auditing tools.
              Built to run 100% inside your browser via WebCrypto and WASM,
              backed by stateless, zero-log memory relays.
            </p>

            {/* Architecture Guarantee Badge */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="badge badge-soft badge-success badge-sm gap-1.5 font-mono text-[11px] py-2.5">
                <span className="size-1.5 rounded-full bg-success"></span>
                <span>Zero Telemetry</span>
              </span>
              <span className="badge badge-soft badge-info badge-sm gap-1.5 font-mono text-[11px] py-2.5">
                <span className="icon-[lucide--cpu] size-3"></span>
                <span>Client-Side First</span>
              </span>
            </div>
          </div>

          {/* Column 1: Tool Categories */}
          <div className="flex flex-col gap-3">
            <span className="footer-title text-xs font-mono font-bold tracking-wider uppercase text-base-content/50">
              Categories
            </span>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link
                  href="/tools?category=security"
                  className="link link-hover text-base-content/75 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span className="icon-[lucide--shield-check] size-3.5 text-primary"></span>
                  <span>{tCategories("security.title")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/tools?category=developer"
                  className="link link-hover text-base-content/75 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span className="icon-[lucide--code-2] size-3.5 text-info"></span>
                  <span>{tCategories("developer.title")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/tools?category=network"
                  className="link link-hover text-base-content/75 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span className="icon-[lucide--network] size-3.5 text-warning"></span>
                  <span>{tCategories("network.title")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/tools?category=general"
                  className="link link-hover text-base-content/75 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span className="icon-[lucide--sparkles] size-3.5 text-secondary"></span>
                  <span>{tCategories("general.title")}</span>
                </Link>
              </li>
              <li className="pt-1">
                <Link
                  href="/tools"
                  className="link link-hover text-primary font-semibold flex items-center gap-1"
                >
                  <span>{tCommon("allCategories")}</span>
                  <span className="icon-[lucide--arrow-right] size-3"></span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Key Utilities */}
          <div className="flex flex-col gap-3">
            <span className="footer-title text-xs font-mono font-bold tracking-wider uppercase text-base-content/50">
              Popular Tools
            </span>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link
                  href="/api-runner"
                  className="link link-hover text-base-content/75 hover:text-primary transition-colors"
                >
                  API Runner & Studio
                </Link>
              </li>
              <li>
                <Link
                  href="/pdf-toolkit"
                  className="link link-hover text-base-content/75 hover:text-primary transition-colors"
                >
                  Client-Side PDF Toolkit
                </Link>
              </li>
              <li>
                <Link
                  href="/jwt-inspector"
                  className="link link-hover text-base-content/75 hover:text-primary transition-colors"
                >
                  JWT Decoder & Verifier
                </Link>
              </li>
              <li>
                <Link
                  href="/secret-share"
                  className="link link-hover text-base-content/75 hover:text-primary transition-colors"
                >
                  Zero-Knowledge Secrets
                </Link>
              </li>
              <li>
                <Link
                  href="/dns-auditor"
                  className="link link-hover text-base-content/75 hover:text-primary transition-colors"
                >
                  DNSSEC Chain Auditor
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Open Source & Community */}
          <div className="flex flex-col gap-3">
            <span className="footer-title text-xs font-mono font-bold tracking-wider uppercase text-base-content/50">
              Community
            </span>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <a
                  href="https://github.com/raizestudio/zerow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-hover text-base-content/75 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span className="icon-[lucide--github] size-3.5"></span>
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/raizestudio/zerow/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-hover text-base-content/75 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span className="icon-[lucide--bug] size-3.5"></span>
                  <span>{tCommon("help")}</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/raizestudio/zerow/pulls"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-hover text-base-content/75 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span className="icon-[lucide--git-pull-request] size-3.5"></span>
                  <span>{tCommon("contribute")}</span>
                </a>
              </li>
              <li>
                <a
                  href="https://buymeacoffee.com/joelpinho1h"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-hover text-warning hover:underline font-semibold flex items-center gap-1.5"
                >
                  <span className="icon-[lucide--coffee] size-3.5"></span>
                  <span>{tCommon("buyMeACoffee")}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. Sub-Footer Bar */}
      <div className="border-t border-base-content/10 bg-base-200/90 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-base-content/60">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <span>&copy; {currentYear}</span>
            <Link
              href="/"
              className="font-semibold text-base-content hover:text-primary transition-colors"
            >
              {process.env.NEXT_PUBLIC_APP_TITLE || "0w"}
            </Link>
            <span>—</span>
            <span>Licensed under MIT</span>
            <span>-</span>
            <span>{ version }</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline text-base-content/40">
              No cookies. No telemetry. No database storage.
            </span>
            <a
              href="https://github.com/raizestudio/zerow"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-circle btn-xs bg-base-100 text-base-content/70 hover:text-base-content shadow-none"
              aria-label="GitHub"
            >
              <span className="icon-[lucide--github] size-4"></span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
