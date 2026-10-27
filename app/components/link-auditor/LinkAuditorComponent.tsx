// app/components/link-auditor/LinkAuditorComponent.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";
import CopyButton from "@/app/components/ui/CopyButtonComponent";

interface HopItem {
  hop: number;
  url: string;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  server?: string;
  contentType?: string;
  location?: string;
  resolvedIp: string;
}

interface TraceResponse {
  inputUrl: string;
  finalUrl: string;
  cleanUrl: string;
  defangedUrl: string;
  pageTitle?: string;
  totalDurationMs: number;
  totalHops: number;
  strippedParams: string[];
  hops: HopItem[];
  detail?: string;
}

type UserAgentProfile = "desktop" | "googlebot" | "slackbot" | "curl";

export default function LinkAuditorComponent() {
  const t = useTranslations("tools.linkAuditor");

  const [inputUrl, setInputUrl] = useState("");
  const [uaProfile, setUaProfile] = useState<UserAgentProfile>("desktop");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<TraceResponse | null>(null);

  const handleLoadSample = () => {
    // Standard test redirect link that illustrates multi-hop resolution
    setInputUrl("https://httpbin.org/redirect/3");
    setAuditData(null);
    setErrorMsg(null);
  };

  const handleRunTrace = async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setErrorMsg(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${apiUrl}/url-trace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmed,
          userAgentProfile: uaProfile,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.detail || "Failed to inspect target URL.");
      } else {
        setAuditData(data as TraceResponse);
      }
    } catch {
      setErrorMsg("Could not connect to the backend URL auditor service.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--shield-alert]"
        badge={
          <span className="badge badge-sm badge-soft badge-primary">
            {t("badgeServer")}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="btn btn-xs btn-outline"
            >
              {t("loadSample")}
            </button>
            {(inputUrl || auditData) && (
              <button
                type="button"
                onClick={() => {
                  setInputUrl("");
                  setAuditData(null);
                  setErrorMsg(null);
                }}
                className="btn btn-xs btn-ghost text-base-content/60"
              >
                {t("clear")}
              </button>
            )}
          </div>
        }
      />

      {/* Input Configuration Card */}
      <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
              {t("inputLabel")}
            </label>
            <div className="relative">
              <span className="icon-[lucide--link-2] size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></span>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRunTrace()}
                placeholder={t("inputPlaceholder")}
                className="input input-sm w-full pl-9 font-mono text-xs focus:outline-primary"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading || !inputUrl.trim()}
            onClick={handleRunTrace}
            className="btn btn-sm btn-primary gap-2 shrink-0"
          >
            {isLoading ? (
              <span className="loading loading-spinner size-4"></span>
            ) : (
              <span className="icon-[lucide--scan] size-4"></span>
            )}
            <span>{isLoading ? t("tracing") : t("traceBtn")}</span>
          </button>
        </div>

        {/* User-Agent Cloaking Check Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-base-content/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-base-content/70">
              {t("uaProfileLabel")} :
            </span>
            <div className="join">
              <button
                type="button"
                onClick={() => setUaProfile("desktop")}
                className={`join-item btn btn-xs ${
                  uaProfile === "desktop" ? "btn-primary" : "btn-ghost"
                }`}
              >
                {t("uaDesktop")}
              </button>
              <button
                type="button"
                onClick={() => setUaProfile("googlebot")}
                className={`join-item btn btn-xs ${
                  uaProfile === "googlebot" ? "btn-primary" : "btn-ghost"
                }`}
              >
                {t("uaGooglebot")}
              </button>
              <button
                type="button"
                onClick={() => setUaProfile("slackbot")}
                className={`join-item btn btn-xs ${
                  uaProfile === "slackbot" ? "btn-primary" : "btn-ghost"
                }`}
              >
                {t("uaSlackbot")}
              </button>
              <button
                type="button"
                onClick={() => setUaProfile("curl")}
                className={`join-item btn btn-xs ${
                  uaProfile === "curl" ? "btn-primary" : "btn-ghost"
                }`}
              >
                {t("uaCurl")}
              </button>
            </div>
          </div>

          <span className="text-[11px] text-base-content/50 italic">
            {t("ssrfNotice")}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-soft alert-error text-xs p-3 flex items-center gap-2">
          <span className="icon-[lucide--alert-triangle] size-4 shrink-0"></span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results Workspace */}
      {auditData && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Destination Overview Box */}
          <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-base-content/10 gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-2">
                <span className="icon-[lucide--check-circle-2] size-4 text-success"></span>
                {t("overviewTitle")}
              </span>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-base-content/70">
                  {t("metricsHops")}: <strong className="text-primary">{auditData.totalHops}</strong>
                </span>
                <span className="text-base-content/30">•</span>
                <span className="text-base-content/70">
                  {t("metricsLatency")}: <strong className="text-primary">{auditData.totalDurationMs} ms</strong>
                </span>
              </div>
            </div>

            {/* Title if extracted */}
            {auditData.pageTitle && (
              <div className="flex items-start gap-2 bg-base-200/40 p-2.5 rounded-lg border border-base-content/5">
                <span className="icon-[lucide--heading] size-4 text-primary shrink-0 mt-0.5"></span>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-base-content/50">
                    {t("pageTitle")}
                  </span>
                  <span className="text-xs font-semibold text-base-content">
                    {auditData.pageTitle}
                  </span>
                </div>
              </div>
            )}

            {/* URL Variants (Clean, Defanged, Final) */}
            <div className="flex flex-col gap-3 text-xs">
              {/* Clean URL without Tracking Tags */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-base-200/50 p-2.5 rounded-xl border border-base-content/5 gap-2">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-[10px] font-bold text-success uppercase">
                    {t("cleanedUrl")}
                  </span>
                  <span className="font-mono text-xs text-base-content break-all">
                    {auditData.cleanUrl}
                  </span>
                </div>
                <CopyButton text={auditData.cleanUrl} size="xs" variant="outline" />
              </div>

              {/* Defanged URL for Incident Reports */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-base-200/50 p-2.5 rounded-xl border border-base-content/5 gap-2">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-[10px] font-bold text-warning uppercase">
                    {t("defangedUrl")}
                  </span>
                  <span className="font-mono text-xs text-base-content break-all">
                    {auditData.defangedUrl}
                  </span>
                </div>
                <CopyButton text={auditData.defangedUrl} size="xs" variant="outline" />
              </div>
            </div>

            {/* Tracking Parameters Stripped Banner */}
            {auditData.strippedParams.length > 0 && (
              <div className="alert alert-soft alert-info text-xs p-2.5 flex items-center gap-2">
                <span className="icon-[lucide--shield-check] size-4 shrink-0"></span>
                <span>
                  {t("strippedNotice", {
                    count: auditData.strippedParams.length,
                    params: auditData.strippedParams.join(", "),
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Step-by-Step Chain Visualization */}
          <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-2 border-b border-base-content/10 pb-3">
              <span className="icon-[lucide--route] size-4 text-primary"></span>
              {t("chainTitle")}
            </span>

            <div className="flex flex-col gap-3 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-base-content/10">
              {auditData.hops.map((hop) => {
                const isRedirect = hop.statusCode >= 300 && hop.statusCode < 400;
                const isSuccess = hop.statusCode >= 200 && hop.statusCode < 300;

                return (
                  <div
                    key={hop.hop}
                    className="flex items-start gap-3 pl-1 relative z-10"
                  >
                    <div
                      className={`size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                        isRedirect
                          ? "bg-warning text-warning-content"
                          : isSuccess
                          ? "bg-success text-success-content"
                          : "bg-error text-error-content"
                      }`}
                    >
                      {hop.hop}
                    </div>

                    <div className="flex-1 card card-border bg-base-200/40 p-3 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`badge badge-xs font-bold ${
                              isRedirect
                                ? "badge-warning"
                                : isSuccess
                                ? "badge-success"
                                : "badge-error"
                            }`}
                          >
                            {hop.statusCode} {hop.statusText}
                          </span>
                          <span className="text-[11px] font-mono text-base-content/60">
                            {hop.latencyMs} ms
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-mono text-base-content/50">
                          {hop.server && <span>Server: {hop.server}</span>}
                          <span>IP: {hop.resolvedIp}</span>
                        </div>
                      </div>

                      <div className="font-mono text-xs text-base-content break-all bg-base-100 p-2 rounded border border-base-content/5">
                        {hop.url}
                      </div>

                      {hop.location && (
                        <div className="text-[11px] text-base-content/70 flex items-center gap-1.5 pt-1 border-t border-base-content/5">
                          <span className="icon-[lucide--corner-down-right] size-3.5 text-warning shrink-0"></span>
                          <span className="font-semibold text-warning">
                            {t("nextHop")} :
                          </span>
                          <span className="font-mono text-base-content truncate">
                            {hop.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
