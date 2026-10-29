// app/components/UrlShortenerComponent.tsx
"use client";

import { useState, FormEvent, useRef } from "react";
import { useTranslations } from "next-intl";
import { QRCodeCanvas } from "qrcode.react";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";

type ExpiryOption = "1h" | "24h" | "7d" | "30d" | "never";

interface ShortenResult {
  short_code: string;
  short_url: string;
  original_url: string;
  expires_at?: string | null;
  burn_after_reading?: boolean;
}

const EXPIRY_PRESETS: { id: ExpiryOption; label: string; sub: string }[] = [
  { id: "1h", label: "1h", sub: "1 Hour" },
  { id: "24h", label: "24h", sub: "24 Hours" },
  { id: "7d", label: "7d", sub: "7 Days (Default)" },
  { id: "30d", label: "30d", sub: "30 Days" },
  { id: "never", label: "∞", sub: "No Expiration" },
];

export default function UrlShortenerComponent() {
  const t = useTranslations("tools.urlShortener");

  const [url, setUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [expiresIn, setExpiresIn] = useState<ExpiryOption>("7d");
  const [burnAfterReading, setBurnAfterReading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const qrContainerRef = useRef<HTMLDivElement>(null);

  function validateAndFormatUrl(rawUrl: string): {
    valid: boolean;
    formattedUrl?: string;
    errorKey?: string;
  } {
    let input = rawUrl.trim();
    if (!input) {
      return { valid: false, errorKey: "errorEmpty" };
    }

    input = input.replace(/^(https?)\/{1,2}/i, "$1://");

    if (!/^https?:\/\//i.test(input)) {
      input = `https://${input}`;
    }

    try {
      const parsed = new URL(input);

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { valid: false, errorKey: "errorProtocol" };
      }

      const isLocalhost = parsed.hostname === "localhost";
      const hasValidDomain =
        parsed.hostname.includes(".") &&
        parsed.hostname.split(".").pop()!.length >= 2;

      if (!isLocalhost && !hasValidDomain) {
        return { valid: false, errorKey: "errorDomain" };
      }

      return { valid: true, formattedUrl: parsed.href };
    } catch {
      return { valid: false, errorKey: "errorInvalid" };
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const { valid, formattedUrl, errorKey } = validateAndFormatUrl(url);

    if (!valid || !formattedUrl) {
      setError(errorKey ? t(errorKey) : t("errorInvalid"));
      return;
    }

    setLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/url-shtnr/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: formattedUrl,
          custom_code: customCode.trim() || undefined,
          expires_in: expiresIn,
          burn_after_reading: burnAfterReading,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || t("errorGeneric"));
      }

      setResult({
        short_code: data.short_code,
        short_url: `${window.location.origin}/u/${data.short_code}`,
        original_url: data.original_url,
        expires_at: data.expires_at,
        burn_after_reading: data.burn_after_reading,
      });

      setUrl("");
      setCustomCode("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("errorGeneric"));
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result?.short_url) return;
    await navigator.clipboard.writeText(result.short_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleReset = () => {
    setResult(null);
    setUrl("");
    setCustomCode("");
    setExpiresIn("7d");
    setBurnAfterReading(false);
    setError(null);
    setShowQr(false);
  };

  const downloadQrCode = () => {
    const canvas = qrContainerRef.current?.querySelector("canvas");
    if (!canvas || !result) return;
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `0w-${result.short_code}-qr.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col gap-8 isolate">
      {/* Ambient Radial Halo */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-1"
      />

      {/* Tool Header */}
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--link-2]"
        badge={
          <span className="badge badge-sm badge-soft badge-primary font-mono font-semibold px-2.5 py-1">
            {t("badge")}
          </span>
        }
      />

      {/* Main Console Box */}
      {!result ? (
        <form
          onSubmit={handleSubmit}
          className="card card-border bg-base-200/50 backdrop-blur-md border-base-content/10 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col gap-6"
        >
          {/* Top Protocol Indicator */}
          <div className="flex items-center justify-between pb-3 border-b border-base-content/5 text-xs">
            <span className="font-mono font-bold text-base-content/40 tracking-wider uppercase text-[11px]">
              01 // DISPATCH CONFIGURATION
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-success">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              <span>ZERO_TRACKING</span>
            </div>
          </div>

          {/* 1. Primary URL Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-base-content flex items-center justify-between">
              <span>{t("inputLabel")}</span>
              <span className="text-[11px] font-mono text-base-content/40 font-normal">
                http(s)://
              </span>
            </label>
            <div className="group relative flex items-center">
              <span className="icon-[lucide--globe] size-4 absolute left-3.5 text-base-content/40 group-focus-within:text-primary transition-colors pointer-events-none z-10"></span>
              <input
                type="text"
                placeholder={t("inputPlaceholder")}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="input input-md w-full pl-10 pr-10 font-mono text-xs rounded-xl bg-base-200/40 border border-base-content/10 focus:border-primary/50 focus:outline-none focus:ring-0 transition-colors duration-150"
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl("")}
                  className="btn btn-circle btn-xs bg-transparent border-transparent shadow-none size-6 absolute right-2.5 text-base-content/40 hover:text-base-content z-10"
                >
                  <span className="icon-[lucide--x] size-3.5"></span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Custom Alias & Security Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Custom Alias Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-base-content flex items-center justify-between">
                <span>{t("customCodeLabel")}</span>
                <span className="badge badge-xs badge-neutral badge-soft font-mono text-[10px]">
                  OPTIONAL
                </span>
              </label>
              <div className="flex items-center rounded-xl bg-base-200/40 border border-base-content/10 focus-within:border-primary/50 transition-all overflow-hidden px-3 py-1.5">
                <span className="text-xs font-mono text-base-content/40 select-none flex items-center gap-1 pr-2 border-r border-base-content/10">
                  <span className="icon-[lucide--hash] size-3 text-primary"></span>
                  <span>{t("customCodePrefix")}</span>
                </span>
                <input
                  type="text"
                  placeholder={t("customCodePlaceholder")}
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="input input-sm border-none bg-transparent font-mono text-xs flex-1 focus:outline-none px-2.5 focus-within:shadow-none"
                />
              </div>
            </div>

            {/* Burn-After-Reading Switch */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-base-content flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="icon-[lucide--flame] size-3.5 text-warning"></span>
                  <span>Self-Destruct</span>
                </span>
                <span
                  className={`badge badge-xs font-mono text-[10px] ${
                    burnAfterReading
                      ? "badge-warning font-bold"
                      : "badge-neutral badge-soft"
                  }`}
                >
                  {burnAfterReading ? "ARMED" : "OFF"}
                </span>
              </label>

              <label
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                  burnAfterReading
                    ? "bg-warning/10 border-warning/30 text-base-content"
                    : "bg-base-200/40 border-base-content/10 hover:border-base-content/20 text-base-content/75"
                }`}
              >
                <div className="flex flex-col pr-2">
                  <span className="text-xs font-semibold">
                    Burn After Reading
                  </span>
                  <span className="text-[10px] text-base-content/50">
                    Purges permanently after 1st click
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={burnAfterReading}
                  onChange={(e) => setBurnAfterReading(e.target.checked)}
                  className="toggle toggle-warning toggle-sm"
                />
              </label>
            </div>
          </div>

          {/* 3. Link Expiration (TTL Presets) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-base-content flex items-center gap-1.5">
                <span className="icon-[lucide--clock] size-3.5 text-primary"></span>
                <span>Link Expiration (TTL)</span>
              </label>
              <span className="text-[11px] font-mono text-base-content/40">
                {burnAfterReading
                  ? "Max fallback window"
                  : "Auto-deletion timer"}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {EXPIRY_PRESETS.map((preset) => {
                const isSelected = expiresIn === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setExpiresIn(preset.id)}
                    title={preset.sub}
                    className={`btn btn-sm flex flex-col items-center justify-center h-auto py-2 rounded-xl transition-all ${
                      isSelected
                        ? "btn-primary shadow-xs font-semibold"
                        : "btn-soft text-base-content/70 hover:bg-base-200/80 border border-base-content/5"
                    }`}
                  >
                    <span className="font-mono text-xs">{preset.label}</span>
                    <span className="text-[9px] opacity-60 hidden sm:inline truncate max-w-full">
                      {preset.id === "never" ? "No limit" : preset.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="alert alert-soft alert-error text-xs p-3.5 rounded-xl flex items-center gap-2.5 border border-error/20 animate-in fade-in duration-200">
              <span className="icon-[lucide--alert-triangle] size-4 shrink-0 text-error"></span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-base-content/5 mt-2">
            <span className="text-[11px] font-mono text-base-content/40 hidden sm:inline">
              Zero logs • Encrypted memory relay
            </span>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="btn btn-primary btn-md gap-2 font-semibold rounded-xl px-6 shadow-sm shadow-primary/20 w-full sm:w-auto transition-transform hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner size-4"></span>
                  <span>{t("shortening")}</span>
                </>
              ) : (
                <>
                  <span className="icon-[lucide--scissors] size-4"></span>
                  <span>{t("submit")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Result Console Card */
        <div className="card card-border bg-base-100/90 backdrop-blur-md border-base-content/10 p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Top Status Header */}
          <div className="flex items-center justify-between pb-3 border-b border-base-content/5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success animate-ping" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-success">
                STATUS: 201 // LINK_DISPATCHED
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {result.burn_after_reading && (
                <span className="badge badge-xs badge-warning font-mono font-bold py-1 px-2 gap-1 animate-pulse">
                  <span className="icon-[lucide--flame] size-2.5"></span>
                  <span>SINGLE_USE</span>
                </span>
              )}
              <span className="badge badge-xs badge-soft badge-success font-mono font-semibold py-1 px-2">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Primary Short Link Output Box */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-base-content flex items-center gap-1.5">
              <span className="icon-[lucide--sparkles] size-3.5 text-primary"></span>
              <span>{t("shortUrlLabel")}</span>
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-base-200/50 p-2 sm:p-2.5 rounded-2xl border border-base-content/10 focus-within:border-primary/40 transition-colors">
              <div className="flex items-center gap-2 flex-1 px-2.5 min-w-0">
                <span className="icon-[lucide--link] size-4 text-primary shrink-0"></span>
                <input
                  type="text"
                  readOnly
                  value={result.short_url}
                  className="bg-transparent font-mono text-sm font-semibold flex-1 outline-none text-primary select-all truncate"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-base-content/5">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className={`btn btn-sm ${
                    copied
                      ? "btn-success font-semibold"
                      : "btn-primary font-semibold shadow-xs"
                  } rounded-xl gap-1.5 px-3.5 transition-all`}
                >
                  <span
                    className={`icon-[lucide--${
                      copied ? "check" : "copy"
                    }] size-4`}
                  ></span>
                  <span>{copied ? t("copied") : t("copy")}</span>
                </button>

                <a
                  href={result.short_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-soft btn-neutral rounded-xl border border-base-content/10 gap-1.5 px-3"
                  title="Open in new tab"
                >
                  <span className="icon-[lucide--external-link] size-4"></span>
                  <span className="hidden sm:inline">{t("open")}</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className={`btn btn-sm ${
                    showQr ? "btn-neutral" : "btn-soft btn-neutral"
                  } rounded-xl border border-base-content/10 gap-1.5 px-3`}
                  title="Toggle QR Code"
                >
                  <span className="icon-[lucide--qr-code] size-4"></span>
                  <span className="hidden sm:inline">
                    {showQr ? t("hideQr") : t("showQr")}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Security & Target Diagnostics Banner */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-base-200/30 border border-base-content/5 text-xs font-mono">
            {/* Target URL */}
            <div className="flex items-center gap-2 min-w-0 text-base-content/60">
              <span className="icon-[lucide--corner-down-right] size-3.5 text-base-content/40 shrink-0"></span>
              <span className="shrink-0 text-base-content/40">
                {t("targetLabel")}
              </span>
              <span className="truncate text-base-content/80 select-all">
                {result.original_url}
              </span>
            </div>

            {/* Expiration or Burn-on-read Notice */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-base-content/5 text-[11px]">
              <div className="flex items-center gap-1.5 text-base-content/50">
                <span className="icon-[lucide--timer] size-3.5"></span>
                <span>
                  {result.expires_at
                    ? `Expires: ${new Date(result.expires_at).toLocaleString()}`
                    : "Expiration: None (Persistent)"}
                </span>
              </div>

              {result.burn_after_reading && (
                <span className="text-warning flex items-center gap-1 font-semibold">
                  <span className="icon-[lucide--flame] size-3"></span>
                  <span>Self-destructs after first click</span>
                </span>
              )}
            </div>
          </div>

          {/* Expandable QR Code Matrix Module */}
          {showQr && (
            <div
              ref={qrContainerRef}
              className="flex flex-col items-center justify-center p-6 sm:p-8 bg-base-200/40 rounded-2xl border border-base-content/10 gap-4 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="p-3 bg-white rounded-2xl shadow-md border border-neutral-200">
                <QRCodeCanvas
                  value={result.short_url}
                  size={180}
                  level="M"
                  marginSize={8}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-base-content/70">
                  {result.short_url}
                </span>
                <button
                  type="button"
                  onClick={downloadQrCode}
                  className="btn btn-xs btn-outline rounded-lg gap-1 font-mono text-[11px]"
                >
                  <span className="icon-[lucide--download] size-3"></span>
                  <span>PNG</span>
                </button>
              </div>
            </div>
          )}

          {/* Card Footer: Reset / New Link CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-base-content/5">
            <span className="text-[11px] font-mono text-base-content/40">
              ID: {result.short_code}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-ghost btn-sm rounded-xl text-base-content/70 hover:text-base-content gap-2"
            >
              <span className="icon-[lucide--plus] size-4"></span>
              <span>{t("newLink")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
