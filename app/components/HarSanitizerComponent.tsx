// app/components/har/HarSanitizerComponent.tsx
"use client";

import { useState, useRef, useMemo, ChangeEvent, DragEvent } from "react";
import { useTranslations } from "next-intl";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";
import CopyButton from "@/app/components/ui/CopyButtonComponent";
import { HAR_WORKER_CODE } from "@/app/components/har/harWorker";

interface PreviewEntry {
  id: number;
  method: string;
  url: string;
  status: number;
  time: number;
  headers: { name: string; value: string }[];
  responseHeaders: { name: string; value: string }[];
  queryString: { name: string; value: string }[];
  cookies: { name: string; value: string }[];
  requestBody: string;
  responseBody: string;
  isRedacted: boolean;
}

interface HarAnalysisResult {
  fileName: string;
  originalSize: number;
  cleanedSize: number;
  redactedCount: number;
  totalEntries: number;
  downloadUrl: string;
  previewList: PreviewEntry[];
}

export default function HarSanitizerComponent() {
  const t = useTranslations("tools.harSanitizer");

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<HarAnalysisResult | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [selectedEntry, setSelectedEntry] = useState<PreviewEntry | null>(null);
  const [activeTab, setActiveTab] = useState<
    "headers" | "params" | "cookies" | "payload" | "response"
  >("headers");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "Ko", "Mo", "Go"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".har") && !file.name.endsWith(".json")) {
      setErrorMessage(t("errorInvalidHar"));
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const workerBlob = new Blob([HAR_WORKER_CODE], {
      type: "application/javascript",
    });
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const data = e.data;
      URL.revokeObjectURL(workerUrl);

      if (!data.success) {
        setIsProcessing(false);
        setErrorMessage(t("errorInvalidHar"));
        return;
      }

      const downloadUrl = URL.createObjectURL(data.cleanedBlob);

      const dotIdx = file.name.lastIndexOf(".");
      const baseName = dotIdx !== -1 ? file.name.slice(0, dotIdx) : file.name;
      const cleanFileName = `${baseName}_sanitized.har`;

      setResult({
        fileName: cleanFileName,
        originalSize: file.size,
        cleanedSize: data.cleanedBlob.size,
        redactedCount: data.redactedCount,
        totalEntries: data.totalEntries,
        downloadUrl,
        previewList: data.previewList,
      });

      if (data.previewList.length > 0) {
        setSelectedEntry(data.previewList[0]);
      }

      setIsProcessing(false);
    };

    worker.onerror = () => {
      setIsProcessing(false);
      setErrorMessage(t("errorInvalidHar"));
      URL.revokeObjectURL(workerUrl);
    };

    worker.postMessage({ file });
  };

  const handleReset = () => {
    if (result?.downloadUrl) {
      URL.revokeObjectURL(result.downloadUrl);
    }
    setResult(null);
    setSelectedEntry(null);
    setSearchTerm("");
    setMethodFilter("ALL");
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const filteredEntries = useMemo(() => {
    if (!result) return [];
    return result.previewList.filter((item) => {
      const matchMethod =
        methodFilter === "ALL" || item.method.toUpperCase() === methodFilter;
      const matchSearch =
        searchTerm.trim() === "" ||
        item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.status).includes(searchTerm);
      return matchMethod && matchSearch;
    });
  }, [result, searchTerm, methodFilter]);

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) return "badge-success";
    if (status >= 300 && status < 400) return "badge-info";
    if (status >= 400 && status < 500) return "badge-warning";
    if (status >= 500) return "badge-error";
    return "badge-neutral";
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      {/* Header Unifié */}
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--shield-check]"
        badge={
          <span className="badge badge-sm badge-soft badge-primary">
            {t("badgeOffline")}
          </span>
        }
        actions={
          result ? (
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-xs btn-outline"
            >
              {t("newFile")}
            </button>
          ) : undefined
        }
      />

      {/* Erreur */}
      {errorMessage && (
        <div className="alert alert-soft alert-error text-xs p-3 flex items-center gap-2">
          <span className="icon-[lucide--alert-circle] size-4 shrink-0"></span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Vue 1 : Dépôt du fichier */}
      {!result ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`card card-border border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 text-center ${
            isDragging
              ? "border-primary bg-primary/5 scale-[0.99]"
              : "border-base-content/20 hover:border-primary/50 hover:bg-base-200/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".har,.json"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            {isProcessing ? (
              <span className="loading loading-spinner size-8"></span>
            ) : (
              <span className="icon-[lucide--file-archive] size-8"></span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-base-content">
              {isProcessing ? t("readingFile") : t("dropzone")}
            </span>
            <span className="text-xs text-base-content/60">
              {t("dropzoneHint")}
            </span>
          </div>
        </div>
      ) : (
        /* Vue 2 : Tableau de bord & Explorateur */
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Métriques Clés */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card card-border bg-base-100 p-3.5 flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-base-content/50 uppercase">
                {t("totalRequests")}
              </span>
              <span className="text-lg font-bold font-mono text-base-content">
                {result.totalEntries}
              </span>
            </div>

            <div className="card card-border bg-base-100 p-3.5 flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-base-content/50 uppercase">
                {t("redactedTokens")}
              </span>
              <span className="text-lg font-bold font-mono text-warning">
                {result.redactedCount}
              </span>
            </div>

            <div className="card card-border bg-base-100 p-3.5 flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-base-content/50 uppercase">
                {t("originalSize")}
              </span>
              <span className="text-lg font-bold font-mono text-base-content/70">
                {formatBytes(result.originalSize)}
              </span>
            </div>

            <div className="card card-border bg-base-100 p-3.5 flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-base-content/50 uppercase">
                {t("cleanSize")}
              </span>
              <span className="text-lg font-bold font-mono text-success">
                {formatBytes(result.cleanedSize)}
              </span>
            </div>
          </div>

          {/* Action Barre Téléchargement */}
          <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 truncate w-full sm:w-auto">
              <span className="icon-[lucide--file-check-2] size-5 text-success shrink-0"></span>
              <span className="font-mono text-xs font-semibold truncate text-base-content">
                {result.fileName}
              </span>
            </div>

            <a
              href={result.downloadUrl}
              download={result.fileName}
              className="btn btn-primary btn-sm gap-2 w-full sm:w-auto shrink-0 shadow-sm"
            >
              <span className="icon-[lucide--download] size-4"></span>
              <span>{t("downloadCleanHar")}</span>
            </a>
          </div>

          {/* Grille Split-View : Liste des requêtes + Inspecteur */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Colonne Gauche : Liste des requêtes filtrable */}
            <div className="lg:col-span-5 card card-border bg-base-100 shadow-sm overflow-hidden flex flex-col">
              {/* Filtres */}
              <div className="p-3 border-b border-base-content/10 flex flex-col gap-2 bg-base-200/40">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="input input-xs input-bordered flex-1 font-mono"
                  />
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="select select-xs select-bordered font-mono"
                  >
                    <option value="ALL">{t("filterAllMethods")}</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>

              {/* Liste scrollable */}
              <div className="divide-y divide-base-content/10 max-h-[560px] overflow-y-auto">
                {filteredEntries.length === 0 ? (
                  <div className="p-8 text-center text-xs text-base-content/50">
                    {t("noMatchingRequests")}
                  </div>
                ) : (
                  filteredEntries.map((req) => {
                    const isSelected = selectedEntry?.id === req.id;
                    return (
                      <button
                        key={req.id}
                        type="button"
                        onClick={() => setSelectedEntry(req)}
                        className={`w-full text-left p-2.5 flex flex-col gap-1 transition-colors ${
                          isSelected
                            ? "bg-primary/10 border-l-4 border-primary"
                            : "hover:bg-base-200/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="badge badge-xs font-mono font-bold">
                              {req.method}
                            </span>
                            <span
                              className={`badge badge-xs font-mono ${getStatusBadge(
                                req.status,
                              )}`}
                            >
                              {req.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {req.isRedacted && (
                              <span className="badge badge-xs badge-soft badge-warning">
                                {t("redactedBadge")}
                              </span>
                            )}
                            <span className="text-[10px] text-base-content/50 font-mono">
                              {req.time}ms
                            </span>
                          </div>
                        </div>

                        <span className="font-mono text-[11px] truncate text-base-content/80">
                          {req.url}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Colonne Droite : Inspecteur de requête */}
            <div className="lg:col-span-7 card card-border bg-base-100 shadow-sm overflow-hidden flex flex-col min-h-[480px]">
              {selectedEntry ? (
                <div className="flex flex-col">
                  {/* En-tête URL */}
                  <div className="p-3.5 border-b border-base-content/10 bg-base-200/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 truncate">
                      <span className="badge badge-xs font-mono font-bold">
                        {selectedEntry.method}
                      </span>
                      <span className="font-mono text-xs font-semibold truncate text-base-content">
                        {selectedEntry.url}
                      </span>
                    </div>
                    <CopyButton
                      text={selectedEntry.url}
                      size="xs"
                      variant="ghost"
                      iconOnly
                    />
                  </div>

                  {/* Onglets */}
                  <div className="flex border-b border-base-content/10 px-3 pt-2 gap-1.5 bg-base-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab("headers")}
                      className={`btn btn-xs ${
                        activeTab === "headers"
                          ? "btn-primary"
                          : "btn-ghost text-base-content/70"
                      }`}
                    >
                      {t("tabHeaders")} ({selectedEntry.headers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("params")}
                      className={`btn btn-xs ${
                        activeTab === "params"
                          ? "btn-primary"
                          : "btn-ghost text-base-content/70"
                      }`}
                    >
                      {t("tabParams")} ({selectedEntry.queryString.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("cookies")}
                      className={`btn btn-xs ${
                        activeTab === "cookies"
                          ? "btn-primary"
                          : "btn-ghost text-base-content/70"
                      }`}
                    >
                      {t("tabCookies")} ({selectedEntry.cookies.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("payload")}
                      className={`btn btn-xs ${
                        activeTab === "payload"
                          ? "btn-primary"
                          : "btn-ghost text-base-content/70"
                      }`}
                    >
                      {t("tabPayload")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("response")}
                      className={`btn btn-xs ${
                        activeTab === "response"
                          ? "btn-primary"
                          : "btn-ghost text-base-content/70"
                      }`}
                    >
                      {t("tabResponse")}
                    </button>
                  </div>

                  {/* Contenu de l'onglet */}
                  <div className="p-3.5">
                    {activeTab === "headers" && (
                      <div className="border border-base-content/10 rounded-lg overflow-x-auto max-h-[400px]">
                        <table className="table table-xs font-mono">
                          <thead>
                            <tr className="bg-base-200/60">
                              <th>Name</th>
                              <th>Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEntry.headers.map((h, idx) => (
                              <tr key={idx} className="hover:bg-base-200/40">
                                <td className="font-semibold text-primary">
                                  {h.name}
                                </td>
                                <td className="text-base-content/80 break-all select-all">
                                  {h.value === "[REDACTED]" ? (
                                    <span className="badge badge-xs badge-warning font-semibold">
                                      [REDACTED]
                                    </span>
                                  ) : (
                                    h.value
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {activeTab === "params" && (
                      <div className="border border-base-content/10 rounded-lg overflow-x-auto max-h-[400px]">
                        {selectedEntry.queryString.length === 0 ? (
                          <div className="text-xs text-base-content/50 p-6 text-center italic">
                            No query parameters.
                          </div>
                        ) : (
                          <table className="table table-xs font-mono">
                            <thead>
                              <tr className="bg-base-200/60">
                                <th>Param</th>
                                <th>Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedEntry.queryString.map((q, idx) => (
                                <tr key={idx} className="hover:bg-base-200/40">
                                  <td className="font-semibold text-primary">
                                    {q.name}
                                  </td>
                                  <td className="text-base-content/80 break-all select-all">
                                    {q.value === "[REDACTED]" ? (
                                      <span className="badge badge-xs badge-warning font-semibold">
                                        [REDACTED]
                                      </span>
                                    ) : (
                                      q.value
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    {activeTab === "cookies" && (
                      <div className="border border-base-content/10 rounded-lg overflow-x-auto max-h-[400px]">
                        {selectedEntry.cookies.length === 0 ? (
                          <div className="text-xs text-base-content/50 p-6 text-center italic">
                            No cookies attached to request.
                          </div>
                        ) : (
                          <table className="table table-xs font-mono">
                            <thead>
                              <tr className="bg-base-200/60">
                                <th>Cookie</th>
                                <th>Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedEntry.cookies.map((c, idx) => (
                                <tr key={idx} className="hover:bg-base-200/40">
                                  <td className="font-semibold text-primary">
                                    {c.name}
                                  </td>
                                  <td className="text-base-content/80 break-all select-all">
                                    <span className="badge badge-xs badge-warning font-semibold">
                                      {c.value}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    {activeTab === "payload" && (
                      <div className="relative">
                        {selectedEntry.requestBody ? (
                          <textarea
                            readOnly
                            rows={15}
                            value={selectedEntry.requestBody}
                            className="textarea textarea-bordered font-mono text-xs w-full bg-base-200/30 select-all leading-relaxed"
                          />
                        ) : (
                          <div className="text-xs text-base-content/50 p-12 text-center italic">
                            {t("noPayload")}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "response" && (
                      <div className="relative">
                        {selectedEntry.responseBody ? (
                          <textarea
                            readOnly
                            rows={15}
                            value={selectedEntry.responseBody}
                            className="textarea textarea-bordered font-mono text-xs w-full bg-base-200/30 select-all leading-relaxed"
                          />
                        ) : (
                          <div className="text-xs text-base-content/50 p-12 text-center italic">
                            {t("noResponse")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-16 text-center text-xs text-base-content/50 gap-2 h-full">
                  <span className="icon-[lucide--mouse-pointer-click] size-8 opacity-40"></span>
                  <span>{t("emptySelection")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
