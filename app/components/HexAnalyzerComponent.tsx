// app/components/HexAnalyzerComponent.tsx
"use client";

import { useState, useMemo, ChangeEvent, DragEvent } from "react";
import { useTranslations } from "next-intl";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";
import CopyButton from "@/app/components/ui/CopyButtonComponent";

interface MagicSignature {
  name: string;
  category: string;
  description: string;
  matches: (bytes: Uint8Array) => boolean;
}

const SIGNATURES: MagicSignature[] = [
  {
    name: "ELF Executable",
    category: "Binary",
    description: "Linux Executable and Linkable Format",
    matches: (b) => b.length >= 4 && b[0] === 0x7f && b[1] === 0x45 && b[2] === 0x4c && b[3] === 0x46,
  },
  {
    name: "Windows PE / MZ",
    category: "Binary",
    description: "DOS MZ / Windows Portable Executable (EXE/DLL)",
    matches: (b) => b.length >= 2 && b[0] === 0x4d && b[1] === 0x5a,
  },
  {
    name: "Mach-O (64-bit)",
    category: "Binary",
    description: "Apple macOS / iOS 64-bit Executable",
    matches: (b) =>
      b.length >= 4 &&
      ((b[0] === 0xcf && b[1] === 0xfa && b[2] === 0xed && b[3] === 0xfe) ||
        (b[0] === 0xfe && b[1] === 0xed && b[2] === 0xfa && b[3] === 0xcf)),
  },
  {
    name: "WebAssembly (WASM)",
    category: "Binary",
    description: "Compiled WebAssembly Binary",
    matches: (b) => b.length >= 4 && b[0] === 0x00 && b[1] === 0x61 && b[2] === 0x73 && b[3] === 0x6d,
  },
  {
    name: "PDF Document",
    category: "Document",
    description: "Adobe Portable Document Format (%PDF)",
    matches: (b) => b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  },
  {
    name: "ZIP / Office Archive",
    category: "Archive",
    description: "ZIP Archive / DOCX / APK / JAR file",
    matches: (b) => b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04,
  },
  {
    name: "GZIP Archive",
    category: "Archive",
    description: "Gnu ZIP compressed data",
    matches: (b) => b.length >= 2 && b[0] === 0x1f && b[1] === 0x8b,
  },
  {
    name: "PNG Image",
    category: "Image",
    description: "Portable Network Graphics",
    matches: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    name: "JPEG Image",
    category: "Image",
    description: "JPEG / JFIF Graphic File",
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    name: "SQLite 3 Database",
    category: "Database",
    description: "SQLite Database Header",
    matches: (b) => {
      const header = "SQLite format 3\0";
      if (b.length < header.length) return false;
      for (let i = 0; i < header.length; i++) {
        if (b[i] !== header.charCodeAt(i)) return false;
      }
      return true;
    },
  },
  {
    name: "PCAP Packet Capture",
    category: "Network",
    description: "Libpcap network packet trace",
    matches: (b) =>
      b.length >= 4 &&
      ((b[0] === 0xd4 && b[1] === 0xc3 && b[2] === 0xb2 && b[3] === 0xa1) ||
        (b[0] === 0xa1 && b[1] === 0xb2 && b[2] === 0xc3 && b[3] === 0xd4)),
  },
];

const BYTES_PER_PAGE = 512; // 32 rows of 16 bytes
const ENTROPY_CHUNKS = 64;

function calculateEntropy(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;
  const freq = new Uint32Array(256);
  for (let i = 0; i < bytes.length; i++) {
    freq[bytes[i]]++;
  }

  let entropy = 0;
  const len = bytes.length;
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) {
      const p = freq[i] / len;
      entropy -= p * Math.log2(p);
    }
  }
  return Number(entropy.toFixed(3));
}

function calculateChunkedEntropy(bytes: Uint8Array, numChunks: number): number[] {
  if (bytes.length === 0) return [];
  const chunkSize = Math.max(1, Math.floor(bytes.length / numChunks));
  const results: number[] = [];

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = i === numChunks - 1 ? bytes.length : Math.min(bytes.length, start + chunkSize);
    if (start >= bytes.length) {
      results.push(0);
      continue;
    }
    results.push(calculateEntropy(bytes.subarray(start, end)));
  }
  return results;
}

