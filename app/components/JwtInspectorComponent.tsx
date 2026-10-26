// app/components/JwtInspectorComponent.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";

import ToolHeader from "@/app/components/ui/ToolHeaderComponent";

function decodeBase64Url(str: string): string {
  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error("Base64URL invalid");
  }
}

async function verifyHmac(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  secret: string,
  alg: string,
): Promise<boolean> {
  const hashAlgorithms: Record<string, string> = {
    HS256: "SHA-256",
    HS384: "SHA-384",
    HS512: "SHA-512",
  };

  const hashName = hashAlgorithms[alg];
  if (!hashName || !secret) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: { name: hashName } },
      false,
      ["verify"],
    );

    let b64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const binary = atob(b64);
    const sigBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      sigBytes[i] = binary.charCodeAt(i);
    }

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    return await crypto.subtle.verify("HMAC", key, sigBytes, data);
  } catch {
    return false;
  }
}

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIERldmVsb3BlciIsImFkbWluIjp0cnVlLCJpYXQiOjE3MzAwMDAwMDAsImV4cCI6MTk5OTk5OTk5OX0.5G_B1pfnGgqV3549Hn_YhM9JvhX_6sZ8rU-O4U0k5gY";

export default function JwtInspectorComponent() {
  const t = useTranslations("tools.jwtInspector");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [tokenInput, setTokenInput] = useState(SAMPLE_JWT);
  const [secretKey, setSecretKey] = useState("");
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [signatureStatus, setSignatureStatus] = useState<boolean | null>(null);
  const [nowSec, setNowSec] = useState<number | null>(null);

  useEffect(() => {
    setNowSec(Math.floor(Date.now() / 1000));
    const timer = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp * 1000);
    if (nowSec === null) {
      return d.toISOString();
    }
    return d.toLocaleString(locale === "fr" ? "fr-FR" : "en-US");
  };

  const cleanToken = tokenInput.trim().replace(/^Bearer\s+/i, "");
  const parts = cleanToken.split(".");
  const isThreeParts = parts.length === 3;
  const [headerB64, payloadB64, signatureB64] = parts;

  const decodedData = useMemo(() => {
    if (!isThreeParts) return null;

    let parsedHeader: Record<string, unknown> | null = null;
    let parsedPayload: Record<string, unknown> | null = null;
    let error: string | null = null;

    try {
      parsedHeader = JSON.parse(decodeBase64Url(headerB64));
    } catch {
      error = t("invalidHeaderError");
    }

    try {
      parsedPayload = JSON.parse(decodeBase64Url(payloadB64));
    } catch {
      error = t("invalidPayloadError");
    }

    return { parsedHeader, parsedPayload, error };
  }, [headerB64, payloadB64, isThreeParts, t]);

  useEffect(() => {
    let isCancelled = false;

    if (!isThreeParts || !secretKey || !decodedData?.parsedHeader) {
      setSignatureStatus(null);
      return;
    }

    const alg = String(decodedData.parsedHeader.alg || "");
    if (!alg.startsWith("HS")) {
      setSignatureStatus(null);
      return;
    }

    verifyHmac(headerB64, payloadB64, signatureB64, secretKey, alg).then(
      (isValid) => {
        if (!isCancelled) setSignatureStatus(isValid);
      },
    );

    return () => {
      isCancelled = true;
    };
  }, [
    headerB64,
    payloadB64,
    signatureB64,
    secretKey,
    decodedData,
    isThreeParts,
  ]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(label);
    setTimeout(() => setIsCopied(null), 1800);
  };

  const exp =
    typeof decodedData?.parsedPayload?.exp === "number"
      ? decodedData.parsedPayload.exp
      : null;
  const iat =
    typeof decodedData?.parsedPayload?.iat === "number"
      ? decodedData.parsedPayload.iat
      : null;
  const nbf =
    typeof decodedData?.parsedPayload?.nbf === "number"
      ? decodedData.parsedPayload.nbf
      : null;

  const isExpired = exp !== null && nowSec !== null ? nowSec > exp : false;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      {/* Header & Fil d'Ariane */}
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--key-round]"
        actions={
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setTokenInput(SAMPLE_JWT)}
              className="btn btn-xs btn-outline"
            >
              {t("loadSample")}
            </button>
            <button
              type="button"
              onClick={() => {
                setTokenInput("");
                setSecretKey("");
              }}
              className="btn btn-xs btn-ghost text-base-content/60"
            >
              {t("clear")}
            </button>
          </div>
        }
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Raw Input */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="card card-border bg-base-100 p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
                {t("rawTokenLabel")}
              </label>
              <span className="badge badge-xs badge-soft badge-success">
                {t("localOnlyBadge")}
              </span>
            </div>

            <textarea
              rows={8}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={t("rawTokenPlaceholder")}
              className="textarea textarea-bordered font-mono text-xs w-full resize-y focus:outline-primary leading-relaxed"
            />

            {isThreeParts && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-base-content/10">
                <span className="text-[11px] font-medium text-base-content/60">
                  {t("segmentsTitle")}
                </span>
                <div className="p-3 bg-base-200/50 rounded-lg font-mono text-xs break-all leading-relaxed border border-base-content/5">
                  <span className="text-error font-medium">{headerB64}</span>
                  <span className="text-base-content/40">.</span>
                  <span className="text-secondary font-medium">
                    {payloadB64}
                  </span>
                  <span className="text-base-content/40">.</span>
                  <span className="text-info font-medium">{signatureB64}</span>
                </div>
              </div>
            )}
          </div>

          <div className="card card-border bg-base-100 p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
                {t("verifySignatureTitle")}
              </label>
              {signatureStatus === true && (
                <span className="badge badge-sm badge-success text-xs">
                  {t("signatureValid")}
                </span>
              )}
              {signatureStatus === false && (
                <span className="badge badge-sm badge-error text-xs">
                  {t("signatureInvalid")}
                </span>
              )}
            </div>

            <p className="text-[11px] text-base-content/60 leading-normal">
              {decodedData?.parsedHeader?.alg &&
              String(decodedData.parsedHeader.alg).startsWith("HS")
                ? t("hmacDetected", {
                    alg: String(decodedData.parsedHeader.alg),
                  })
                : t("hmacSupported")}
            </p>

            <input
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder={t("secretKeyPlaceholder")}
              disabled={
                !decodedData?.parsedHeader?.alg?.toString().startsWith("HS")
              }
              className="input input-sm input-bordered font-mono text-xs w-full focus:outline-primary"
            />
          </div>
        </div>

        {/* Right Column: Decoded Payload & Header */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {!isThreeParts && cleanToken.length > 0 && (
            <div className="alert alert-soft alert-warning text-xs">
              <span className="icon-[lucide--alert-circle] size-4"></span>
              <span>{t("invalidSegmentsError")}</span>
            </div>
          )}

          {decodedData?.error && (
            <div className="alert alert-soft alert-error text-xs">
              <span className="icon-[lucide--alert-triangle] size-4"></span>
              <span>{decodedData.error}</span>
            </div>
          )}

          {/* Expiration Banner */}
          {exp !== null && nowSec !== null && (
            <div
              className={`p-3.5 rounded-lg border flex items-center justify-between text-xs ${
                isExpired
                  ? "bg-error/10 border-error/20 text-error"
                  : "bg-success/10 border-success/20 text-success"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`${
                    isExpired
                      ? "icon-[lucide--clock-alert]"
                      : "icon-[lucide--check-circle-2]"
                  } size-4.5 shrink-0`}
                ></span>
                <div>
                  <span className="font-semibold mr-1">
                    {isExpired ? t("tokenExpired") : t("tokenActive")}
                  </span>
                  <span suppressHydrationWarning>{formatDate(exp)}</span>
                </div>
              </div>
              <span className="font-mono text-[11px] opacity-80">
                {t("minutesDelta", {
                  count: Math.abs(Math.round((exp - nowSec) / 60)),
                })}
              </span>
            </div>
          )}

          {/* Header Segment Card */}
          <div className="card card-border bg-base-100 p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-error"></span>
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content">
                  {t("headerTitle")}
                </span>
                <span className="text-[11px] text-base-content/50">
                  ({String(decodedData?.parsedHeader?.alg || "Alg")})
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(decodedData?.parsedHeader, null, 2),
                    "header",
                  )
                }
                className="btn btn-xs btn-ghost text-base-content/60 hover:text-primary gap-1"
              >
                <span
                  className={`icon-[lucide--${
                    isCopied === "header" ? "check" : "copy"
                  }] size-3.5`}
                ></span>
                <span>
                  {isCopied === "header" ? t("copied") : t("copyJson")}
                </span>
              </button>
            </div>

            <pre className="p-3 bg-base-200/50 rounded-lg font-mono text-xs overflow-x-auto text-base-content/90 border border-base-content/5 leading-relaxed">
              {decodedData?.parsedHeader
                ? JSON.stringify(decodedData.parsedHeader, null, 2)
                : t("waitingHeader")}
            </pre>
          </div>

          {/* Payload Segment Card */}
          <div className="card card-border bg-base-100 p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-secondary"></span>
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content">
                  {t("payloadTitle")}
                </span>
                <span className="text-[11px] text-base-content/50">
                  ({t("claimsSubtitle")})
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(decodedData?.parsedPayload, null, 2),
                    "payload",
                  )
                }
                className="btn btn-xs btn-ghost text-base-content/60 hover:text-primary gap-1"
              >
                <span
                  className={`icon-[lucide--${
                    isCopied === "payload" ? "check" : "copy"
                  }] size-3.5`}
                ></span>
                <span>
                  {isCopied === "payload" ? t("copied") : t("copyJson")}
                </span>
              </button>
            </div>

            <pre className="p-3 bg-base-200/50 rounded-lg font-mono text-xs overflow-x-auto text-base-content/90 border border-base-content/5 leading-relaxed">
              {decodedData?.parsedPayload
                ? JSON.stringify(decodedData.parsedPayload, null, 2)
                : t("waitingPayload")}
            </pre>

            {/* RFC 7519 Standard Claims Grid */}
            {decodedData?.parsedPayload && (
              <div className="mt-3 pt-3 border-t border-base-content/10 flex flex-col gap-2 text-xs">
                <span className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider">
                  {t("rfcClaimsTitle")}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  {iat !== null && (
                    <div className="bg-base-200/40 p-2.5 rounded-lg border border-base-content/5">
                      <span className="text-base-content/50 block text-[10px] mb-0.5">
                        {t("claimIat")}
                      </span>
                      <span suppressHydrationWarning>{formatDate(iat)}</span>
                    </div>
                  )}
                  {nbf !== null && (
                    <div className="bg-base-200/40 p-2.5 rounded-lg border border-base-content/5">
                      <span className="text-base-content/50 block text-[10px] mb-0.5">
                        {t("claimNbf")}
                      </span>
                      <span suppressHydrationWarning>{formatDate(nbf)}</span>
                    </div>
                  )}
                  {Boolean(decodedData.parsedPayload.iss) && (
                    <div className="bg-base-200/40 p-2.5 rounded-lg border border-base-content/5 col-span-full">
                      <span className="text-base-content/50 block text-[10px] mb-0.5">
                        {t("claimIss")}
                      </span>
                      <span className="break-all text-primary">
                        {String(decodedData.parsedPayload.iss)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
