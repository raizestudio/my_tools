// app/components/UrlShortenerComponent.tsx
"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { QRCodeCanvas } from "qrcode.react";

import ToolHeader from "@/app/components/ui/ToolHeaderComponent";

interface ShortenResult {
  short_code: string;
  short_url: string;
  original_url: string;
}

export default function UrlShortenerComponent() {
  const t = useTranslations("tools.urlShortener");

  const [url, setUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/url-shtnr/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: formattedUrl,
          custom_code: customCode.trim() || undefined,
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
    setError(null);
    setShowQr(false);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      {/* Header & Fil d'Ariane */}
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--link-2]"
        badge={
          <span className="badge badge-sm badge-soft badge-primary">
            {t("badge")}
          </span>
        }
      />

      {/* Main Content */}
      {!result ? (
        <form
          onSubmit={handleSubmit}
          className="card card-border bg-base-100 p-6 flex flex-col gap-5 shadow-sm"
        >
          {/* Champ URL Principale */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-base-content/70">
              {t("inputLabel")}
            </label>
            <input
              type="text"
              placeholder={t("inputPlaceholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="input input-sm sm:input-md input-bordered font-mono text-xs w-full focus:outline-primary"
            />
          </div>

          {/* Alias Personnalisé (Optionnel) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-base-content/70">
              {t("customCodeLabel")}
            </label>
            <div className="flex items-center gap-0 bg-base-200/50 rounded-lg border border-base-content/10 overflow-hidden focus-within:border-primary">
              <span className="text-xs font-mono text-base-content/50 px-3 select-none">
                {t("customCodePrefix")}
              </span>
              <input
                type="text"
                placeholder={t("customCodePlaceholder")}
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="input input-sm bg-transparent border-0 font-mono text-xs flex-1 focus:outline-none px-1"
              />
            </div>
          </div>

          {/* Alerte Erreur */}
          {error && (
            <div className="alert alert-soft alert-error text-xs p-3 flex items-center gap-2">
              <span className="icon-[lucide--alert-circle] size-4 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Bouton de Soumission */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="btn btn-primary btn-sm gap-2 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner size-4"></span>
                  {t("shortening")}
                </>
              ) : (
                <>
                  <span className="icon-[lucide--scissors] size-4"></span>
                  {t("submit")}
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* État post-génération : Résultat & Partage */
        <div className="card card-border bg-base-100 p-6 flex flex-col gap-5 shadow-sm animate-in fade-in duration-200">
          <div className="alert alert-soft alert-success flex items-center gap-3 p-4">
            <span className="icon-[lucide--check-circle-2] size-5 text-success shrink-0"></span>
            <span className="font-semibold text-xs text-base-content">
              {t("successTitle")}
            </span>
          </div>

          {/* Boîte Lien Court */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-base-content/70">
              {t("shortUrlLabel")}
            </label>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-base-200/50 p-2 rounded-lg border border-base-content/10">
              <input
                type="text"
                readOnly
                value={result.short_url}
                className="bg-transparent font-mono text-xs flex-1 outline-none text-primary select-all px-2 truncate min-w-50"
              />

              <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className={`btn btn-xs sm:btn-sm ${
                    copied ? "btn-success" : "btn-primary"
                  } gap-1.5`}
                >
                  <span
                    className={`icon-[lucide--${
                      copied ? "check" : "copy"
                    }] size-3.5`}
                  ></span>
                  <span>{copied ? t("copied") : t("copy")}</span>
                </button>

                <a
                  href={result.short_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-xs sm:btn-sm btn-outline gap-1.5"
                >
                  <span className="icon-[lucide--external-link] size-3.5"></span>
                  <span>{t("open")}</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className={`btn btn-xs sm:btn-sm ${
                    showQr ? "btn-neutral" : "btn-ghost"
                  } gap-1.5`}
                >
                  <span className="icon-[lucide--qr-code] size-3.5"></span>
                  <span>{showQr ? t("hideQr") : t("showQr")}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-base-content/50 font-mono truncate px-1">
              {t("targetLabel")} {result.original_url}
            </p>
          </div>

          {/* QR Code Déroulable */}
          {showQr && (
            <div className="flex flex-col items-center justify-center p-6 bg-base-200/40 rounded-xl border border-base-content/10 gap-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <QRCodeCanvas
                  value={result.short_url}
                  size={180}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <span className="font-mono text-xs text-base-content/70">
                {result.short_url}
              </span>
            </div>
          )}

          {/* Action Bas de Carte */}
          <div className="flex items-center justify-between pt-2 border-t border-base-content/10">
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-ghost btn-sm text-base-content/70 gap-1.5"
            >
              <span className="icon-[lucide--plus] size-4"></span>
              {t("newLink")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
