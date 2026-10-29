// app/components/secret-share/SecretCreateComponent.tsx
"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import {
  generateAesKey,
  exportKeyToBase64,
  encryptSecret,
} from "@/app/lib/crypto";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";

export default function SecretCreateComponent() {
  const t = useTranslations("tools.secretShare");
  const locale = useLocale();

  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState(3600);
  const [maxViews, setMaxViews] = useState(1);
  const [loading, setLoading] = useState(false);
  const [secretUrl, setSecretUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea smoothly between 160px and 460px without layout distortion
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(Math.max(el.scrollHeight, 160), 460);
    el.style.height = `${nextHeight}px`;
  }, [content]);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setContent(text);
    } catch {
      // Browser permissions denied
    }
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSecretUrl(null);
    setShowQr(false);

    try {
      const key = await generateAesKey();
      const b64Key = await exportKeyToBase64(key);

      const { ciphertext, iv } = await encryptSecret(content, key);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/secrets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext,
          iv,
          ttl_seconds: ttl,
          max_views: maxViews,
        }),
      });

      if (!res.ok) {
        throw new Error(t("serverError"));
      }

      const data = await res.json();
      const shareUrl = `${window.location.origin}/${locale}/s/${data.id}#${b64Key}`;
      setSecretUrl(shareUrl);
      setContent("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("unexpectedError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!secretUrl) return;
    await navigator.clipboard.writeText(secretUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleReset = () => {
    setSecretUrl(null);
    setContent("");
    setError(null);
    setShowQr(false);
  };

  // Split link into server target and client-side key for security transparency
  const [baseUrlPart, keyPart] = secretUrl ? secretUrl.split("#") : ["", ""];

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full isolate">
      {/* Background Radial Glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-1"
      />

      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--shield-alert]"
        badge={
          <span className="badge badge-sm badge-soft badge-success font-mono font-semibold px-2.5 py-1">
            {t("zeroKnowledgeBadge")}
          </span>
        }
      />

      {!secretUrl ? (
        <form
          onSubmit={handleCreate}
          className="card card-border bg-base-100/70 backdrop-blur-md p-6 sm:p-7 flex flex-col gap-6 shadow-sm rounded-3xl border-base-content/10"
        >
          {/* Editor Container with Header & Actions */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-base-content flex items-center gap-1.5">
                <span className="icon-[lucide--file-key] size-4 text-primary"></span>
                <span>{t("messageLabel")}</span>
              </label>

              <div className="flex items-center gap-2">
                {content.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setContent("")}
                    className="btn btn-ghost btn-xs text-base-content/50 hover:text-error rounded-lg gap-1"
                  >
                    <span className="icon-[lucide--trash-2] size-3"></span>
                    <span className="text-[11px]">Clear</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="btn btn-ghost btn-xs text-base-content/60 hover:text-primary rounded-lg gap-1"
                  >
                    <span className="icon-[lucide--clipboard] size-3"></span>
                    <span className="text-[11px]">Paste</span>
                  </button>
                )}
                <span className="text-[10px] font-mono text-base-content/40 bg-base-200/60 px-2 py-0.5 rounded-md">
                  {new Blob([content]).size} B
                </span>
              </div>
            </div>

            <div className="relative rounded-2xl border border-base-content/15 bg-base-200/40 focus-within:border-primary/60 focus-within:bg-base-100/80 transition-all shadow-inner overflow-hidden">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("messagePlaceholder")}
                required
                className="w-full bg-transparent font-mono text-xs p-4 resize-none outline-none leading-relaxed text-base-content placeholder:text-base-content/30 min-h-40 max-h-115 overflow-y-auto"
              />
            </div>
          </div>

          {/* Security Parameter Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            {/* 1. TTL Grid */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-base-content flex items-center gap-1.5">
                <span className="icon-[lucide--clock] size-3.5 text-base-content/60"></span>
                <span>{t("expirationLabel")}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { value: 600, label: t("ttl10m") },
                  { value: 3600, label: t("ttl1h") },
                  { value: 86400, label: t("ttl24h") },
                  { value: 604800, label: t("ttl7d") },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTtl(item.value)}
                    className={`btn btn-xs rounded-xl font-mono text-[11px] h-9 ${
                      ttl === item.value
                        ? "btn-primary font-bold shadow-xs"
                        : "btn-soft text-base-content/70 hover:text-base-content"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Allowed Views Grid */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-base-content flex items-center gap-1.5">
                <span className="icon-[lucide--flame] size-3.5 text-base-content/60"></span>
                <span>{t("viewsLabel")}</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 1, label: t("views1") },
                  { value: 2, label: t("views2") },
                  { value: 5, label: t("views5") },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMaxViews(item.value)}
                    className={`btn btn-xs rounded-xl font-mono text-[11px] h-9 ${
                      maxViews === item.value
                        ? "btn-primary font-bold shadow-xs"
                        : "btn-soft text-base-content/70 hover:text-base-content"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-soft alert-error text-xs rounded-xl gap-2">
              <span className="icon-[lucide--alert-circle] size-4 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Submission Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-base-content/5">
            <span className="text-[11px] font-mono text-base-content/40 text-center sm:text-left">
              Key embedded into URL fragment (#) • Server never receives
              encryption key
            </span>

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="btn btn-primary btn-md rounded-xl font-semibold gap-2 shadow-sm shadow-primary/20 w-full sm:w-auto px-6"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner size-4"></span>
                  <span>{t("encrypting")}</span>
                </>
              ) : (
                <>
                  <span className="icon-[lucide--lock] size-4"></span>
                  <span>{t("submit")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Generated Secret State */
        <div className="card card-border bg-base-100/70 backdrop-blur-md p-6 sm:p-7 flex flex-col gap-6 shadow-sm rounded-3xl border-base-content/10 animate-in fade-in duration-200">
          <div className="alert alert-soft alert-success flex items-start gap-3 p-4 rounded-2xl">
            <span className="icon-[lucide--shield-check] size-5 text-success shrink-0 mt-0.5"></span>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-xs text-base-content">
                {t("successTitle")}
              </span>
              <span className="text-[11px] text-base-content/70 leading-relaxed">
                {t("successDesc")}
              </span>
            </div>
          </div>

          {/* Interactive URL Output Frame */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-base-content">
              {t("urlLabel")}
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-base-200/60 p-2.5 rounded-2xl border border-base-content/10">
              <div className="flex-1 font-mono text-xs overflow-x-auto whitespace-nowrap px-2 py-1 flex items-center gap-0.5 select-all">
                <span className="text-base-content/70">{baseUrlPart}</span>
                <span className="text-primary font-bold">#{keyPart}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className={`btn btn-sm rounded-xl gap-1.5 ${
                    showQr ? "btn-neutral" : "btn-soft text-base-content/70"
                  }`}
                  title="Toggle QR Code"
                >
                  <span className="icon-[lucide--qr-code] size-4"></span>
                  <span className="text-xs">QR</span>
                </button>

                <button
                  type="button"
                  onClick={copyToClipboard}
                  className={`btn btn-sm rounded-xl gap-1.5 ${
                    copied
                      ? "btn-success font-bold"
                      : "btn-primary font-semibold"
                  } shadow-xs`}
                >
                  <span
                    className={`icon-[lucide--${copied ? "check" : "copy"}] size-4`}
                  ></span>
                  <span>{copied ? t("copied") : t("copy")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Client-side QR Code Drawer */}
          {showQr && (
            <div className="flex flex-col items-center justify-center p-6 bg-base-200/40 rounded-2xl border border-base-content/10 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 bg-white rounded-xl shadow-md">
                <QRCodeSVG value={secretUrl} size={180} level="M" />
              </div>
              <span className="text-[11px] font-mono text-base-content/50 mt-3">
                Scan with a mobile camera to decrypt directly on device
              </span>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-base-content/5">
            <span className="text-[11px] font-mono text-base-content/40">
              Max views: {maxViews} • Expires in {Math.round(ttl / 60)}m
            </span>

            <button
              type="button"
              onClick={handleReset}
              className="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content rounded-xl gap-1.5"
            >
              <span className="icon-[lucide--plus] size-4"></span>
              <span>{t("newSecret")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
