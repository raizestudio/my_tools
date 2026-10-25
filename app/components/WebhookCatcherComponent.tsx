"use client";

import { useState, useEffect, useRef } from "react";

export interface WebhookRecord {
  id: number;
  method: string;
  url_path: string;
  headers: Record<string, string>;
  query_params: Record<string, string>;
  body: string | null;
  ip_address: string;
  created_at: string;
}

function buildCurlCommand(endpoint: string): string {
  return `curl -X POST "${endpoint}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"event": "ping", "timestamp": ${Date.now()}}'`;
}

export default function WebhookCatcherComponent() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [records, setRecords] = useState<WebhookRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<WebhookRecord | null>(
    null,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<"body" | "headers" | "params">(
    "body",
  );
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchPreviousRequests = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/webhooks/sessions/${id}/requests`);
      if (res.ok) {
        const data: WebhookRecord[] = await res.json();
        setRecords(data);
        if (data.length > 0) setSelectedRecord(data[0]);
      } else if (res.status === 404) {
        localStorage.removeItem("webhook_session_id");
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      const stored = localStorage.getItem("webhook_session_id");
      if (stored) {
        setSessionId(stored);
        fetchPreviousRequests(stored);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/webhooks/sessions`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Could not create session");
        const data = await res.json();
        localStorage.setItem("webhook_session_id", data.session_id);
        setSessionId(data.session_id);
      } catch (err) {
        console.error(err);
      }
    };

    initSession();
  }, [apiUrl]);

  useEffect(() => {
    if (!sessionId) return;

    const wsUrl = apiUrl.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/webhooks/ws/${sessionId}`);
    socketRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const newReq: WebhookRecord = JSON.parse(event.data);
        setRecords((prev) => [newReq, ...prev]);
        setSelectedRecord((prev) => prev ?? newReq);
      } catch (err) {
        console.error(err);
      }
    };

    return () => {
      ws.close();
    };
  }, [sessionId, apiUrl]);

  const createNewSession = async () => {
    try {
      const res = await fetch(`${apiUrl}/webhooks/sessions`, {
        method: "POST",
      });
      if (!res.ok) return;
      const data = await res.json();
      localStorage.setItem("webhook_session_id", data.session_id);
      setSessionId(data.session_id);
      setRecords([]);
      setSelectedRecord(null);
    } catch (err) {
      console.error(err);
    }
  };

  const webhookEndpoint = sessionId
    ? `${apiUrl}/webhooks/catch/${sessionId}`
    : "";
  const handleCopyCurl = async () => {
    if (!webhookEndpoint) return;
    const curlCmd = buildCurlCommand(webhookEndpoint);
    await copyToClipboard(curlCmd, setCopiedCurl);
  };

  const copyToClipboard = async (
    text: string,
    setCopied: (v: boolean) => void,
  ) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodBadge = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "badge-info";
      case "POST":
        return "badge-success";
      case "PUT":
      case "PATCH":
        return "badge-warning";
      case "DELETE":
        return "badge-error";
      default:
        return "badge-neutral";
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Top Banner: Endpoint details */}
      <div className="card bg-base-200 border border-base-300 shadow-xl">
        <div className="card-body p-4 sm:p-6 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-base-300">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span className="icon-[lucide--radio] text-primary size-6"></span>
                Webhook & Request Catcher
              </h1>
              <p className="text-xs text-base-content/70">
                Envoyez n'importe quelle requête HTTP sur cette URL pour
                inspecter en temps réel son en-tête et son body.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`badge badge-sm gap-1.5 ${isConnected ? "badge-success" : "badge-error"}`}
              >
                <span className="size-1.5 rounded-full bg-current"></span>
                {isConnected ? "Connecté (Live)" : "Déconnecté"}
              </span>
              <button
                onClick={createNewSession}
                className="btn btn-xs btn-ghost gap-1"
                title="Créer une nouvelle session vierge"
              >
                <span className="icon-[lucide--refresh-cw] size-3"></span>
                Nouvelle URL
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold">
              Votre URL de Webhook personnalisée :
            </label>
            <div className="flex items-center gap-2 bg-base-100 p-2.5 rounded-lg border border-base-300">
              <input
                type="text"
                readOnly
                value={webhookEndpoint || "Génération de session..."}
                className="bg-transparent font-mono text-xs flex-1 outline-none text-primary truncate select-all"
              />
              <button
                onClick={() => copyToClipboard(webhookEndpoint, setCopiedUrl)}
                className={`btn btn-xs ${copiedUrl ? "btn-success" : "btn-primary"}`}
              >
                <span
                  className={
                    copiedUrl
                      ? "icon-[lucide--check] size-3.5"
                      : "icon-[lucide--copy] size-3.5"
                  }
                ></span>
                {copiedUrl ? "Copié" : "Copier"}
              </button>
              <button
                onClick={handleCopyCurl}
                className="btn btn-xs btn-ghost gap-1"
                title="Copier un exemple cURL"
              >
                <span className="icon-[lucide--terminal] size-3.5"></span>
                {copiedCurl ? "cURL copié !" : "cURL"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Request History List */}
        <div className="lg:col-span-4 card bg-base-200 border border-base-300 shadow-xl overflow-hidden">
          <div className="p-3 border-b border-base-300 flex justify-between items-center bg-base-300/40">
            <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">
              Requêtes ({records.length})
            </span>
            <button
              onClick={() => setRecords([])}
              disabled={records.length === 0}
              className="btn btn-xs btn-ghost text-base-content/50 hover:text-error"
            >
              Effacer la vue
            </button>
          </div>

          <div className="divide-y divide-base-300 max-h-[580px] overflow-y-auto">
            {records.length === 0 ? (
              <div className="p-8 text-center text-xs text-base-content/50 flex flex-col items-center gap-2">
                <span className="icon-[lucide--inbox] size-8 opacity-40 animate-pulse"></span>
                <span>En attente de requêtes...</span>
                <span>
                  Envoyez une requête POST/GET à l'URL ci-dessus pour la voir
                  apparaître ici.
                </span>
              </div>
            ) : (
              records.map((r) => {
                const isSelected = selectedRecord?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className={`w-full text-left p-3 flex flex-col gap-1.5 transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-l-4 border-primary"
                        : "hover:bg-base-300/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`badge badge-xs font-mono font-bold ${getMethodBadge(r.method)}`}
                      >
                        {r.method}
                      </span>
                      <span className="text-[10px] text-base-content/50 font-mono">
                        {new Date(r.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs font-mono truncate text-base-content/80">
                      {r.url_path}
                    </div>
                    <div className="text-[10px] text-base-content/50 truncate">
                      IP: {r.ip_address}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Request Inspector */}
        <div className="lg:col-span-8 card bg-base-200 border border-base-300 shadow-xl overflow-hidden min-h-[420px]">
          {selectedRecord ? (
            <div className="flex flex-col">
              {/* Header Details */}
              <div className="p-4 border-b border-base-300 flex flex-wrap items-center justify-between gap-3 bg-base-300/30">
                <div className="flex items-center gap-2">
                  <span
                    className={`badge font-mono font-bold ${getMethodBadge(selectedRecord.method)}`}
                  >
                    {selectedRecord.method}
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {selectedRecord.url_path}
                  </span>
                </div>
                <span className="text-xs font-mono text-base-content/60">
                  {new Date(selectedRecord.created_at).toLocaleString()}
                </span>
              </div>

              {/* Sub-Tabs */}
              <div className="flex border-b border-base-300 px-4 pt-2 gap-2 bg-base-200">
                <button
                  onClick={() => setActiveTab("body")}
                  className={`btn btn-xs ${activeTab === "body" ? "btn-primary" : "btn-ghost"}`}
                >
                  Payload / Body
                </button>
                <button
                  onClick={() => setActiveTab("headers")}
                  className={`btn btn-xs ${activeTab === "headers" ? "btn-primary" : "btn-ghost"}`}
                >
                  Headers ({Object.keys(selectedRecord.headers).length})
                </button>
                <button
                  onClick={() => setActiveTab("params")}
                  className={`btn btn-xs ${activeTab === "params" ? "btn-primary" : "btn-ghost"}`}
                >
                  Query Params (
                  {Object.keys(selectedRecord.query_params).length})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-4">
                {activeTab === "body" && (
                  <div className="relative">
                    {selectedRecord.body ? (
                      <textarea
                        readOnly
                        value={(() => {
                          try {
                            return JSON.stringify(
                              JSON.parse(selectedRecord.body),
                              null,
                              2,
                            );
                          } catch {
                            return selectedRecord.body;
                          }
                        })()}
                        rows={16}
                        className="textarea textarea-bordered font-mono text-xs w-full bg-base-100 select-all leading-relaxed"
                      />
                    ) : (
                      <div className="text-xs text-base-content/50 p-8 text-center italic">
                        Aucun body fourni avec cette requête.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "headers" && (
                  <div className="bg-base-100 border border-base-300 rounded-lg overflow-x-auto">
                    <table className="table table-xs font-mono">
                      <thead>
                        <tr className="bg-base-200">
                          <th>Header</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedRecord.headers).map(
                          ([k, v]) => (
                            <tr key={k} className="hover:bg-base-200/50">
                              <td className="font-semibold text-primary select-all">
                                {k}
                              </td>
                              <td className="text-base-content/80 break-all select-all">
                                {v}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "params" && (
                  <div className="bg-base-100 border border-base-300 rounded-lg overflow-x-auto">
                    {Object.keys(selectedRecord.query_params).length === 0 ? (
                      <div className="text-xs text-base-content/50 p-6 text-center italic">
                        Aucun paramètre URL (query parameter).
                      </div>
                    ) : (
                      <table className="table table-xs font-mono">
                        <thead>
                          <tr className="bg-base-200">
                            <th>Clé</th>
                            <th>Valeur</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(selectedRecord.query_params).map(
                            ([k, v]) => (
                              <tr key={k}>
                                <td className="font-semibold text-primary">
                                  {k}
                                </td>
                                <td className="text-base-content/80 break-all">
                                  {v}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center text-xs text-base-content/50 gap-2 h-full">
              <span className="icon-[lucide--mouse-pointer-click] size-8 opacity-40"></span>
              <span>
                Sélectionnez une requête dans la colonne de gauche pour
                inspecter ses détails.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
