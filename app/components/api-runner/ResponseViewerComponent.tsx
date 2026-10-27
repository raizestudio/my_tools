// app/components/api-runner/ResponseViewerComponent.tsx
"use client";

import { useState, useMemo } from "react";
import CopyButton from "@/app/components/ui/CopyButtonComponent";
import { ApiRunResponse } from "./types";

interface ResponseViewerProps {
  response: ApiRunResponse;
}

type BodyViewMode = "pretty" | "raw" | "preview";

// Zero-dependency HTML-safe JSON syntax tokenizer
function highlightJson(jsonStr: string): string {
  const safe = jsonStr
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return safe.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match.trim())) {
          // Object Key
          const colonIdx = match.lastIndexOf(":");
          const keyPart = match.slice(0, colonIdx);
          const rest = match.slice(colonIdx);
          return `<span class="text-secondary font-semibold">${keyPart}</span>${rest}`;
        }
        // String Value
        return `<span class="text-success">${match}</span>`;
      }
      if (/true|false/.test(match)) {
        return `<span class="text-warning font-bold">${match}</span>`;
      }
      if (/null/.test(match)) {
        return `<span class="text-base-content/40 italic font-semibold">${match}</span>`;
      }
      // Number
      return `<span class="text-info font-medium">${match}</span>`;
    }
  );
}

