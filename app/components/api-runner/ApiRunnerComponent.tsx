// app/components/api-runner/ApiRunnerComponent.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";
import {
  ApiCollection,
  ApiRunResponse,
  BodyType,
  CollectionFolder,
  ExecutionEngine,
  FormDataItem,
  HttpMethod,
  KeyValueItem,
  SavedRequest,
} from "./types";
import {
  buildUrlWithParams,
  extractQueryParams,
  parseCurlCommand,
} from "./helpers";
import CollectionDrawerComponent from "./CollectionDrawerComponent";
import QueryParamsTableComponent from "./QueryParamsTableComponent";
import HeadersTableComponent from "./HeadersTableComponent";
import BodyEditorComponent from "./BodyEditorComponent";
import ResponseViewerComponent from "./ResponseViewerComponent";
import CurlModalComponent from "./CurlModalComponent";
import CodeExportDrawerComponent from "./CodeExportDrawerComponent";

const STORAGE_KEY = "0w_api_workspace_v2";

const DEFAULT_INITIAL_COLLECTION: ApiCollection = {
  version: "2.0",
  name: "My API Collection",
  updatedAt: new Date().toISOString(),
  folders: [
    { id: "fld-local", name: "Local Microservices", parentId: null },
    { id: "fld-auth", name: "Auth & Tokens", parentId: "fld-local" },
    { id: "fld-public", name: "Public Echo APIs", parentId: null },
  ],
  requests: [
    {
      id: "req-1",
      folderId: "fld-local",
      name: "Health Check",
      method: "GET",
      url: "http://localhost:3000/api/health",
      queryParams: [],
      headers: [{ id: "1", key: "Accept", value: "application/json", enabled: true }],
      bodyType: "none",
      rawBody: "",
      formDataList: [],
      urlencodedList: [],
      createdAt: Date.now(),
    },
    {
      id: "req-2",
      folderId: "fld-auth",
      name: "OAuth Token Exchange",
      method: "POST",
      url: "http://localhost:3000/api/oauth/token",
      queryParams: [],
      headers: [{ id: "1", key: "Content-Type", value: "application/x-www-form-urlencoded", enabled: true }],
      bodyType: "urlencoded",
      rawBody: "",
      formDataList: [],
      urlencodedList: [
        { id: "1", key: "grant_type", value: "client_credentials", enabled: true },
        { id: "2", key: "client_id", value: "local_dev_key", enabled: true },
      ],
      createdAt: Date.now() + 1,
    },
    {
      id: "req-3",
      folderId: "fld-public",
      name: "Sample JSON Post",
      method: "POST",
      url: "https://httpbin.org/post",
      queryParams: [{ id: "1", key: "env", value: "dev", enabled: true }],
      headers: [
        { id: "1", key: "Content-Type", value: "application/json", enabled: true },
        { id: "2", key: "Accept", value: "application/json", enabled: true },
      ],
      bodyType: "json",
      rawBody: '{\n  "service": "0w API Runner",\n  "offline": true\n}',
      formDataList: [],
      urlencodedList: [],
      createdAt: Date.now() + 2,
    },
  ],
};

const FORBIDDEN_BROWSER_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "referer",
  "origin",
  "cookie",
  "cookie2",
  "date",
  "keep-alive",
  "user-agent",
]);

