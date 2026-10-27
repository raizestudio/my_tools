// app/components/network/NetworkProbeComponent.tsx
"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";
import CopyButton from "@/app/components/ui/CopyButtonComponent";
import { PortResult } from './types'


interface ProbeResponse {
    target: string;
    resolvedIp: string;
    timestamp: string;
    results: PortResult[];
    error?: string;
}

const PRESETS: Record<string, number[]> = {
    web: [80, 443, 8080, 8443],
    mail: [25, 465, 587, 993, 995],
    infra: [21, 22, 23, 53, 3389],
    db: [3306, 5432, 6379, 27017],
    standard: [21, 22, 25, 53, 80, 110, 143, 443, 3306, 8080],
};

export default function NetworkProbeComponent() {
    const t = useTranslations("tools.networkProbe");

    const [target, setTarget] = useState("");
    const [selectedPorts, setSelectedPorts] = useState<number[]>(
        PRESETS.standard,
    );
    const [newPortInput, setNewPortInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [probeData, setProbeData] = useState<ProbeResponse | null>(null);

    const handleApplyPreset = (key: string) => {
        setSelectedPorts(PRESETS[key] || PRESETS.standard);
    };

    const handleAddPort = () => {
        const p = parseInt(newPortInput.trim(), 10);
        if (!isNaN(p) && p >= 1 && p <= 65535 && !selectedPorts.includes(p)) {
            if (selectedPorts.length >= 20) return;
            setSelectedPorts([...selectedPorts, p].sort((a, b) => a - b));
            setNewPortInput("");
        }
    };

    const handleRemovePort = (port: number) => {
        setSelectedPorts(selectedPorts.filter((p) => p !== port));
    };

    const handleRunProbe = async () => {
        const trimmedTarget = target.trim();
        if (!trimmedTarget || selectedPorts.length === 0) return;

        setIsLoading(true);
        setErrorMessage(null);

        const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        try {
            const res = await fetch(`${apiUrl}/probe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    target: trimmedTarget,
                    ports: selectedPorts,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(
                    data.detail || data.error || "Failed to scan target host.",
                );
            } else {
                setProbeData(data as ProbeResponse);
            }
        } catch {
            setErrorMessage(
                "Network error: Could not reach FastAPI probe service.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const stats = useMemo(() => {
        if (!probeData?.results) return null;
        const open = probeData.results.filter(
            (r) => r.status === "open",
        ).length;
        const closed = probeData.results.filter(
            (r) => r.status === "closed",
        ).length;
        const filtered = probeData.results.filter(
            (r) => r.status === "filtered",
        ).length;
        return { open, closed, filtered };
    }, [probeData]);

    const jsonReport = useMemo(() => {
        return probeData ? JSON.stringify(probeData, null, 2) : "";
    }, [probeData]);

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
            <ToolHeader
                title={t("title")}
                description={t("desc")}
                icon="icon-[lucide--network]"
                badge={
                    <span className="badge badge-sm badge-soft badge-primary">
                        {t("badgeServer")}
                    </span>
                }
            />

            {/* Configuration Card */}
            <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-5">
                {/* Target input row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                    <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
                            {t("targetLabel")}
                        </label>
                        <div className="relative">
                            <span className="icon-[lucide--globe] size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></span>
                            <input
                                type="text"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleRunProbe()
                                }
                                placeholder={t("targetPlaceholder")}
                                className="input input-sm w-full pl-9 font-mono text-xs focus:outline-primary"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={
                            isLoading ||
                            !target.trim() ||
                            selectedPorts.length === 0
                        }
                        onClick={handleRunProbe}
                        className="btn btn-sm btn-primary gap-2 shrink-0"
                    >
                        {isLoading ? (
                            <span className="loading loading-spinner size-4"></span>
                        ) : (
                            <span className="icon-[lucide--radar] size-4"></span>
                        )}
                        <span>
                            {isLoading ? t("probing") : t("startProbe")}
                        </span>
                    </button>
                </div>

                {/* Presets and Custom Ports */}
                <div className="flex flex-col gap-3 pt-3 border-t border-base-content/10">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-base-content/70">
                            {t("presetsLabel")} :
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleApplyPreset("standard")}
                                className="btn btn-xs btn-outline"
                            >
                                {t("presetStandard")}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyPreset("web")}
                                className="btn btn-xs btn-outline"
                            >
                                {t("presetWeb")}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyPreset("mail")}
                                className="btn btn-xs btn-outline"
                            >
                                {t("presetMail")}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyPreset("infra")}
                                className="btn btn-xs btn-outline"
                            >
                                {t("presetInfra")}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyPreset("db")}
                                className="btn btn-xs btn-outline"
                            >
                                {t("presetDb")}
                            </button>
                        </div>
                    </div>

                    {/* Port Pills & Adder */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs text-base-content/60 mr-1">
                            {t("customPortsLabel")} :
                        </span>
                        {selectedPorts.map((p) => (
                            <span
                                key={p}
                                className="badge badge-sm badge-neutral font-mono gap-1.5 py-2.5 px-2"
                            >
                                <span>{p}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemovePort(p)}
                                    className="hover:text-error text-base-content/50"
                                >
                                    ✕
                                </button>
                            </span>
                        ))}

                        {selectedPorts.length < 20 && (
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="1"
                                    max="65535"
                                    value={newPortInput}
                                    onChange={(e) =>
                                        setNewPortInput(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && handleAddPort()
                                    }
                                    placeholder={t("addPortPlaceholder")}
                                    className="input input-xs w-24 font-mono text-center focus:outline-primary"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddPort}
                                    className="btn btn-xs btn-ghost"
                                >
                                    {t("addBtn")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-[11px] text-base-content/50 italic">
                    {t("ssrfNotice")}
                </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
                <div className="alert alert-soft alert-error text-xs p-3 flex items-center gap-2">
                    <span className="icon-[lucide--alert-triangle] size-4 shrink-0"></span>
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Results Workspace */}
            {probeData && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                    {/* Header Summary */}
                    <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <span className="icon-[lucide--server] size-5"></span>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-base-content">
                                        {probeData.target}
                                    </span>
                                    <span className="badge badge-sm badge-outline font-mono">
                                        {probeData.resolvedIp}
                                    </span>
                                </div>
                                {stats && (
                                    <div className="flex items-center gap-2 text-xs font-semibold mt-0.5">
                                        <span className="text-success">
                                            {t("openSummary", {
                                                count: stats.open,
                                            })}
                                        </span>
                                        <span className="text-base-content/30">
                                            •
                                        </span>
                                        <span className="text-error">
                                            {t("closedSummary", {
                                                count: stats.closed,
                                            })}
                                        </span>
                                        <span className="text-base-content/30">
                                            •
                                        </span>
                                        <span className="text-warning">
                                            {t("filteredSummary", {
                                                count: stats.filtered,
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <CopyButton
                            text={jsonReport}
                            label={t("exportReport")}
                            size="xs"
                            variant="outline"
                        />
                    </div>

                    {/* Results Table */}
                    <div className="card card-border bg-base-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="table table-sm">
                                <thead>
                                    <tr className="bg-base-200/50 text-xs text-base-content/70">
                                        <th className="w-20">Port</th>
                                        <th className="w-28">{t("service")}</th>
                                        <th className="w-32">{t("status")}</th>
                                        <th className="w-24">{t("latency")}</th>
                                        <th>{t("banner")}</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-mono">
                                    {probeData.results.map((res) => (
                                        <tr
                                            key={res.port}
                                            className="hover:bg-base-200/30"
                                        >
                                            <td className="font-bold text-base-content">
                                                {res.port}
                                            </td>
                                            <td className="font-sans text-base-content/80 font-medium">
                                                {res.service}
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge badge-xs font-sans font-bold ${
                                                        res.status === "open"
                                                            ? "badge-success"
                                                            : res.status ===
                                                                "closed"
                                                              ? "badge-error"
                                                              : "badge-warning"
                                                    }`}
                                                >
                                                    {res.status === "open"
                                                        ? t("statusOpen")
                                                        : res.status ===
                                                            "closed"
                                                          ? t("statusClosed")
                                                          : t("statusFiltered")}
                                                </span>
                                            </td>
                                            <td className="text-base-content/60">
                                                {res.latencyMs} ms
                                            </td>
                                            <td className="max-w-md">
                                                {res.banner ? (
                                                    <span
                                                        title={res.banner}
                                                        className="bg-base-200/70 p-1 rounded block truncate text-[11px] text-primary"
                                                    >
                                                        {res.banner}
                                                    </span>
                                                ) : (
                                                    <span className="text-base-content/30 font-sans italic text-[11px]">
                                                        {t("noBanner")}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