export default function ResponseViewerComponent({ response }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<"body" | "headers" | "timing">("body");
  const [bodyMode, setBodyMode] = useState<BodyViewMode>("pretty");
  const [wrapLines, setWrapLines] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Inspect headers to detect content type
  const contentType = useMemo(() => {
    const header = response.headers.find(
      (h) => h.key.toLowerCase() === "content-type"
    );
    return header ? header.value.toLowerCase() : "";
  }, [response.headers]);

  const isHtml = useMemo(() => {
    return (
      contentType.includes("text/html") ||
      response.body.trim().toLowerCase().startsWith("<!doctype") ||
      response.body.trim().toLowerCase().startsWith("<html")
    );
  }, [contentType, response.body]);

  const isSvg = useMemo(() => {
    return (
      contentType.includes("image/svg") ||
      response.body.trim().toLowerCase().startsWith("<svg")
    );
  }, [contentType, response.body]);

  // Attempt to parse and beautify JSON
  const parsedJson = useMemo(() => {
    if (!response.body) return null;
    try {
      return JSON.parse(response.body);
    } catch {
      return null;
    }
  }, [response.body]);

  const prettyJsonString = useMemo(() => {
    if (!parsedJson) return response.body;
    return JSON.stringify(parsedJson, null, 2);
  }, [parsedJson, response.body]);

  const highlightedBodyHtml = useMemo(() => {
    if (parsedJson) {
      return highlightJson(prettyJsonString);
    }
    // Fallback: escaped raw text
    return response.body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }, [parsedJson, prettyJsonString, response.body]);

  // Current copy target based on active body mode
  const textToCopy = bodyMode === "pretty" ? prettyJsonString : response.body;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Metrics Bar */}
      <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`badge badge-sm font-bold font-mono py-3 px-2.5 ${
              response.statusCode >= 200 && response.statusCode < 300
                ? "badge-success text-success-content"
                : response.statusCode >= 300 && response.statusCode < 400
                ? "badge-warning text-warning-content"
                : "badge-error text-error-content"
            }`}
          >
            {response.statusCode} {response.statusText}
          </span>

          <div className="flex items-center gap-3 text-xs font-mono text-base-content/70">
            <span>
              Time: <strong className="text-primary">{response.timing.totalMs} ms</strong>
            </span>
            <span>•</span>
            <span>
              Size: <strong>{formatBytes(response.sizeBytes)}</strong>
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="join">
          <button
            type="button"
            onClick={() => setActiveTab("body")}
            className={`join-item btn btn-xs ${
              activeTab === "body" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Body
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("headers")}
            className={`join-item btn btn-xs ${
              activeTab === "headers" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Headers ({response.headers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("timing")}
            className={`join-item btn btn-xs ${
              activeTab === "timing" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Waterfall
          </button>
        </div>
      </div>

      {response.isTruncated && (
        <div className="alert alert-soft alert-warning text-xs p-2.5 flex items-center gap-2">
          <span className="icon-[lucide--alert-circle] size-4 shrink-0"></span>
          <span>Response payload exceeded 1.5MB and was truncated to protect memory.</span>
        </div>
      )}

      {/* 1. Body View */}
      {activeTab === "body" && (
        <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-col gap-3">
          {/* Sub-Header Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-base-content/10">
            <div className="flex items-center gap-2">
              {/* Pretty / Raw / Preview Mode Selector */}
              <div className="join">
                <button
                  type="button"
                  onClick={() => setBodyMode("pretty")}
                  className={`join-item btn btn-xs ${
                    bodyMode === "pretty" ? "btn-neutral" : "btn-ghost text-base-content/70"
                  }`}
                >
                  Pretty
                </button>
                <button
                  type="button"
                  onClick={() => setBodyMode("raw")}
                  className={`join-item btn btn-xs ${
                    bodyMode === "raw" ? "btn-neutral" : "btn-ghost text-base-content/70"
                  }`}
                >
                  Raw
                </button>
                <button
                  type="button"
                  onClick={() => setBodyMode("preview")}
                  className={`join-item btn btn-xs ${
                    bodyMode === "preview" ? "btn-neutral" : "btn-ghost text-base-content/70"
                  }`}
                >
                  <span className="icon-[lucide--eye] size-3"></span>
                  <span>Preview</span>
                </button>
              </div>

              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-base-200 text-base-content/60">
                {parsedJson ? "JSON" : isHtml ? "HTML" : isSvg ? "SVG" : "Text"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Soft Wrap Toggle */}
              {bodyMode !== "preview" && (
                <button
                  type="button"
                  onClick={() => setWrapLines(!wrapLines)}
                  className={`btn btn-xs gap-1 ${
                    wrapLines ? "btn-neutral" : "btn-ghost text-base-content/70"
                  }`}
                  title="Toggle Line Wrap"
                >
                  <span className="icon-[lucide--wrap-text] size-3"></span>
                  <span>Wrap</span>
                </button>
              )}

              <CopyButton text={textToCopy} size="xs" variant="outline" />
            </div>
          </div>

          {/* Mode 1: Pretty Formatted & Highlighted */}
          {bodyMode === "pretty" && (
            <div className="rounded-xl border border-base-content/10 bg-neutral text-neutral-content p-4 font-mono text-xs shadow-inner overflow-hidden">
              <pre
                className={`leading-relaxed max-h-[550px] overflow-auto ${
                  wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto"
                }`}
              >
                <code dangerouslySetInnerHTML={{ __html: highlightedBodyHtml }} />
              </pre>
            </div>
          )}

          {/* Mode 2: Raw Output */}
          {bodyMode === "raw" && (
            <div className="rounded-xl border border-base-content/10 bg-base-200/50 p-4 font-mono text-xs text-base-content/90 overflow-hidden">
              <pre
                className={`leading-relaxed max-h-[550px] overflow-auto ${
                  wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto"
                }`}
              >
                <code>{response.body || "No response body received."}</code>
              </pre>
            </div>
          )}

          {/* Mode 3: Sandboxed Preview */}
          {bodyMode === "preview" && (
            <div className="flex flex-col gap-2">
              {isHtml || isSvg ? (
                <>
                  <div className="flex items-center justify-between text-[11px] text-base-content/50 px-1">
                    <span className="flex items-center gap-1.5">
                      <span className="icon-[lucide--shield-check] size-3.5 text-success"></span>
                      Sandboxed Iframe Preview (scripts and network restricted)
                    </span>
                  </div>
                  <iframe
                    sandbox=""
                    srcDoc={response.body}
                    title="Response HTML Preview"
                    className="w-full h-[500px] bg-white rounded-xl border border-base-content/10 shadow-inner"
                  />
                </>
              ) : parsedJson && Array.isArray(parsedJson) && parsedJson.length > 0 && typeof parsedJson[0] === "object" ? (
                /* Tabular summary preview for Array of JSON Objects */
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] text-base-content/50">
                    Tabular Data Preview ({parsedJson.length} records)
                  </span>
                  <div className="overflow-x-auto border border-base-content/10 rounded-xl max-h-[500px]">
                    <table className="table table-xs table-pin-rows">
                      <thead>
                        <tr className="bg-base-200 text-base-content/70 font-mono">
                          {Object.keys(parsedJson[0]).map((key) => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="font-mono text-[11px]">
                        {parsedJson.slice(0, 50).map((row, idx) => (
                          <tr key={idx} className="hover:bg-base-200/40">
                            {Object.keys(parsedJson[0]).map((key) => (
                              <td key={key} className="truncate max-w-xs">
                                {typeof row[key] === "object"
                                  ? JSON.stringify(row[key])
                                  : String(row[key] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-base-content/10 rounded-xl gap-2 text-base-content/50">
                  <span className="icon-[lucide--file-question] size-8"></span>
                  <span className="text-xs font-semibold">Visual Preview Unavailable</span>
                  <span className="text-[11px] max-w-xs leading-normal">
                    Rich previews are enabled for HTML pages, SVGs, and JSON arrays. Switch to &quot;Pretty&quot; to inspect formatted code.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Headers View */}
      {activeTab === "headers" && (
        <div className="card card-border bg-base-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-200/50 text-xs text-base-content/70">
                  <th className="w-1/3">Header</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono">
                {response.headers.length > 0 ? (
                  response.headers.map((h, i) => (
                    <tr key={`${h.key}-${i}`} className="hover:bg-base-200/30">
                      <td className="font-bold text-base-content">{h.key}</td>
                      <td className="text-base-content/80 break-all">{h.value}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center py-4 text-base-content/40 italic">
                      No response headers available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Latency Waterfall View */}
      {activeTab === "timing" && (
        <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-5">
          <span className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-2 border-b border-base-content/10 pb-3">
            <span className="icon-[lucide--timer] size-4 text-primary"></span>
            Latency Waterfall
          </span>

          <div className="flex flex-col gap-2">
            <div className="w-full h-4 bg-base-300 rounded-full overflow-hidden flex shadow-inner">
              {response.timing.dnsMs > 0 && (
                <div
                  style={{
                    width: `${Math.max(
                      5,
                      (response.timing.dnsMs / response.timing.totalMs) * 100
                    )}%`,
                  }}
                  title={`DNS: ${response.timing.dnsMs}ms`}
                  className="bg-info h-full transition-all"
                />
              )}
              <div
                style={{
                  width: `${Math.max(
                    10,
                    (response.timing.ttfbMs / response.timing.totalMs) * 100
                  )}%`,
                }}
                title={`TTFB: ${response.timing.ttfbMs}ms`}
                className="bg-primary h-full transition-all"
              />
              <div
                style={{
                  width: `${Math.max(
                    10,
                    (response.timing.downloadMs / response.timing.totalMs) * 100
                  )}%`,
                }}
                title={`Transfer: ${response.timing.downloadMs}ms`}
                className="bg-success h-full transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-base-200/40 border border-base-content/5">
                <div className="size-3 rounded-full bg-info shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-base-content/60">DNS Lookup</span>
                  <span className="font-mono text-xs font-bold text-base-content">
                    {response.timing.dnsMs > 0 ? `${response.timing.dnsMs} ms` : "N/A (Browser)"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-base-200/40 border border-base-content/5">
                <div className="size-3 rounded-full bg-primary shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-base-content/60">Time to First Byte (TTFB)</span>
                  <span className="font-mono text-xs font-bold text-base-content">
                    {response.timing.ttfbMs} ms
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-base-200/40 border border-base-content/5">
                <div className="size-3 rounded-full bg-success shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-base-content/60">Content Transfer</span>
                  <span className="font-mono text-xs font-bold text-base-content">
                    {response.timing.downloadMs} ms
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