export default function ApiRunnerComponent() {
  const t = useTranslations("tools.apiRunner");

  // Collection Workspace State
  const [collection, setCollection] = useState<ApiCollection>(DEFAULT_INITIAL_COLLECTION);
  const [activeId, setActiveId] = useState<string>("req-1");
  const isHydrated = useRef(false);

  // Active Request Working State
  const [engine, setEngine] = useState<ExecutionEngine>("direct");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("http://localhost:3000/api/health");
  const [queryParams, setQueryParams] = useState<KeyValueItem[]>([]);
  const [headers, setHeaders] = useState<KeyValueItem[]>([]);
  const [bodyType, setBodyType] = useState<BodyType>("none");
  const [rawBody, setRawBody] = useState("");
  const [formDataList, setFormDataList] = useState<FormDataItem[]>([]);
  const [urlencodedList, setUrlencodedList] = useState<KeyValueItem[]>([]);

  // Navigation & Execution
  const [requestTab, setRequestTab] = useState<"params" | "headers" | "body">("params");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCorsError, setIsCorsError] = useState(false);
  const [responseResult, setResponseResult] = useState<ApiRunResponse | null>(null);

  // Modals & Drawers
  const [isCollectionDrawerOpen, setIsCollectionDrawerOpen] = useState(false);
  const [isCurlModalOpen, setIsCurlModalOpen] = useState(false);
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);

  // 1. Initial Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.requests && parsed.requests.length > 0) {
          const sanitizedCollection: ApiCollection = {
            version: "2.0",
            name: parsed.name || "My API Collection",
            updatedAt: parsed.updatedAt || new Date().toISOString(),
            folders: Array.isArray(parsed.folders) ? parsed.folders : [],
            requests: parsed.requests.map((r: SavedRequest) => ({
              ...r,
              folderId: r.folderId || null,
            })),
          };

          setCollection(sanitizedCollection);
          setActiveId(sanitizedCollection.requests[0].id);
          loadRequestIntoForm(sanitizedCollection.requests[0]);
          isHydrated.current = true;
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load collection from storage:", e);
    }
    loadRequestIntoForm(DEFAULT_INITIAL_COLLECTION.requests[0]);
    isHydrated.current = true;
  }, []);

  // 2. Persist to localStorage
  useEffect(() => {
    if (!isHydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    } catch (e) {
      console.error("Failed to persist collection to storage:", e);
    }
  }, [collection]);

  const loadRequestIntoForm = (req: SavedRequest) => {
    setMethod(req.method);
    setUrl(req.url);
    setQueryParams(req.queryParams || []);
    setHeaders(req.headers || []);
    setBodyType(req.bodyType || "none");
    setRawBody(req.rawBody || "");
    setFormDataList(req.formDataList || []);
    setUrlencodedList(req.urlencodedList || []);

    if (req.url.includes("localhost") || req.url.includes("127.0.0.1")) {
      setEngine("direct");
    }
  };

  const syncFormToCollection = (updates: Partial<SavedRequest>) => {
    setCollection((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === activeId ? { ...r, ...updates } : r
      ),
    }));
  };

  // Find active request and its parent folder name for breadcrumbs
  const activeRequest = useMemo(() => {
    return collection.requests.find((r) => r.id === activeId) || collection.requests[0];
  }, [collection, activeId]);

  const activeFolderName = useMemo(() => {
    if (!activeRequest?.folderId) return null;
    return collection.folders.find((f) => f.id === activeRequest.folderId)?.name || null;
  }, [collection, activeRequest]);

  // --- Collection Actions ---
  const handleSelectRequest = (id: string) => {
    if (id === activeId) return;
    setActiveId(id);
    const target = collection.requests.find((r) => r.id === id);
    if (target) {
      loadRequestIntoForm(target);
      setResponseResult(null);
      setErrorMessage(null);
      setIsCorsError(false);
    }
  };

  const handleAddRequest = (folderId: string | null = null) => {
    const newReq: SavedRequest = {
      id: `req-${Date.now()}`,
      folderId,
      name: `Untitled Request ${collection.requests.length + 1}`,
      method: "GET",
      url: "https://api.example.com",
      queryParams: [],
      headers: [{ id: "1", key: "Accept", value: "application/json", enabled: true }],
      bodyType: "none",
      rawBody: "",
      formDataList: [],
      urlencodedList: [],
      createdAt: Date.now(),
    };

    setCollection((prev) => ({
      ...prev,
      requests: [...prev.requests, newReq],
    }));
    setActiveId(newReq.id);
    loadRequestIntoForm(newReq);
  };

  const handleAddFolder = (parentId: string | null = null) => {
    const newFolder: CollectionFolder = {
      id: `fld-${Date.now()}`,
      name: parentId ? "New Subgroup" : "New Group",
      parentId,
    };

    setCollection((prev) => ({
      ...prev,
      folders: [...prev.folders, newFolder],
    }));
  };

  const handleRenameFolder = (id: string, newName: string) => {
    setCollection((prev) => ({
      ...prev,
      folders: prev.folders.map((f) => (f.id === id ? { ...f, name: newName } : f)),
    }));
  };

  const handleDeleteFolder = (folderId: string) => {
    const getDescendantFolderIds = (id: string, allFolders: CollectionFolder[]): Set<string> => {
      const result = new Set<string>([id]);
      const queue = [id];
      while (queue.length > 0) {
        const current = queue.shift()!;
        const children = allFolders.filter((f) => f.parentId === current);
        for (const child of children) {
          if (!result.has(child.id)) {
            result.add(child.id);
            queue.push(child.id);
          }
        }
      }
      return result;
    };

    const toDeleteFolderIds = getDescendantFolderIds(folderId, collection.folders);
    const remainingFolders = collection.folders.filter((f) => !toDeleteFolderIds.has(f.id));
    const remainingRequests = collection.requests.filter(
      (r) => !r.folderId || !toDeleteFolderIds.has(r.folderId)
    );

    if (remainingRequests.length > 0) {
      if (!remainingRequests.some((r) => r.id === activeId)) {
        setActiveId(remainingRequests[0].id);
        loadRequestIntoForm(remainingRequests[0]);
      }
    }

    setCollection((prev) => ({
      ...prev,
      folders: remainingFolders,
      requests: remainingRequests,
    }));
  };

  const handleDuplicateRequest = (id: string) => {
    const source = collection.requests.find((r) => r.id === id);
    if (!source) return;

    const cloned: SavedRequest = {
      ...source,
      id: `req-${Date.now()}`,
      name: `${source.name} (Copy)`,
      createdAt: Date.now(),
    };

    setCollection((prev) => ({
      ...prev,
      requests: [...prev.requests, cloned],
    }));
    setActiveId(cloned.id);
    loadRequestIntoForm(cloned);
  };

  const handleDeleteRequest = (id: string) => {
    if (collection.requests.length <= 1) return;

    const remaining = collection.requests.filter((r) => r.id !== id);
    setCollection((prev) => ({ ...prev, requests: remaining }));

    if (activeId === id) {
      setActiveId(remaining[0].id);
      loadRequestIntoForm(remaining[0]);
    }
  };

  const handleRenameRequest = (id: string, newName: string) => {
    setCollection((prev) => ({
      ...prev,
      requests: prev.requests.map((r) => (r.id === id ? { ...r, name: newName } : r)),
    }));
  };

  const handleImportCollection = (imported: ApiCollection) => {
    if (imported.requests.length > 0) {
      setCollection(imported);
      setActiveId(imported.requests[0].id);
      loadRequestIntoForm(imported.requests[0]);
    }
  };

  // --- Input Handlers ---
  const handleUrlInputChange = (newUrl: string) => {
    setUrl(newUrl);
    const { params } = extractQueryParams(newUrl);
    if (params.length > 0) {
      setQueryParams(params);
      syncFormToCollection({ url: newUrl, queryParams: params });
    } else {
      syncFormToCollection({ url: newUrl });
    }
  };

  const handleQueryParamsChange = (updatedParams: KeyValueItem[]) => {
    setQueryParams(updatedParams);
    const newUrl = buildUrlWithParams(url, updatedParams);
    setUrl(newUrl);
    syncFormToCollection({ queryParams: updatedParams, url: newUrl });
  };

  const handleHeadersChange = (updatedHeaders: KeyValueItem[]) => {
    setHeaders(updatedHeaders);
    syncFormToCollection({ headers: updatedHeaders });
  };

  const handleBodyTypeChange = (type: BodyType) => {
    setBodyType(type);
    syncFormToCollection({ bodyType: type });
  };

  const handleRawBodyChange = (val: string) => {
    setRawBody(val);
    syncFormToCollection({ rawBody: val });
  };

  const handleFormDataChange = (items: FormDataItem[]) => {
    setFormDataList(items);
    syncFormToCollection({ formDataList: items });
  };

  const handleUrlencodedChange = (items: KeyValueItem[]) => {
    setUrlencodedList(items);
    syncFormToCollection({ urlencodedList: items });
  };

  const handleMethodChange = (newMethod: HttpMethod) => {
    setMethod(newMethod);
    syncFormToCollection({ method: newMethod });
  };

  const handleImportCurl = (rawCurl: string) => {
    const parsed = parseCurlCommand(rawCurl);
    if (parsed.url) {
      setUrl(parsed.url);
      const { params } = extractQueryParams(parsed.url);
      setQueryParams(params);
      if (parsed.url.includes("localhost") || parsed.url.includes("127.0.0.1")) {
        setEngine("direct");
      }
    }
    setMethod(parsed.method);
    if (parsed.headers.length > 0) setHeaders(parsed.headers);
    setBodyType(parsed.bodyType);
    if (parsed.rawBody) setRawBody(parsed.rawBody);
    if (parsed.formDataList.length > 0) setFormDataList(parsed.formDataList);

    syncFormToCollection({
      method: parsed.method,
      url: parsed.url || url,
      headers: parsed.headers.length > 0 ? parsed.headers : headers,
      bodyType: parsed.bodyType,
      rawBody: parsed.rawBody || rawBody,
      formDataList: parsed.formDataList.length > 0 ? parsed.formDataList : formDataList,
    });
  };

  // --- HTTP Dispatch ---
  const executeDirect = async (finalUrl: string, validHeaders: KeyValueItem[]) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const reqHeaders = new Headers();
    validHeaders
      .filter((h) => !FORBIDDEN_BROWSER_HEADERS.has(h.key.toLowerCase()))
      .forEach((h) => reqHeaders.append(h.key, h.value));

    let bodyPayload: BodyInit | undefined = undefined;

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      if (bodyType === "json" || bodyType === "raw") {
        bodyPayload = rawBody;
        if (bodyType === "json" && !reqHeaders.has("Content-Type")) {
          reqHeaders.set("Content-Type", "application/json");
        }
      } else if (bodyType === "urlencoded") {
        const sp = new URLSearchParams();
        urlencodedList
          .filter((item) => item.enabled && item.key.trim())
          .forEach((item) => sp.append(item.key.trim(), item.value));
        bodyPayload = sp.toString();
        if (!reqHeaders.has("Content-Type")) {
          reqHeaders.set("Content-Type", "application/x-www-form-urlencoded");
        }
      } else if (bodyType === "form-data") {
        const fd = new FormData();
        formDataList
          .filter((item) => item.enabled && item.key.trim())
          .forEach((item) => {
            if (item.type === "file" && item.file) {
              fd.append(item.key.trim(), item.file);
            } else {
              fd.append(item.key.trim(), item.value);
            }
          });
        bodyPayload = fd;
        reqHeaders.delete("Content-Type");
      }
    }

    const t0 = performance.now();
    try {
      const response = await fetch(finalUrl, {
        method,
        headers: reqHeaders,
        body: bodyPayload,
        signal: controller.signal,
        mode: "cors",
      });
      clearTimeout(timeout);

      const ttfb = Math.round(performance.now() - t0);
      const text = await response.text();
      const total = Math.round(performance.now() - t0);
      const downloadMs = Math.max(0, total - ttfb);

      const respHeaders: { key: string; value: string }[] = [];
      response.headers.forEach((val, k) => respHeaders.push({ key: k, value: val }));

      const isJson =
        (response.headers.get("content-type") || "").includes("application/json") ||
        (text.trim().startsWith("{") && text.trim().endsWith("}"));

      setResponseResult({
        statusCode: response.status,
        statusText: response.statusText || (response.ok ? "OK" : "Error"),
        timing: { dnsMs: 0, ttfbMs: ttfb, downloadMs, totalMs: total },
        headers: respHeaders,
        body: text,
        isJson,
        isTruncated: false,
        sizeBytes: new TextEncoder().encode(text).length,
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setErrorMessage("Direct browser request timed out after 15 seconds.");
      } else {
        setIsCorsError(true);
        setErrorMessage(
          "Network request failed. Ensure the local endpoint is running and exposes CORS headers."
        );
      }
    }
  };

  const executeRelay = async (finalUrl: string, validHeaders: KeyValueItem[]) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    let payloadString: string | null = null;
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      if (bodyType === "json" || bodyType === "raw") {
        payloadString = rawBody;
      } else if (bodyType === "urlencoded") {
        const sp = new URLSearchParams();
        urlencodedList
          .filter((item) => item.enabled && item.key.trim())
          .forEach((item) => sp.append(item.key.trim(), item.value));
        payloadString = sp.toString();
      }
    }

    try {
      const res = await fetch(`${apiUrl}/api/http-runner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          url: finalUrl,
          headers: validHeaders.map((h) => ({ key: h.key.trim(), value: h.value.trim() })),
          body: payloadString,
          timeoutSeconds: 15.0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.detail || "Server relay dispatch failed.");
      } else {
        setResponseResult(data as ApiRunResponse);
      }
    } catch {
      setErrorMessage("Could not connect to the backend stateless HTTP runner.");
    }
  };

  const handleSend = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    setIsLoading(true);
    setErrorMessage(null);
    setIsCorsError(false);

    const validHeaders = headers.filter((h) => h.enabled && h.key.trim().length > 0);

    try {
      if (engine === "direct") {
        await executeDirect(trimmedUrl, validHeaders);
      } else {
        await executeRelay(trimmedUrl, validHeaders);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Tool Header with Drawer Triggers */}
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--terminal]"
        badge={
          <span
            className={`badge badge-sm badge-soft ${
              engine === "direct" ? "badge-success" : "badge-primary"
            }`}
          >
            {engine === "direct" ? t("modeDirectBadge") : t("modeRelayBadge")}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            {/* Open Collections Drawer */}
            <button
              type="button"
              onClick={() => setIsCollectionDrawerOpen(true)}
              className="btn btn-xs btn-outline gap-1.5"
              aria-haspopup="dialog"
            >
              <span className="icon-[lucide--folder-tree] size-3.5 text-primary"></span>
              <span>
                Collection ({collection.requests.length})
              </span>
            </button>

            {/* Import cURL */}
            <button
              type="button"
              onClick={() => setIsCurlModalOpen(true)}
              className="btn btn-xs btn-outline gap-1.5"
            >
              <span className="icon-[lucide--file-input] size-3.5"></span>
              <span>{t("curlImportBtn")}</span>
            </button>

            {/* Code Snippets Drawer */}
            <button
              type="button"
              onClick={() => setIsCodeDrawerOpen(true)}
              className="btn btn-xs btn-outline gap-1.5"
              aria-haspopup="dialog"
            >
              <span className="icon-[lucide--code-2] size-3.5 text-primary"></span>
              <span>Code Snippets</span>
            </button>
          </div>
        }
      />

      {/* Main Request Dispatcher Card */}
      <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-4">
        {/* Active Request Breadcrumb & Quick Switch Bar */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-base-content/10">
          <div
            onClick={() => setIsCollectionDrawerOpen(true)}
            className="flex items-center gap-2 cursor-pointer group select-none min-w-0"
            title="Click to switch request or view collection"
          >
            <span className="icon-[lucide--folder-tree] size-4 text-primary shrink-0 group-hover:scale-110 transition-transform"></span>
            <div className="flex items-center gap-1.5 text-xs truncate">
              {activeFolderName && (
                <>
                  <span className="text-base-content/50 truncate max-w-[150px]">
                    {activeFolderName}
                  </span>
                  <span className="text-base-content/30">/</span>
                </>
              )}
              <span className="font-bold text-base-content group-hover:text-primary transition-colors truncate">
                {activeRequest?.name || "Untitled Request"}
              </span>
            </div>
            <span className="badge badge-xs badge-neutral gap-1 group-hover:badge-primary transition-colors shrink-0">
              Switch
              <span className="icon-[lucide--chevron-right] size-2.5"></span>
            </span>
          </div>

          {/* Engine Selector */}
          <div className="join shrink-0">
            <button
              type="button"
              onClick={() => setEngine("direct")}
              className={`join-item btn btn-xs ${
                engine === "direct" ? "btn-primary shadow-xs" : "btn-ghost text-base-content/70"
              }`}
            >
              <span className="icon-[lucide--laptop] size-3.5"></span>
              <span className="hidden sm:inline">{t("modeDirect")}</span>
              <span className="sm:hidden">Local</span>
            </button>
            <button
              type="button"
              onClick={() => setEngine("relay")}
              className={`join-item btn btn-xs ${
                engine === "relay" ? "btn-primary shadow-xs" : "btn-ghost text-base-content/70"
              }`}
            >
              <span className="icon-[lucide--cloud] size-3.5"></span>
              <span className="hidden sm:inline">{t("modeRelay")}</span>
              <span className="sm:hidden">Relay</span>
            </button>
          </div>
        </div>

        {/* Method & URL Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <select
            value={method}
            onChange={(e) => handleMethodChange(e.target.value as HttpMethod)}
            className="select select-sm select-bordered font-mono font-bold w-full sm:w-28 text-xs focus:outline-primary"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>

          <input
            type="text"
            value={url}
            onChange={(e) => handleUrlInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("urlPlaceholder")}
            className="input input-sm input-bordered flex-1 font-mono text-xs focus:outline-primary"
          />

          <button
            type="button"
            disabled={isLoading || !url.trim()}
            onClick={handleSend}
            className="btn btn-sm btn-primary gap-2 shrink-0"
          >
            {isLoading ? (
              <span className="loading loading-spinner size-4"></span>
            ) : (
              <span className="icon-[lucide--send] size-4"></span>
            )}
            <span>{isLoading ? t("sending") : t("sendBtn")}</span>
          </button>
        </div>

        {/* Request Sub-Tabs */}
        <div className="flex flex-col gap-3 pt-2 border-t border-base-content/10">
          <div className="flex items-center gap-2 border-b border-base-content/10 pb-2">
            <button
              type="button"
              onClick={() => setRequestTab("params")}
              className={`btn btn-xs ${
                requestTab === "params" ? "btn-primary" : "btn-ghost text-base-content/60"
              }`}
            >
              Params ({queryParams.filter((p) => p.enabled && p.key.trim()).length})
            </button>
            <button
              type="button"
              onClick={() => setRequestTab("headers")}
              className={`btn btn-xs ${
                requestTab === "headers" ? "btn-primary" : "btn-ghost text-base-content/60"
              }`}
            >
              Headers ({headers.filter((h) => h.enabled && h.key.trim()).length})
            </button>
            <button
              type="button"
              onClick={() => setRequestTab("body")}
              className={`btn btn-xs ${
                requestTab === "body" ? "btn-primary" : "btn-ghost text-base-content/60"
              }`}
            >
              Body {bodyType !== "none" && "•"}
            </button>
          </div>

          {requestTab === "params" && (
            <QueryParamsTableComponent
              params={queryParams}
              onChange={handleQueryParamsChange}
            />
          )}

          {requestTab === "headers" && (
            <HeadersTableComponent headers={headers} onChange={handleHeadersChange} />
          )}

          {requestTab === "body" && (
            <BodyEditorComponent
              bodyType={bodyType}
              onBodyTypeChange={handleBodyTypeChange}
              rawBody={rawBody}
              onRawBodyChange={handleRawBodyChange}
              formDataList={formDataList}
              onFormDataChange={handleFormDataChange}
              urlencodedList={urlencodedList}
              onUrlencodedChange={handleUrlencodedChange}
            />
          )}
        </div>
      </div>

      {/* Error & CORS Notifications */}
      {errorMessage && (
        <div className="flex flex-col gap-2">
          <div className="alert alert-soft alert-error text-xs p-3 flex items-center gap-2">
            <span className="icon-[lucide--alert-triangle] size-4 shrink-0"></span>
            <span>{errorMessage}</span>
          </div>

          {isCorsError && (
            <div className="card card-border bg-base-100 p-4 shadow-sm border-warning/30 flex flex-col gap-2">
              <span className="font-bold text-xs text-warning flex items-center gap-1.5">
                <span className="icon-[lucide--shield-alert] size-4"></span>
                {t("corsErrorTitle")}
              </span>
              <p className="text-xs text-base-content/70 leading-relaxed">
                {t("corsErrorHint")}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEngine("relay");
                    setErrorMessage(null);
                    setIsCorsError(false);
                  }}
                  className="btn btn-xs btn-outline"
                >
                  Switch to Server Relay
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Response Workspace */}
      {responseResult && <ResponseViewerComponent response={responseResult} />}

      {/* Collections Drawer (FlyonUI - Left-aligned) */}
      <CollectionDrawerComponent
        isOpen={isCollectionDrawerOpen}
        onClose={() => setIsCollectionDrawerOpen(false)}
        collection={collection}
        activeId={activeId}
        onSelectRequest={handleSelectRequest}
        onAddRequest={handleAddRequest}
        onAddFolder={handleAddFolder}
        onDuplicateRequest={handleDuplicateRequest}
        onDeleteRequest={handleDeleteRequest}
        onRenameRequest={handleRenameRequest}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onImportCollection={handleImportCollection}
      />

      {/* cURL Importer Modal */}
      <CurlModalComponent
        isOpen={isCurlModalOpen}
        onClose={() => setIsCurlModalOpen(false)}
        onImport={handleImportCurl}
      />

      {/* Code Export Drawer (FlyonUI - Right-aligned) */}
      <CodeExportDrawerComponent
        isOpen={isCodeDrawerOpen}
        onClose={() => setIsCodeDrawerOpen(false)}
        method={method}
        url={url}
        headers={headers}
        bodyType={bodyType}
        rawBody={rawBody}
        formDataList={formDataList}
        urlencodedList={urlencodedList}
      />
    </div>
  );
}
