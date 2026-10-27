// app/components/dns-auditor/DnsAuditorComponent.tsx
"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";
import CopyButton from "@/app/components/ui/CopyButtonComponent";

interface DnsRecordItem {
    recordType: string;
    name: string;
    ttl: number;
    data: string;
}

interface DnssecStatus {
    enabled: boolean;
    status: string;
    details: string;
    dsRecords: string[];
    dnskeyRecords: string[];
}

interface MailSecurityAudit {
    spfRecord?: string;
    spfStatus: string;
    spfDetails: string;
    dmarcRecord?: string;
    dmarcPolicy?: string;
    dmarcStatus: string;
}

interface CaaAudit {
    configured: boolean;
    allowedCAs: string[];
    details: string;
}

interface DnsAuditResponse {
    domain: string;
    timestamp: string;
    queryTimeMs: number;
    records: DnsRecordItem[];
    dnssec: DnssecStatus;
    mailSecurity: MailSecurityAudit;
    caa: CaaAudit;
}

type RecordFilterTab = "all" | "dnssec" | "mail";

export default function DnsAuditorComponent() {
    const t = useTranslations("tools.dnsAuditor");

    const [domainInput, setDomainInput] = useState("");
    const [activeTab, setActiveTab] = useState<RecordFilterTab>("all");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [auditData, setAuditData] = useState<DnsAuditResponse | null>(null);

    const handleLoadSample = () => {
        setDomainInput("cloudflare.com");
        setAuditData(null);
        setErrorMessage(null);
    };

    const handleRunAudit = async () => {
        const trimmed = domainInput.trim();
        if (!trimmed) return;

        setIsLoading(true);
        setErrorMessage(null);

        const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        try {
            const res = await fetch(`${apiUrl}/dns-audit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain: trimmed }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(
                    data.detail ||
                        "DNS resolution failed for the specified domain.",
                );
            } else {
                setAuditData(data as DnsAuditResponse);
            }
        } catch {
            setErrorMessage(
                "Could not connect to the backend DNS auditor service.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Filter records based on active tab selection
    const filteredRecords = useMemo(() => {
        if (!auditData?.records) return [];
        if (activeTab === "dnssec") {
            return auditData.records.filter((r) =>
                ["DS", "DNSKEY", "RRSIG"].includes(r.recordType),
            );
        }
        if (activeTab === "mail") {
            return auditData.records.filter(
                (r) =>
                    r.recordType === "MX" ||
                    (r.recordType === "TXT" &&
                        (r.data.includes("v=spf1") ||
                            r.name.includes("_dmarc") ||
                            r.data.includes("v=DMARC1"))),
            );
        }
        return auditData.records;
    }, [auditData, activeTab]);

    const jsonReport = useMemo(() => {
        return auditData ? JSON.stringify(auditData, null, 2) : "";
    }, [auditData]);

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
            <ToolHeader
                title={t("title")}
                description={t("desc")}
                icon="icon-[lucide--shield-check]"
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
                        {(domainInput || auditData) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setDomainInput("");
                                    setAuditData(null);
                                    setErrorMessage(null);
                                }}
                                className="btn btn-xs btn-ghost text-base-content/60"
                            >
                                {t("clear")}
                            </button>
                        )}
                    </div>
                }
            />

            {/* Target Domain Input Card */}
            <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                    <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
                            {t("inputLabel")}
                        </label>
                        <div className="relative">
                            <span className="icon-[lucide--globe] size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></span>
                            <input
                                type="text"
                                value={domainInput}
                                onChange={(e) => setDomainInput(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleRunAudit()
                                }
                                placeholder={t("inputPlaceholder")}
                                className="input input-sm w-full pl-9 font-mono text-xs focus:outline-primary"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={isLoading || !domainInput.trim()}
                        onClick={handleRunAudit}
                        className="btn btn-sm btn-primary gap-2 shrink-0"
                    >
                        {isLoading ? (
                            <span className="loading loading-spinner size-4"></span>
                        ) : (
                            <span className="icon-[lucide--search] size-4"></span>
                        )}
                        <span>{isLoading ? t("auditing") : t("auditBtn")}</span>
                    </button>
                </div>

                <p className="text-[11px] text-base-content/50 italic">
                    {t("ssrfNotice")}
                </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="alert alert-soft alert-error text-xs p-3 flex items-center gap-2">
                    <span className="icon-[lucide--alert-triangle] size-4 shrink-0"></span>
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Audit Workspace */}
            {auditData && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                    {/* Executive Security Posture Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. DNSSEC Card */}
                        <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-col justify-between gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-base-content/70 flex items-center gap-1.5">
                                    <span className="icon-[lucide--key-round] size-4 text-primary"></span>
                                    {t("dnssecTitle")}
                                </span>
                                <span
                                    className={`badge badge-xs font-bold ${
                                        auditData.dnssec.enabled
                                            ? "badge-success"
                                            : auditData.dnssec.status ===
                                                "Insecure / Not Configured"
                                              ? "badge-neutral"
                                              : "badge-warning"
                                    }`}
                                >
                                    {auditData.dnssec.status}
                                </span>
                            </div>
                            <p className="text-xs text-base-content/80 leading-relaxed">
                                {auditData.dnssec.details}
                            </p>
                            <div className="text-[10px] font-mono text-base-content/50 border-t border-base-content/10 pt-2 flex justify-between">
                                <span>
                                    DS: {auditData.dnssec.dsRecords.length}
                                </span>
                                <span>
                                    DNSKEY:{" "}
                                    {auditData.dnssec.dnskeyRecords.length}
                                </span>
                            </div>
                        </div>

                        {/* 2. CAA Policy Card */}
                        <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-col justify-between gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-base-content/70 flex items-center gap-1.5">
                                    <span className="icon-[lucide--badge-check] size-4 text-primary"></span>
                                    {t("caaTitle")}
                                </span>
                                <span
                                    className={`badge badge-xs font-bold ${
                                        auditData.caa.configured
                                            ? "badge-success"
                                            : "badge-neutral"
                                    }`}
                                >
                                    {auditData.caa.configured
                                        ? "Configured"
                                        : "Unrestricted"}
                                </span>
                            </div>
                            <p className="text-xs text-base-content/80 leading-relaxed">
                                {auditData.caa.details}
                            </p>
                            <div className="text-[10px] font-mono text-base-content/50 border-t border-base-content/10 pt-2 truncate">
                                {auditData.caa.allowedCAs.length > 0
                                    ? `Allowed: ${auditData.caa.allowedCAs.join(", ")}`
                                    : "All public CAs permitted"}
                            </div>
                        </div>

                        {/* 3. Mail Security (SPF / DMARC) Card */}
                        <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-col justify-between gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-base-content/70 flex items-center gap-1.5">
                                    <span className="icon-[lucide--mail-check] size-4 text-primary"></span>
                                    {t("mailSecTitle")}
                                </span>
                                <span
                                    className={`badge badge-xs font-bold ${
                                        auditData.mailSecurity.spfStatus ===
                                            "Valid" &&
                                        auditData.mailSecurity.dmarcPolicy ===
                                            "reject"
                                            ? "badge-success"
                                            : auditData.mailSecurity
                                                    .spfStatus === "Missing"
                                              ? "badge-error"
                                              : "badge-warning"
                                    }`}
                                >
                                    {auditData.mailSecurity.dmarcPolicy
                                        ? `DMARC: ${auditData.mailSecurity.dmarcPolicy}`
                                        : "DMARC Missing"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-base-content/60">
                                        SPF:
                                    </span>
                                    <span className="font-mono text-[11px] truncate max-w-[200px]">
                                        {auditData.mailSecurity.spfRecord ||
                                            "None"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-base-content/60">
                                        Policy:
                                    </span>
                                    <span className="font-bold text-primary">
                                        {auditData.mailSecurity.dmarcPolicy ||
                                            "Unconfigured"}
                                    </span>
                                </div>
                            </div>
                            <div className="text-[10px] text-base-content/50 border-t border-base-content/10 pt-2 truncate">
                                {auditData.mailSecurity.spfDetails}
                            </div>
                        </div>
                    </div>

                    {/* Record Directory & Raw View */}
                    <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-content/10 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-2">
                                    <span className="icon-[lucide--database] size-4 text-primary"></span>
                                    {t("recordsTitle")}
                                </span>

                                <div className="join ml-3">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("all")}
                                        className={`join-item btn btn-xs ${
                                            activeTab === "all"
                                                ? "btn-primary"
                                                : "btn-ghost"
                                        }`}
                                    >
                                        {t("tabAll")} (
                                        {auditData.records.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("dnssec")}
                                        className={`join-item btn btn-xs ${
                                            activeTab === "dnssec"
                                                ? "btn-primary"
                                                : "btn-ghost"
                                        }`}
                                    >
                                        {t("tabDnssec")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("mail")}
                                        className={`join-item btn btn-xs ${
                                            activeTab === "mail"
                                                ? "btn-primary"
                                                : "btn-ghost"
                                        }`}
                                    >
                                        {t("tabMail")}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-base-content/60">
                                    {t("queryTime")}:{" "}
                                    <strong>{auditData.queryTimeMs} ms</strong>
                                </span>
                                <CopyButton
                                    text={jsonReport}
                                    label={t("exportReport")}
                                    size="xs"
                                    variant="outline"
                                />
                            </div>
                        </div>

                        {/* Records Table */}
                        <div className="overflow-x-auto">
                            <table className="table table-sm">
                                <thead>
                                    <tr className="bg-base-200/50 text-xs text-base-content/70">
                                        <th className="w-24">{t("colType")}</th>
                                        <th className="w-48">{t("colName")}</th>
                                        <th className="w-20">{t("colTtl")}</th>
                                        <th>{t("colData")}</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-mono">
                                    {filteredRecords.length > 0 ? (
                                        filteredRecords.map((r, i) => (
                                            <tr
                                                key={`${r.recordType}-${r.name}-${i}`}
                                                className="hover:bg-base-200/30"
                                            >
                                                <td>
                                                    <span className="badge badge-xs badge-neutral font-bold">
                                                        {r.recordType}
                                                    </span>
                                                </td>
                                                <td className="text-base-content/80 truncate max-w-xs">
                                                    {r.name}
                                                </td>
                                                <td className="text-base-content/50">
                                                    {r.ttl}s
                                                </td>
                                                <td className="text-base-content break-all bg-base-200/30 rounded p-1.5 selection:bg-primary/20">
                                                    {r.data}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="text-center py-6 text-base-content/40 italic"
                                            >
                                                {t("noRecords")}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
