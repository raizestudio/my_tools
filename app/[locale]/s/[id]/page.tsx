// app/[locale]/s/[id]/page.tsx
"use client";

import {
  useState,
  useEffect,
  useRef,
  Suspense,
  useSyncExternalStore,
} from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { importKeyFromBase64, decryptSecret } from "@/app/lib/crypto";

interface SecretMetadata {
  id: string;
  expires_at: string;
  views_remaining: number;
}

interface RevealResponse {
  ciphertext: string;
  iv: string;
  views_remaining: number;
}

// Subscribe to browser hash changes without cascading renders
const subscribeHash = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};
const getClientHash = () =>
  typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
const getServerHash = () => null;

function SecretRevealContent() {
  const t = useTranslations("tools.secretShare");
  const locale = useLocale();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;

  // Read URL fragment hash reactively
  const hash = useSyncExternalStore(
    subscribeHash,
    getClientHash,
    getServerHash,
  );
  const isClientReady = hash !== null;

  // Validation derived during render (zero setState in effect)
  const validationError = !id
    ? t("missingIdError")
    : isClientReady && !hash
      ? t("missingKeyError")
      : null;

  const [apiError, setApiError] = useState<string | null>(null);
  const displayError = validationError || apiError;

  const [metadata, setMetadata] = useState<SecretMetadata | null>(null);
  const [isBurned, setIsBurned] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [viewsRemaining, setViewsRemaining] = useState<number | null>(null);

  const outputRef = useRef<HTMLTextAreaElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Derived loading state
  const isLoading = !isClientReady || (!displayError && !isBurned && !metadata);

  // Auto-resize output textarea when decrypted
  useEffect(() => {
    if (plaintext && outputRef.current) {
      outputRef.current.style.height = "auto";
      outputRef.current.style.height = `${Math.min(
        Math.max(outputRef.current.scrollHeight, 140),
        500,
      )}px`;
    }
  }, [plaintext]);

  // Network fetch: only runs when id and hash are present; updates only occur after await
  useEffect(() => {
    if (!id || !hash) return;

    let ignore = false;
    const fetchMetadata = async () => {
      try {
        const res = await fetch(`${apiUrl}/secrets/${id}`);
        if (ignore) return;

        if (res.status === 404) {
          setIsBurned(true);
          return;
        }
        if (!res.ok) {
          throw new Error(t("serverCheckError"));
        }

        const data: SecretMetadata = await res.json();
        if (ignore) return;
        setMetadata(data);
        setViewsRemaining(data.views_remaining);
      } catch (err: unknown) {
        if (ignore) return;
        setApiError(err instanceof Error ? err.message : t("serverCheckError"));
      }
    };

    fetchMetadata();

    return () => {
      ignore = true;
    };
  }, [id, hash, apiUrl, t]);

  const handleReveal = async () => {
    if (!id || !hash) return;

    setApiError(null);
    setRevealing(true);

    try {
      const res = await fetch(`${apiUrl}/secrets/${id}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.status === 404) {
        setIsBurned(true);
        throw new Error(t("alreadyDestroyedError"));
      }
      if (!res.ok) {
        throw new Error(t("serverCheckError"));
      }

      const data: RevealResponse = await res.json();

      // Zero-Knowledge: Decrypt exclusively in client memory
      const cryptoKey = await importKeyFromBase64(hash);
      const decrypted = await decryptSecret(
        data.ciphertext,
        data.iv,
        cryptoKey,
      );

      setPlaintext(decrypted);
      setViewsRemaining(data.views_remaining);
      setRevealed(true);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : t("unexpectedError"));
    } finally {
      setRevealing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!plaintext) return;
    await navigator.clipboard.writeText(plaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="container mx-auto px-4 py-12 flex flex-col items-center justify-center grow isolate max-w-xl">
      {/* Background Ambient Glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-1"
      />

      <div className="card card-border bg-base-100/70 backdrop-blur-md border-base-content/10 shadow-sm rounded-3xl w-full p-6 sm:p-8 flex flex-col gap-6">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 shadow-inner">
            <span
              className={`size-7 ${
                isBurned
                  ? "icon-[lucide--flame]"
                  : revealed
                    ? "icon-[lucide--lock-open]"
                    : "icon-[lucide--shield-alert]"
              }`}
            />
          </div>
          <h1 className="text-xl font-extrabold text-base-content tracking-tight">
            {isBurned ? t("burnTitle") : t("revealTitle")}
          </h1>
          <p className="text-xs text-base-content/60 mt-1 max-w-sm">
            {isBurned ? t("burnDesc") : t("revealSub")}
          </p>
        </div>

        {/* STATE 1: LOADING */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <span className="loading loading-spinner size-7 text-primary"></span>
            <span className="text-xs text-base-content/60 font-mono">
              {t("verifying")}
            </span>
          </div>
        ) : isBurned ? (
          /* STATE 2: TOMBSTONE (BURNED / 404) */
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            <div className="alert alert-soft alert-warning rounded-2xl text-xs flex items-start gap-3 p-4">
              <span className="icon-[lucide--flame] size-5 text-warning shrink-0 mt-0.5"></span>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-base-content">
                  Payload Purged
                </span>
                <span className="text-[11px] text-base-content/70 leading-relaxed">
                  {t("burnDesc")}
                </span>
              </div>
            </div>

            <Link
              href={`/${locale}/tools/secret-share`}
              className="btn btn-primary btn-sm rounded-xl font-semibold gap-2 w-full justify-center"
            >
              <span className="icon-[lucide--plus] size-4"></span>
              <span>{t("createOwnSecret")}</span>
            </Link>
          </div>
        ) : displayError && !revealed ? (
          /* STATE 3: GENERAL / VALIDATION ERROR */
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="alert alert-soft alert-error rounded-2xl text-xs flex items-start gap-3 p-4">
              <span className="icon-[lucide--alert-circle] size-5 text-error shrink-0 mt-0.5"></span>
              <span className="leading-relaxed">{displayError}</span>
            </div>
            <Link
              href={`/${locale}/tools/secret-share`}
              className="btn btn-ghost btn-sm rounded-xl text-base-content/70 w-full"
            >
              {t("createOwnSecret")}
            </Link>
          </div>
        ) : !revealed ? (
          /* STATE 4: PRE-REVEAL GATEKEEPER */
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            <div className="bg-warning/10 border border-warning/20 text-warning-content p-4 rounded-2xl text-xs flex items-start gap-3.5">
              <span className="icon-[lucide--alert-triangle] text-warning size-5 shrink-0 mt-0.5"></span>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-base-content">
                  {metadata?.views_remaining === 1
                    ? t("singleViewWarningTitle")
                    : "Security Notice"}
                </span>
                <span className="text-base-content/70 leading-relaxed text-[11px]">
                  {metadata?.views_remaining === 1
                    ? t("singleViewWarningDesc")
                    : t("multiViewWarningDesc", {
                        count: metadata?.views_remaining ?? 1,
                      })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReveal}
              disabled={revealing}
              className="btn btn-primary btn-md rounded-xl font-semibold w-full gap-2 shadow-sm shadow-primary/20"
            >
              {revealing ? (
                <>
                  <span className="loading loading-spinner size-4"></span>
                  <span>{t("decrypting")}</span>
                </>
              ) : (
                <>
                  <span className="icon-[lucide--key] size-4"></span>
                  <span>{t("revealBtn")}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* STATE 5: REVEALED & DECRYPTED */
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Status Bar */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-base-content flex items-center gap-1.5">
                <span className="icon-[lucide--unlock] size-3.5 text-success"></span>
                <span>{t("decryptedLabel")}</span>
              </span>

              {viewsRemaining !== null && (
                <span
                  className={`badge badge-sm font-mono font-semibold rounded-lg ${
                    viewsRemaining === 0
                      ? "badge-soft badge-error"
                      : "badge-soft badge-info"
                  }`}
                >
                  {viewsRemaining === 0
                    ? t("destroyedBadge")
                    : t("viewsRemainingBadge", { count: viewsRemaining })}
                </span>
              )}
            </div>

            {/* Read-Only Output Frame */}
            <div className="relative rounded-2xl border border-base-content/15 bg-base-200/50 focus-within:border-primary/50 transition-all overflow-hidden">
              <textarea
                ref={outputRef}
                readOnly
                value={plaintext || ""}
                className="w-full bg-transparent font-mono text-xs p-4 resize-none outline-none leading-relaxed text-base-content min-h-[140px] max-h-[500px] overflow-y-auto select-all"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={copyToClipboard}
                className={`btn btn-sm rounded-xl font-semibold flex-1 gap-2 ${
                  copied ? "btn-success font-bold" : "btn-primary"
                } shadow-xs`}
              >
                <span
                  className={`size-4 icon-[lucide--${copied ? "check" : "copy"}]`}
                ></span>
                <span>{copied ? t("copied") : t("copy")}</span>
              </button>

              <Link
                href={`/${locale}/tools/secret-share`}
                className="btn btn-sm btn-ghost rounded-xl text-base-content/70 gap-1.5 px-3"
                title={t("createOwnSecret")}
              >
                <span className="icon-[lucide--plus] size-4"></span>
                <span className="hidden sm:inline">{t("newSecret")}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SecretRevealPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center grow p-12">
          <span className="loading loading-spinner size-8 text-primary"></span>
        </div>
      }
    >
      <SecretRevealContent />
    </Suspense>
  );
}