// Flexible parser for hexadecimal and decimal input
function parseOffsetInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Explicit 0x prefix
  if (/^0x[0-9a-f]+$/i.test(trimmed)) {
    const val = parseInt(trimmed, 16);
    return isNaN(val) ? null : val;
  }

  // 2. h suffix notation (e.g. 1A0h, 40h)
  if (/^[0-9a-f]+h$/i.test(trimmed)) {
    const val = parseInt(trimmed.slice(0, -1), 16);
    return isNaN(val) ? null : val;
  }

  // 3. Contains hexadecimal letters a-f (e.g. 1A0, FF, DEAD)
  if (/[a-f]/i.test(trimmed) && /^[0-9a-f]+$/i.test(trimmed)) {
    const val = parseInt(trimmed, 16);
    return isNaN(val) ? null : val;
  }

  // 4. Digits only: treated as decimal
  const decVal = parseInt(trimmed, 10);
  return isNaN(decVal) ? null : decVal;
}

export default function HexAnalyzerComponent() {
  const t = useTranslations("tools.hexAnalyzer");

  const [buffer, setBuffer] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [selectedOffset, setSelectedOffset] = useState<number | null>(null);
  const [jumpInput, setJumpInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleLoadSample = () => {
    const sampleSize = 4096;
    const sample = new Uint8Array(sampleSize);

    sample.set([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00], 0);

    const text = "0w.lat security toolkit - sample binary payload with plaintext strings and metadata";
    for (let i = 0; i < text.length; i++) {
      sample[64 + i] = text.charCodeAt(i);
    }

    for (let i = 1024; i < 3072; i++) {
      sample[i] = Math.floor(Math.random() * 256);
    }

    sample.fill(0x00, 3072, sampleSize);

    setBuffer(sample);
    setFileName("sample_payload.elf");
    setFileSize(sampleSize);
    setPageIndex(0);
    setSelectedOffset(null);
    setSearchQuery("");
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result;
      if (res instanceof ArrayBuffer) {
        const u8 = new Uint8Array(res);
        setBuffer(u8);
        setFileName(file.name);
        setFileSize(file.size);
        setPageIndex(0);
        setSelectedOffset(null);
        setSearchQuery("");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const detectedSignature = useMemo(() => {
    if (!buffer) return null;
    for (const sig of SIGNATURES) {
      if (sig.matches(buffer)) return sig;
    }
    return null;
  }, [buffer]);

  const globalEntropy = useMemo(() => {
    return buffer ? calculateEntropy(buffer) : 0;
  }, [buffer]);

  const chunkEntropy = useMemo(() => {
    return buffer ? calculateChunkedEntropy(buffer, ENTROPY_CHUNKS) : [];
  }, [buffer]);

  const searchMatches = useMemo(() => {
    if (!buffer || !searchQuery.trim()) return [];
    const q = searchQuery.trim();
    const matches: number[] = [];

    const isHex = /^[0-9a-fA-F\s]+$/.test(q) && (q.includes(" ") || q.length % 2 === 0);
    const targetBytes: number[] = [];

    if (isHex && q.replace(/\s+/g, "").length >= 2) {
      const cleanHex = q.replace(/\s+/g, "");
      for (let i = 0; i < cleanHex.length; i += 2) {
        targetBytes.push(parseInt(cleanHex.substring(i, i + 2), 16));
      }
    } else {
      for (let i = 0; i < q.length; i++) {
        targetBytes.push(q.charCodeAt(i));
      }
    }

    if (targetBytes.length === 0) return [];

    const maxMatches = 50;
    const targetLen = targetBytes.length;
    const bufLen = buffer.length;

    for (let i = 0; i <= bufLen - targetLen; i++) {
      let found = true;
      for (let j = 0; j < targetLen; j++) {
        if (buffer[i + j] !== targetBytes[j]) {
          found = false;
          break;
        }
      }
      if (found) {
        matches.push(i);
        if (matches.length >= maxMatches) break;
      }
    }

    return matches;
  }, [buffer, searchQuery]);

  const totalPages = useMemo(() => {
    if (!buffer) return 0;
    return Math.ceil(buffer.length / BYTES_PER_PAGE);
  }, [buffer]);

  const activePageBytes = useMemo(() => {
    if (!buffer) return new Uint8Array(0);
    const start = pageIndex * BYTES_PER_PAGE;
    const end = Math.min(buffer.length, start + BYTES_PER_PAGE);
    return buffer.subarray(start, end);
  }, [buffer, pageIndex]);

  // Jump directly to an offset, repositioning and smoothly scrolling to it
  const handleJumpToOffset = (rawOffset: number) => {
    if (!buffer) return;
    const clamped = Math.max(0, Math.min(buffer.length - 1, rawOffset));
    const targetPage = Math.floor(clamped / BYTES_PER_PAGE);
    setPageIndex(targetPage);
    setSelectedOffset(clamped);

    setTimeout(() => {
      const lineStart = Math.floor(clamped / 16) * 16;
      const rowEl = document.getElementById(`hex-row-${lineStart}`);
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 40);
  };

  const handleJumpInputSubmit = () => {
    const parsed = parseOffsetInput(jumpInput);
    if (parsed !== null && buffer) {
      handleJumpToOffset(parsed);
    }
  };

  const hexLines = useMemo(() => {
    const lines: {
      offsetNum: number;
      offsetStr: string;
      hexParts: string[];
      asciiChars: string[];
    }[] = [];

    const baseOffset = pageIndex * BYTES_PER_PAGE;
    for (let i = 0; i < activePageBytes.length; i += 16) {
      const lineBytes = activePageBytes.subarray(i, i + 16);
      const hexParts: string[] = [];
      const asciiChars: string[] = [];

      for (let j = 0; j < 16; j++) {
        if (j < lineBytes.length) {
          const b = lineBytes[j];
          hexParts.push(b.toString(16).padStart(2, "0").toUpperCase());
          asciiChars.push(b >= 32 && b <= 126 ? String.fromCharCode(b) : ".");
        } else {
          hexParts.push("  ");
          asciiChars.push(" ");
        }
      }

      const offsetNum = baseOffset + i;
      const offsetStr = offsetNum.toString(16).padStart(8, "0").toUpperCase();
      lines.push({ offsetNum, offsetStr, hexParts, asciiChars });
    }

    return lines;
  }, [activePageBytes, pageIndex]);

  const pageExportText = useMemo(() => {
    return hexLines
      .map(
        (l) =>
          `${l.offsetStr}  ${l.hexParts.slice(0, 8).join(" ")}  ${l.hexParts.slice(8).join(" ")}  |${l.asciiChars.join("")}|`
      )
      .join("\n");
  }, [hexLines]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Inspector for the currently selected byte
  const selectedByteMeta = useMemo(() => {
    if (selectedOffset === null || !buffer || selectedOffset >= buffer.length) return null;
    const val = buffer[selectedOffset];
    return {
      offsetHex: `0x${selectedOffset.toString(16).toUpperCase()}`,
      offsetDec: selectedOffset,
      hexVal: `0x${val.toString(16).padStart(2, "0").toUpperCase()}`,
      charVal: val >= 32 && val <= 126 ? `'${String.fromCharCode(val)}'` : "Non-printable",
      binaryVal: val.toString(2).padStart(8, "0"),
    };
  }, [selectedOffset, buffer]);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--binary]"
        badge={
          <span className="badge badge-sm badge-soft badge-primary">
            {t("badgeOffline")}
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
            {buffer && (
              <button
                type="button"
                onClick={() => {
                  setBuffer(null);
                  setFileName("");
                  setFileSize(0);
                  setSelectedOffset(null);
                }}
                className="btn btn-xs btn-ghost text-base-content/60"
              >
                {t("clear")}
              </button>
            )}
          </div>
        }
      />

      {!buffer && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`card card-border border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 text-center ${
            isDragging
              ? "border-primary bg-primary/5 scale-[0.99]"
              : "border-base-content/20 hover:border-primary/50 hover:bg-base-200/30"
          }`}
        >
          <label className="flex flex-col items-center gap-3 cursor-pointer w-full">
            <input
              type="file"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="icon-[lucide--upload-cloud] size-7"></span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-sm text-base-content">
                {t("dropzone")}
              </span>
              <span className="text-xs text-base-content/60">
                {t("dropzoneHint")}
              </span>
            </div>
          </label>
        </div>
      )}

      {buffer && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 card card-border bg-base-100 p-5 shadow-sm flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-2 border-b border-base-content/10 pb-2">
                  <span className="icon-[lucide--file-code-2] size-4 text-primary"></span>
                  {t("fileInfoTitle")}
                </span>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-base-content/5">
                    <span className="text-base-content/60">{t("fileName")}</span>
                    <span className="font-mono font-bold text-base-content truncate max-w-[180px]">
                      {fileName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-base-content/5">
                    <span className="text-base-content/60">{t("fileSize")}</span>
                    <span className="font-mono text-base-content">
                      {formatBytes(fileSize)} ({fileSize.toLocaleString()} bytes)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-base-content/60">{t("detectedSignature")}</span>
                    {detectedSignature ? (
                      <span className="badge badge-sm badge-soft badge-primary font-semibold">
                        {detectedSignature.name}
                      </span>
                    ) : (
                      <span className="badge badge-sm badge-neutral text-base-content/60">
                        {t("unknownSignature")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-base-200/40 rounded-xl border border-base-content/5 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/70">
                    {t("globalEntropyTitle")}
                  </span>
                  <span className="font-mono font-bold text-sm text-primary">
                    {globalEntropy} / 8.000
                  </span>
                </div>

                <progress
                  className={`progress w-full h-2 ${
                    globalEntropy > 7.0
                      ? "progress-error"
                      : globalEntropy > 4.5
                      ? "progress-warning"
                      : "progress-info"
                  }`}
                  value={globalEntropy}
                  max="8"
                ></progress>

                <span className="text-[11px] font-medium text-base-content/70">
                  {globalEntropy > 7.0
                    ? t("entropyHigh")
                    : globalEntropy > 4.5
                    ? t("entropyMedium")
                    : t("entropyLow")}
                </span>
              </div>
            </div>

            <div className="md:col-span-7 card card-border bg-base-100 p-5 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex flex-col gap-1 border-b border-base-content/10 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-2">
                  <span className="icon-[lucide--activity] size-4 text-primary"></span>
                  {t("entropyMapTitle")}
                </span>
                <span className="text-[11px] text-base-content/60">
                  {t("entropyMapHint")}
                </span>
              </div>

              <div className="grid grid-cols-16 gap-1 p-2 bg-base-200/50 rounded-lg border border-base-content/5">
                {chunkEntropy.map((ent, idx) => {
                  const chunkOffset = Math.floor((idx / ENTROPY_CHUNKS) * buffer.length);
                  const isHigh = ent > 7.0;
                  const isMed = ent > 4.5 && ent <= 7.0;
                  const isActiveChunk =
                    pageIndex === Math.floor(chunkOffset / BYTES_PER_PAGE);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleJumpToOffset(chunkOffset)}
                      title={t("blockLabel", {
                        offset: `0x${chunkOffset.toString(16).toUpperCase()}`,
                        index: idx + 1,
                        entropy: ent.toFixed(2),
                      })}
                      className={`h-7 rounded-sm transition-transform hover:scale-110 focus:outline-primary ${
                        isActiveChunk ? "ring-2 ring-primary ring-offset-1" : ""
                      } ${
                        isHigh
                          ? "bg-error/80 hover:bg-error"
                          : isMed
                          ? "bg-warning/80 hover:bg-warning"
                          : "bg-info/80 hover:bg-info"
                      }`}
                    ></button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] text-base-content/50 font-mono px-1">
                <span>0x00000000</span>
                <span>0x{buffer.length.toString(16).toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Hex inspector */}
          <div className="card card-border bg-base-100 shadow-sm flex flex-col overflow-hidden">
            <div className="p-3.5 bg-base-200/40 border-b border-base-content/10 flex flex-wrap items-center justify-between gap-3">
              {/* Search */}
              <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
                <div className="relative w-full">
                  <span className="icon-[lucide--search] size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/40"></span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="input input-xs input-bordered w-full pl-8 font-mono focus:outline-primary"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                    >
                      <span className="icon-[lucide--x] size-3"></span>
                    </button>
                  )}
                </div>

                {searchQuery.trim() && (
                  <span className="text-[11px] font-mono shrink-0 text-base-content/60">
                    {searchMatches.length === 0
                      ? t("noMatches")
                      : searchMatches.length === 1
                      ? t("matchFound", { count: 1 })
                      : t("matchesFound", { count: searchMatches.length })}
                  </span>
                )}
              </div>

              {/* Offset jump bar with dynamic detection */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={jumpInput}
                    onChange={(e) => setJumpInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJumpInputSubmit()}
                    placeholder={t("jumpPlaceholder")}
                    className="input input-xs input-bordered w-28 font-mono text-center focus:outline-primary"
                  />
                  <button
                    type="button"
                    onClick={handleJumpInputSubmit}
                    className="btn btn-xs btn-outline"
                  >
                    {t("jumpToOffset")}
                  </button>
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-1 join">
                  <button
                    type="button"
                    disabled={pageIndex <= 0}
                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                    className="join-item btn btn-xs btn-outline"
                  >
                    {t("prevPage")}
                  </button>
                  <span className="join-item btn btn-xs btn-ghost no-animation font-mono text-[11px]">
                    {pageIndex + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageIndex >= totalPages - 1}
                    onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                    className="join-item btn btn-xs btn-outline"
                  >
                    {t("nextPage")}
                  </button>
                </div>

                <CopyButton
                  text={pageExportText}
                  label={t("exportHex")}
                  size="xs"
                  variant="outline"
                />
              </div>
            </div>

            {/* Search results bar */}
            {searchMatches.length > 0 && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/5 border-b border-base-content/5 overflow-x-auto text-[11px]">
                <span className="font-semibold text-primary shrink-0">Hits :</span>
                {searchMatches.slice(0, 10).map((offset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleJumpToOffset(offset)}
                    className="badge badge-xs badge-outline font-mono hover:badge-primary cursor-pointer shrink-0"
                  >
                    0x{offset.toString(16).toUpperCase()}
                  </button>
                ))}
                {searchMatches.length > 10 && (
                  <span className="text-base-content/50">+{searchMatches.length - 10} more</span>
                )}
              </div>
            )}

            {/* Inspector for the targeted byte */}
            {selectedByteMeta && (
              <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex flex-wrap items-center justify-between text-xs font-mono gap-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary">
                    Offset : {selectedByteMeta.offsetHex} ({selectedByteMeta.offsetDec})
                  </span>
                  <span className="text-base-content/70">•</span>
                  <span>Valeur : <strong className="text-base-content">{selectedByteMeta.hexVal}</strong> ({selectedByteMeta.charVal})</span>
                  <span className="text-base-content/70">•</span>
                  <span className="text-base-content/60">Binaire : {selectedByteMeta.binaryVal}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOffset(null)}
                  className="btn btn-ghost btn-xs text-[10px] text-base-content/60 hover:text-base-content"
                >
                  Fermer
                </button>
              </div>
            )}

            {/* Monospaced hex grid with active highlighting */}
            <div className="overflow-x-auto p-4 bg-base-100 max-h-[560px]">
              <div className="font-mono text-xs leading-relaxed select-text min-w-[700px]">
                <div className="grid grid-cols-12 gap-2 pb-2 mb-2 border-b border-base-content/10 font-bold text-base-content/50 text-[11px]">
                  <span className="col-span-2">Offset</span>
                  <div className="col-span-7 flex justify-between tracking-widest px-1">
                    <span>00 01 02 03 04 05 06 07</span>
                    <span>08 09 0A 0B 0C 0D 0E 0F</span>
                  </div>
                  <span className="col-span-3 text-right">{t("asciiView")}</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  {hexLines.map((line) => {
                    const lineStart = line.offsetNum;
                    const isLineSelected =
                      selectedOffset !== null &&
                      selectedOffset >= lineStart &&
                      selectedOffset < lineStart + 16;

                    return (
                      <div
                        id={`hex-row-${lineStart}`}
                        key={lineStart}
                        className={`grid grid-cols-12 gap-2 py-0.5 rounded px-1 group transition-colors ${
                          isLineSelected
                            ? "bg-primary/15 ring-1 ring-primary/40 font-semibold"
                            : "hover:bg-base-200/60"
                        }`}
                      >
                        {/* Offset */}
                        <span
                          onClick={() => handleJumpToOffset(lineStart)}
                          className="col-span-2 text-primary/70 font-semibold select-none cursor-pointer hover:underline"
                        >
                          {line.offsetStr}
                        </span>

                        {/* Hex bytes */}
                        <div className="col-span-7 flex justify-between font-medium">
                          {/* Bytes 0 to 7 */}
                          <span className="text-base-content">
                            {line.hexParts.slice(0, 8).map((byteStr, bIdx) => {
                              const absOffset = lineStart + bIdx;
                              const isByteSelected = selectedOffset === absOffset;

                              return (
                                <span
                                  key={bIdx}
                                  onClick={() => setSelectedOffset(absOffset)}
                                  className={`inline-block mr-1.5 px-0.5 rounded cursor-pointer transition-colors ${
                                    isByteSelected
                                      ? "bg-primary text-primary-content font-bold ring-2 ring-primary ring-offset-1"
                                      : byteStr === "00"
                                      ? "opacity-30 hover:opacity-100"
                                      : byteStr === "FF"
                                      ? "text-error font-bold"
                                      : "hover:bg-base-300"
                                  }`}
                                >
                                  {byteStr}
                                </span>
                              );
                            })}
                          </span>

                          {/* Bytes 8 to 15 */}
                          <span className="text-base-content">
                            {line.hexParts.slice(8, 16).map((byteStr, bIdx) => {
                              const absOffset = lineStart + 8 + bIdx;
                              const isByteSelected = selectedOffset === absOffset;

                              return (
                                <span
                                  key={bIdx}
                                  onClick={() => setSelectedOffset(absOffset)}
                                  className={`inline-block mr-1.5 px-0.5 rounded cursor-pointer transition-colors ${
                                    isByteSelected
                                      ? "bg-primary text-primary-content font-bold ring-2 ring-primary ring-offset-1"
                                      : byteStr === "00"
                                      ? "opacity-30 hover:opacity-100"
                                      : byteStr === "FF"
                                      ? "text-error font-bold"
                                      : "hover:bg-base-300"
                                  }`}
                                >
                                  {byteStr}
                                </span>
                              );
                            })}
                          </span>
                        </div>

                        {/* Interactive ASCII representation */}
                        <div className="col-span-3 text-right font-mono tracking-widest text-base-content/80 flex justify-end">
                          {line.asciiChars.map((char, cIdx) => {
                            const absOffset = lineStart + cIdx;
                            const isCharSelected = selectedOffset === absOffset;

                            return (
                              <span
                                key={cIdx}
                                onClick={() => setSelectedOffset(absOffset)}
                                className={`inline-block px-[1px] rounded cursor-pointer transition-colors ${
                                  isCharSelected
                                    ? "bg-primary text-primary-content font-bold"
                                    : "hover:bg-base-300"
                                }`}
                              >
                                {char}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-3 bg-base-200/30 border-t border-base-content/10 flex items-center justify-between text-xs text-base-content/60 font-mono">
              <span>{t("bytesPerLine")}</span>
              <span>
                {t("pageInfo", {
                  start: (pageIndex * BYTES_PER_PAGE).toLocaleString(),
                  end: Math.min(buffer.length, (pageIndex + 1) * BYTES_PER_PAGE).toLocaleString(),
                  total: buffer.length.toLocaleString(),
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
