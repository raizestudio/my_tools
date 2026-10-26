// app/components/CertInspectorComponent.tsx
"use client";

import { useState, useMemo, useEffect, ChangeEvent, DragEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import forge from "node-forge";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";
import CopyButton from "@/app/components/ui/CopyButtonComponent";

// Certificat X.509 RSA 2048 bits auto-signé valide (SANs: 0w.lat, *.0w.lat, 127.0.0.1)
const SAMPLE_CERT = `-----BEGIN CERTIFICATE-----
MIID4TCCAsmgAwIBAgIUI0XHIxxHTuEdQMT7u6JSRUUcLPEwDQYJKoZIhvcNAQEL
BQAwdzELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcM
DVNhbiBGcmFuY2lzY28xGTAXBgNVBAoMEDB3IFNlY3VyaXR5IExhYnMxDzANBgNV
BAsMBkRldk9wczEPMA0GA1UEAwwGMHcubGF0MB4XDTI2MTAyNTIwNDkyM1oXDTI3
MTAyNjIwNDkyM1owdzELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWEx
FjAUBgNVBAcMDVNhbiBGcmFuY2lzY28xGTAXBgNVBAoMEDB3IFNlY3VyaXR5IExh
YnMxDzANBgNVBAsMBkRldk9wczEPMA0GA1UEAwwGMHcubGF0MIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvbfgqFwqi0El+H7lGcxrpICy1JCogNykQyUd
kTxR+lLABeTbB0EN1gDRIQaC+PYBq9/f1jxFhpx757iFzQcHCn90ryKhclDvsSeX
WZbzRJp8ufTI8yVCSE/56eXHCJDx5jySv2rez/lADfQmTmm9XrVlGcH0DJBLwwtk
KniPG24xMgvHaSMA54HJesVCDShNIKFvggrLSFIe56UThtuy8CyynGSghri7rYkq
N3MPgudfhJbr8zcadgwiUw3DRjNgpYi39hyqVoCkoTmPUdsz/pS1Wm5w602xvnpR
p9XkdG0redmePBBE0Wct1/PFu8dOZuyU/F9DcsvtF8CIVnI8WQIDAQABo2UwYzAh
BgNVHREEGjAYggYwdy5sYXSCCCouMHcubGF0hwR/AAABMA8GA1UdEwEB/wQFMAMB
Af8wDgYDVR0PAQH/BAQDAgGmMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcD
AjANBgkqhkiG9w0BAQsFAAOCAQEAMjiTnug0AZX7ejI3B4HppjXaG2fwt3zvrVOn
ItVNvCCSe4E4N1BsRo8dlrvt7LNbpVSGsbSfd1Ptsr1LKtpC9n5wXjTk5N8mpdUN
3gpFcaShG9bOkawteyVvifxhsH7Hw4jFtQmZojESHwG3NBZwREqU+HwrVJVcq/u9
+t9P2oZ1S7LVT68XdeBgnWr6e131Qrp/r9RcxwkBiPvy4J+EsfA0LENiGlRMavA7
6GQw1TGNTWWci3f4ChFSljppU5ypUXeCEXo28XKqXyqalp06Kb4ftZCeyrtEx8Rh
FCoOqDyo4KToCa7OgjL2qN/4dhrQT5cGlFAFlCL18X6mS0RD/w==
-----END CERTIFICATE-----`;

// CSR PKCS#10 RSA 2048 bits valide (SANs: api.0w.lat, auth.0w.lat)
const SAMPLE_CSR = `-----BEGIN CERTIFICATE REQUEST-----
MIIC7jCCAdYCAQAwdDELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWEx
FjAUBgNVBAcMDVNhbiBGcmFuY2lzY28xEDAOBgNVBAoMBzB3IExhYnMxETAPBgNV
BAsMCFNlY3VyaXR5MRMwEQYDVQQDDAphcGkuMHcubGF0MIIBIjANBgkqhkiG9w0B
AQEFAAOCAQ8AMIIBCgKCAQEAvbfgqFwqi0El+H7lGcxrpICy1JCogNykQyUdkTxR
+lLABeTbB0EN1gDRIQaC+PYBq9/f1jxFhpx757iFzQcHCn90ryKhclDvsSeXWZbz
RJp8ufTI8yVCSE/56eXHCJDx5jySv2rez/lADfQmTmm9XrVlGcH0DJBLwwtkKniP
G24xMgvHaSMA54HJesVCDShNIKFvggrLSFIe56UThtuy8CyynGSghri7rYkqN3MP
gudfhJbr8zcadgwiUw3DRjNgpYi39hyqVoCkoTmPUdsz/pS1Wm5w602xvnpRp9Xk
dG0redmePBBE0Wct1/PFu8dOZuyU/F9DcsvtF8CIVnI8WQIDAQABoDUwMwYJKoZI
hvcNAQkOMSYwJDAiBgNVHREEGzAZggphcGkuMHcubGF0ggthdXRoLjB3LmxhdDAN
BgkqhkiG9w0BAQsFAAOCAQEAZjJJy3TxY/jUIekBOIs5xpsi8XSFX58oPV6DxAPt
PEiOtl8y89IABBi76tT7J0P5ZrnNjUgupmyRyq1vzbpla+UoS7e7mfy08bIu7CBN
6XvKeCRINMJeDsnulpyRa6zVpHMuEin2PgCgWUVoaKioJH+5GZdMKlPehpX06MkD
Bra61M+hSN/hPG7hvEjOC28LToZy3g4fZDC6stZh+38XJkJpypcPYu38di6TUjqx
EbwtxlODtvLqlSBiDntTn9I3lv9auLThFZsfBHiI9lciQP68IZALbNUOeKozHHm6
kRHGe/ymjf7S3cp/OgZjXRQ8xbqZTwTZ188b9AmxiaIz/g==
-----END CERTIFICATE REQUEST-----`;

interface ParsedCertData {
  type: "cert" | "csr";
  rawPem: string;
  subject: {
    cn: string | null;
    o: string | null;
    ou: string | null;
    c: string | null;
    st: string | null;
    l: string | null;
  };
  issuer: {
    cn: string | null;
    o: string | null;
    c: string | null;
  };
  validity: {
    notBefore: Date;
    notAfter: Date;
    daysRemaining: number;
    isExpired: boolean;
    isNotYetValid: boolean;
  } | null;
  sans: { type: string; value: string }[];
  publicKey: {
    algorithm: string;
    keySize: string;
  };
  sigAlg: string;
  serialNumber: string | null;
  extensions: {
    isCa: boolean | null;
    keyUsage: string[];
    extKeyUsage: string[];
  };
  csrVerified: boolean | null;
  fingerprints: {
    sha256: string;
    sha1: string;
  };
}

export default function CertInspectorComponent() {
  const t = useTranslations("tools.certInspector");
  const locale = useLocale();

  const [inputPem, setInputPem] = useState<string>(SAMPLE_CERT);
  const [selectedChainIdx, setSelectedChainIdx] = useState<number>(0);
  const [parsedList, setParsedList] = useState<ParsedCertData[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fallback sécurisé pour l'import node-forge en environnement ESM/Turbopack
  const pki = useMemo(() => {
    if (forge.pki) return forge.pki;
    if ((forge as any).default?.pki) return (forge as any).default.pki;
    return forge.pki;
  }, []);

  const computeFingerprints = async (pemBlock: string) => {
    try {
      const b64 = pemBlock
        .replace(/-----BEGIN [A-Z0-9 ]+-----/g, "")
        .replace(/-----END [A-Z0-9 ]+-----/g, "")
        .replace(/\s+/g, "");

      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      if (typeof window !== "undefined" && window.crypto?.subtle) {
        const sha256Buffer = await crypto.subtle.digest("SHA-256", bytes);
        const sha256 = Array.from(new Uint8Array(sha256Buffer))
          .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
          .join(":");

        const sha1Buffer = await crypto.subtle.digest("SHA-1", bytes);
        const sha1 = Array.from(new Uint8Array(sha1Buffer))
          .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
          .join(":");

        return { sha256, sha1 };
      }
      return { sha256: "Unavailable", sha1: "Unavailable" };
    } catch {
      return { sha256: "Unavailable", sha1: "Unavailable" };
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const parseAll = async () => {
      const trimmed = inputPem.trim();
      if (!trimmed) {
        setParsedList([]);
        setParseError(null);
        return;
      }

      setParseError(null);

      // 1. Détection des CSR (PKCS#10)
      const csrRegex =
        /-----BEGIN (NEW )?CERTIFICATE REQUEST-----[\s\S]*?-----END (NEW )?CERTIFICATE REQUEST-----/g;
      const csrMatches = trimmed.match(csrRegex);

      if (csrMatches && csrMatches.length > 0) {
        try {
          const rawCsr = csrMatches[0];
          const csr = pki.certificationRequestFromPem(rawCsr);
          const fps = await computeFingerprints(rawCsr);

          const getField = (attrs: any[], name: string) => {
            if (!attrs || !Array.isArray(attrs)) return null;
            const found = attrs.find((a) => a.shortName === name || a.name === name);
            return found && typeof found.value === "string" ? found.value : null;
          };

          const sans: { type: string; value: string }[] = [];
          const extReq =
            typeof csr.getAttribute === "function"
              ? (csr.getAttribute({ name: "extensionRequest" }) as any)
              : null;

          if (extReq && Array.isArray(extReq.extensions)) {
            const sanExt = extReq.extensions.find((e: any) => e.name === "subjectAltName");
            if (sanExt && Array.isArray(sanExt.altNames)) {
              for (const a of sanExt.altNames) {
                sans.push({
                  type: a.type === 2 ? "DNS" : a.type === 7 ? "IP" : "Alt",
                  value: a.ip || a.value || "",
                });
              }
            }
          }

          let keySize = "Unknown";
          if (csr.publicKey && "n" in csr.publicKey && (csr.publicKey as any).n) {
            keySize = `RSA ${(csr.publicKey as any).n.bitLength()} bits`;
          }

          let isSigValid = false;
          try {
            isSigValid = csr.verify();
          } catch {
            isSigValid = false;
          }

          if (!isCancelled) {
            setParsedList([
              {
                type: "csr",
                rawPem: rawCsr,
                subject: {
                  cn: getField(csr.subject.attributes, "CN"),
                  o: getField(csr.subject.attributes, "O"),
                  ou: getField(csr.subject.attributes, "OU"),
                  c: getField(csr.subject.attributes, "C"),
                  st: getField(csr.subject.attributes, "ST"),
                  l: getField(csr.subject.attributes, "L"),
                },
                issuer: { cn: null, o: null, c: null },
                validity: null,
                sans,
                publicKey: {
                  algorithm: "RSA / PKCS#1",
                  keySize,
                },
                sigAlg: (csr as any).siginfo?.algorithmOid || (csr as any).signatureOid || "sha256WithRSAEncryption",
                serialNumber: null,
                extensions: { isCa: null, keyUsage: [], extKeyUsage: [] },
                csrVerified: isSigValid,
                fingerprints: fps,
              },
            ]);
            setSelectedChainIdx(0);
          }
          return;
        } catch (err) {
          console.error("CSR Parse error:", err);
          if (!isCancelled) setParseError(t("errorInvalidPem"));
          return;
        }
      }

      // 2. Détection des Certificats X.509
      const certRegex =
        /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
      const certMatches = trimmed.match(certRegex);

      if (certMatches && certMatches.length > 0) {
        try {
          const list: ParsedCertData[] = [];

          for (const rawCert of certMatches) {
            const cert = pki.certificateFromPem(rawCert);
            const fps = await computeFingerprints(rawCert);

            const getField = (attrs: any[], name: string) => {
              if (!attrs || !Array.isArray(attrs)) return null;
              const found = attrs.find((a) => a.shortName === name || a.name === name);
              return found && typeof found.value === "string" ? found.value : null;
            };

            const sans: { type: string; value: string }[] = [];
            const sanExt = cert.getExtension("subjectAltName") as any;
            if (sanExt && Array.isArray(sanExt.altNames)) {
              for (const a of sanExt.altNames) {
                sans.push({
                  type: a.type === 2 ? "DNS" : a.type === 7 ? "IP" : a.type === 1 ? "Email" : "Alt",
                  value: a.ip || a.value || "",
                });
              }
            }

            const now = new Date();
            const notBefore = cert.validity.notBefore;
            const notAfter = cert.validity.notAfter;
            const diffDays = Math.round((notAfter.getTime() - now.getTime()) / (1000 * 3600 * 24));

            let keySize = "Unknown";
            if (cert.publicKey && "n" in cert.publicKey && (cert.publicKey as any).n) {
              keySize = `RSA ${(cert.publicKey as any).n.bitLength()} bits`;
            }

            let serialFormatted = cert.serialNumber || "";
            if (serialFormatted && !serialFormatted.includes(":")) {
              const pairs = serialFormatted.match(/.{1,2}/g);
              if (pairs) serialFormatted = pairs.join(":").toUpperCase();
            }

            const basicConstExt = cert.getExtension("basicConstraints") as any;
            const isCa = basicConstExt ? Boolean(basicConstExt.cA) : false;

            const kuExt = cert.getExtension("keyUsage") as any;
            const keyUsageList: string[] = [];
            if (kuExt) {
              if (kuExt.digitalSignature) keyUsageList.push("Digital Signature");
              if (kuExt.keyEncipherment) keyUsageList.push("Key Encipherment");
              if (kuExt.dataEncipherment) keyUsageList.push("Data Encipherment");
              if (kuExt.keyCertSign) keyUsageList.push("Certificate Sign");
              if (kuExt.cRLSign) keyUsageList.push("CRL Sign");
            }

            const ekuExt = cert.getExtension("extKeyUsage") as any;
            const extKeyUsageList: string[] = [];
            if (ekuExt) {
              if (ekuExt.serverAuth) extKeyUsageList.push("TLS Web Server Authentication");
              if (ekuExt.clientAuth) extKeyUsageList.push("TLS Web Client Authentication");
              if (ekuExt.codeSigning) extKeyUsageList.push("Code Signing");
              if (ekuExt.emailProtection) extKeyUsageList.push("Email Protection (S/MIME)");
            }

            list.push({
              type: "cert",
              rawPem: rawCert,
              subject: {
                cn: getField(cert.subject.attributes, "CN"),
                o: getField(cert.subject.attributes, "O"),
                ou: getField(cert.subject.attributes, "OU"),
                c: getField(cert.subject.attributes, "C"),
                st: getField(cert.subject.attributes, "ST"),
                l: getField(cert.subject.attributes, "L"),
              },
              issuer: {
                cn: getField(cert.issuer.attributes, "CN"),
                o: getField(cert.issuer.attributes, "O"),
                c: getField(cert.issuer.attributes, "C"),
              },
              validity: {
                notBefore,
                notAfter,
                daysRemaining: diffDays,
                isExpired: now > notAfter,
                isNotYetValid: now < notBefore,
              },
              sans,
              publicKey: {
                algorithm: "RSA / PKCS#1",
                keySize,
              },
              sigAlg: cert.siginfo?.algorithmOid || "sha256WithRSAEncryption",
              serialNumber: serialFormatted,
              extensions: {
                isCa,
                keyUsage: keyUsageList,
                extKeyUsage: extKeyUsageList,
              },
              csrVerified: null,
              fingerprints: fps,
            });
          }

          if (!isCancelled) {
            setParsedList(list);
            setSelectedChainIdx(0);
          }
          return;
        } catch (err) {
          console.error("Cert Parse error:", err);
          if (!isCancelled) setParseError(t("errorInvalidPem"));
          return;
        }
      }

      if (!isCancelled) {
        setParseError(t("errorInvalidPem"));
      }
    };

    parseAll();

    return () => {
      isCancelled = true;
    };
  }, [inputPem, pki, t]);

  const activeData = parsedList[selectedChainIdx] || null;

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === "string") {
          setInputPem(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === "string") {
          setInputPem(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const exportAsJson = useMemo(() => {
    if (!activeData) return "";
    return JSON.stringify(activeData, null, 2);
  }, [activeData]);

  const formatDate = (date: Date) => {
    return date.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--shield-alert]"
        badge={
          <span className="badge badge-sm badge-soft badge-primary">
            {t("badgeOffline")}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputPem(SAMPLE_CERT)}
              className="btn btn-xs btn-outline"
            >
              {t("loadSampleCert")}
            </button>
            <button
              type="button"
              onClick={() => setInputPem(SAMPLE_CSR)}
              className="btn btn-xs btn-outline"
            >
              {t("loadSampleCsr")}
            </button>
            <button
              type="button"
              onClick={() => setInputPem("")}
              className="btn btn-xs btn-ghost text-base-content/60"
            >
              {t("clear")}
            </button>
          </div>
        }
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`card card-border bg-base-100 p-4 shadow-sm flex flex-col gap-2.5 transition-colors ${
          isDragging ? "border-primary bg-primary/5" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
            {t("inputLabel")}
          </label>
          <label className="btn btn-xs btn-ghost gap-1 cursor-pointer text-base-content/60 hover:text-primary">
            <span className="icon-[lucide--upload] size-3.5"></span>
            <span className="text-[11px]">{t("dropFile")}</span>
            <input
              type="file"
              accept=".crt,.pem,.cer,.csr,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <textarea
          rows={5}
          value={inputPem}
          onChange={(e) => setInputPem(e.target.value)}
          placeholder={t("inputPlaceholder")}
          className="textarea textarea-bordered font-mono text-xs w-full resize-y focus:outline-primary leading-relaxed"
          spellCheck={false}
        />
      </div>

      {parseError && inputPem.trim().length > 0 && (
        <div className="alert alert-soft alert-error text-xs p-3 flex items-center gap-2">
          <span className="icon-[lucide--alert-triangle] size-4 shrink-0"></span>
          <span>{parseError}</span>
        </div>
      )}

      {parsedList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-base-content/60 shrink-0">
            {t("chainCount", { count: parsedList.length })} :
          </span>
          <div className="join">
            {parsedList.map((item, idx) => {
              const isLeaf = idx === 0;
              const isRoot = idx === parsedList.length - 1;
              const roleBadge = isLeaf
                ? t("leafBadge")
                : isRoot
                ? t("rootBadge")
                : t("intermediateBadge");

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedChainIdx(idx)}
                  className={`join-item btn btn-xs ${
                    selectedChainIdx === idx ? "btn-primary" : "btn-outline"
                  } gap-1.5`}
                >
                  <span>{item.subject.cn || t("certLabel", { index: idx + 1 })}</span>
                  <span className="badge badge-xs badge-neutral text-[9px]">
                    {roleBadge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeData && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${
                  activeData.type === "csr"
                    ? "bg-info/10 text-info"
                    : activeData.validity?.isExpired
                    ? "bg-error/10 text-error"
                    : activeData.validity?.daysRemaining && activeData.validity.daysRemaining < 30
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success"
                }`}
              >
                <span
                  className={`size-6 ${
                    activeData.type === "csr"
                      ? "icon-[lucide--file-text]"
                      : activeData.validity?.isExpired
                      ? "icon-[lucide--clock-alert]"
                      : "icon-[lucide--shield-check]"
                  }`}
                ></span>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base text-base-content">
                    {activeData.subject.cn || "Unknown Host"}
                  </span>
                  <span className="badge badge-sm badge-outline font-mono">
                    {activeData.type === "csr" ? t("typeCsr") : t("typeCert")}
                  </span>
                </div>

                {activeData.validity && (
                  <span className="text-xs font-medium text-base-content/70 mt-0.5">
                    {activeData.validity.isExpired ? (
                      <span className="text-error font-semibold">
                        {t("statusExpired")} •{" "}
                        {t("expiredAgo", {
                          days: Math.abs(activeData.validity.daysRemaining),
                        })}
                      </span>
                    ) : activeData.validity.isNotYetValid ? (
                      <span className="text-warning font-semibold">
                        {t("statusNotYetValid")} •{" "}
                        {t("startsInDays", {
                          days: Math.abs(activeData.validity.daysRemaining),
                        })}
                      </span>
                    ) : activeData.validity.daysRemaining < 30 ? (
                      <span className="text-warning font-semibold">
                        {t("statusExpiringSoon")} •{" "}
                        {t("expiresInDays", {
                          days: activeData.validity.daysRemaining,
                        })}
                      </span>
                    ) : (
                      <span className="text-success font-semibold">
                        {t("statusActive")} •{" "}
                        {t("expiresInDays", {
                          days: activeData.validity.daysRemaining,
                        })}
                      </span>
                    )}
                  </span>
                )}

                {activeData.type === "csr" && (
                  <span className="text-xs text-base-content/70 mt-0.5 flex items-center gap-1.5">
                    <span
                      className={`size-2 rounded-full ${
                        activeData.csrVerified ? "bg-success" : "bg-error"
                      }`}
                    ></span>
                    {activeData.csrVerified ? t("csrSigValid") : t("csrSigInvalid")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <CopyButton
                text={exportAsJson}
                label={t("exportJson")}
                size="sm"
                variant="outline"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5 border-b border-base-content/10 pb-2">
                <span className="icon-[lucide--user] size-4 text-primary"></span>
                {t("subjectTitle")}
              </span>

              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("commonName")}</span>
                  <span className="font-mono font-bold text-base-content select-all">
                    {activeData.subject.cn || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("organization")}</span>
                  <span className="font-semibold text-base-content">
                    {activeData.subject.o || "—"}
                  </span>
                </div>
                {activeData.subject.ou && (
                  <div className="flex justify-between items-center py-1 border-b border-base-content/5">
                    <span className="text-base-content/60">{t("orgUnit")}</span>
                    <span className="text-base-content">{activeData.subject.ou}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1">
                  <span className="text-base-content/60">{t("country")}</span>
                  <span className="font-mono text-base-content">
                    {activeData.subject.c || "—"}{" "}
                    {activeData.subject.st ? `(${activeData.subject.st})` : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5 border-b border-base-content/10 pb-2">
                <span className="icon-[lucide--award] size-4 text-primary"></span>
                {t("issuerTitle")}
              </span>

              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("commonName")}</span>
                  <span className="font-mono font-bold text-base-content select-all">
                    {activeData.issuer.cn || (activeData.type === "csr" ? "— (CSR Self-Identified)" : "—")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("organization")}</span>
                  <span className="font-semibold text-base-content">
                    {activeData.issuer.o || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-base-content/60">{t("country")}</span>
                  <span className="font-mono text-base-content">
                    {activeData.issuer.c || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5 border-b border-base-content/10 pb-2">
              <span className="icon-[lucide--globe] size-4 text-primary"></span>
              {t("sanTitle")} ({activeData.sans.length})
            </span>

            {activeData.sans.length === 0 ? (
              <span className="text-xs text-base-content/50 italic py-2">
                {t("noSans")}
              </span>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {activeData.sans.map((san, idx) => (
                  <span
                    key={idx}
                    className="badge badge-sm badge-soft badge-primary font-mono gap-1.5 select-all py-3 px-2.5"
                  >
                    <span className="opacity-60 text-[10px]">{san.type}:</span>
                    <span className="font-semibold">{san.value}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeData.validity && (
              <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5 border-b border-base-content/10 pb-2">
                  <span className="icon-[lucide--calendar] size-4 text-primary"></span>
                  {t("validityTitle")}
                </span>

                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-base-content/5">
                    <span className="text-base-content/60">{t("validFrom")}</span>
                    <span className="font-mono font-medium">
                      {formatDate(activeData.validity.notBefore)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-base-content/60">{t("validTo")}</span>
                    <span className="font-mono font-bold text-base-content">
                      {formatDate(activeData.validity.notAfter)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5 border-b border-base-content/10 pb-2">
                <span className="icon-[lucide--cpu] size-4 text-primary"></span>
                {t("cryptoTitle")}
              </span>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("keyInfo")}</span>
                  <span className="font-mono font-semibold text-primary">
                    {activeData.publicKey.keySize}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("sigAlg")}</span>
                  <span className="font-mono text-base-content truncate max-w-[200px]">
                    {activeData.sigAlg}
                  </span>
                </div>
                {activeData.serialNumber && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-base-content/60">{t("serialNumber")}</span>
                    <span className="font-mono text-[11px] truncate max-w-[180px] select-all">
                      {activeData.serialNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5 border-b border-base-content/10 pb-2">
              <span className="icon-[lucide--hash] size-4 text-primary"></span>
              {t("fingerprintsTitle")}
            </span>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-base-200/40 rounded-lg">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-base-content/50">
                    {t("sha256")}
                  </span>
                  <span className="font-mono text-[11px] select-all text-base-content break-all">
                    {activeData.fingerprints.sha256}
                  </span>
                </div>
                <CopyButton text={activeData.fingerprints.sha256} size="xs" variant="ghost" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-base-200/40 rounded-lg">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-base-content/50">
                    {t("sha1")}
                  </span>
                  <span className="font-mono text-[11px] select-all text-base-content/70 break-all">
                    {activeData.fingerprints.sha1}
                  </span>
                </div>
                <CopyButton text={activeData.fingerprints.sha1} size="xs" variant="ghost" />
              </div>
            </div>
          </div>

          {activeData.type === "cert" && (
            <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5 border-b border-base-content/10 pb-2">
                <span className="icon-[lucide--layers] size-4 text-primary"></span>
                {t("extensionsTitle")}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                <div className="flex flex-col gap-1 p-3 bg-base-200/30 rounded-lg border border-base-content/5">
                  <span className="text-[11px] font-semibold text-base-content/60">
                    {t("basicConstraints")}
                  </span>
                  <span className="font-mono font-bold">
                    CA: {activeData.extensions.isCa ? "TRUE" : "FALSE"}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-base-200/30 rounded-lg border border-base-content/5">
                  <span className="text-[11px] font-semibold text-base-content/60">
                    {t("keyUsage")}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeData.extensions.keyUsage.length > 0 ? (
                      activeData.extensions.keyUsage.map((ku, idx) => (
                        <span key={idx} className="badge badge-xs badge-neutral">
                          {ku}
                        </span>
                      ))
                    ) : (
                      <span className="text-base-content/40 italic">—</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-base-200/30 rounded-lg border border-base-content/5">
                  <span className="text-[11px] font-semibold text-base-content/60">
                    {t("extKeyUsage")}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeData.extensions.extKeyUsage.length > 0 ? (
                      activeData.extensions.extKeyUsage.map((eku, idx) => (
                        <span key={idx} className="badge badge-xs badge-neutral">
                          {eku}
                        </span>
                      ))
                    ) : (
                      <span className="text-base-content/40 italic">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
