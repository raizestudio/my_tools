"use client";

import { useState, useId, ChangeEvent, DragEvent } from "react";
import { useTranslations } from "next-intl";
import { PageItem } from "./types";
import PdfPageCard from "./PdfPageCardComponent";

interface PdfOrganizeSectionProps {
    file: File | null;
    pages: PageItem[];
    isProcessing: boolean;
    onLoadFile: (file: File) => void;
    onRotatePage: (index: number, diff: number) => void;
    onMovePage: (index: number, dir: "left" | "right") => void;
    onToggleDeletePage: (index: number) => void;
    onRotateAll: (diff: number) => void;
    onResetAll: () => void;
    onExportModified: () => void;
    onExtractRange: (range: string) => void;
    rangeError: string | null;
    onPreview: (url: string, title: string) => void;
}

export default function PdfOrganizeSection({
    file,
    pages,
    isProcessing,
    onLoadFile,
    onRotatePage,
    onMovePage,
    onToggleDeletePage,
    onRotateAll,
    onResetAll,
    onExportModified,
    onExtractRange,
    rangeError,
    onPreview,
}: PdfOrganizeSectionProps) {
    const t = useTranslations("tools.pdfToolkit");
    const organizeInputId = useId();
    const [isDragging, setIsDragging] = useState(false);
    const [rangeInput, setRangeInput] = useState("");

    const activePagesCount = pages.filter((p) => !p.isDeleted).length;

    if (!file) {
        return (
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e: DragEvent<HTMLDivElement>) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.[0])
                        onLoadFile(e.dataTransfer.files[0]);
                }}
                className={`card card-border border-2 border-dashed p-12 flex flex-col items-center justify-center gap-3 cursor-pointer text-center transition-all ${
                    isDragging
                        ? "border-primary bg-primary/5 scale-[0.99]"
                        : "border-base-content/20 hover:border-primary/50 hover:bg-base-200/30"
                }`}
            >
                <label
                    htmlFor={organizeInputId}
                    className="flex flex-col items-center gap-2.5 cursor-pointer w-full"
                >
                    <input
                        id={organizeInputId}
                        type="file"
                        accept="application/pdf"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            if (e.target.files?.[0])
                                onLoadFile(e.target.files[0]);
                        }}
                        className="hidden"
                    />
                    <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="icon-[lucide--file-cog] size-7"></span>
                    </div>
                    <span className="font-semibold text-sm text-base-content">
                        {t("dropzoneSingle")}
                    </span>
                    <span className="text-xs text-base-content/60">
                        {t("dropzoneHint")}
                    </span>
                </label>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Batch Toolbar */}
            <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-base-content/60 mr-1">
                        {t("organizeToolbarTitle")} :
                    </span>
                    <button
                        type="button"
                        onClick={() => onRotateAll(90)}
                        className="btn btn-xs btn-outline gap-1.5"
                    >
                        <span className="icon-[lucide--rotate-cw] size-3.5"></span>
                        <span>{t("rotateAllCw")}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onRotateAll(-90)}
                        className="btn btn-xs btn-outline gap-1.5"
                    >
                        <span className="icon-[lucide--rotate-ccw] size-3.5"></span>
                        <span>{t("rotateAllCcw")}</span>
                    </button>
                    <button
                        type="button"
                        onClick={onResetAll}
                        className="btn btn-xs btn-ghost text-base-content/60"
                    >
                        {t("resetPages")}
                    </button>
                </div>

                <button
                    type="button"
                    disabled={activePagesCount === 0 || isProcessing}
                    onClick={onExportModified}
                    className="btn btn-sm btn-primary gap-2"
                >
                    <span className="icon-[lucide--download] size-4"></span>
                    <span>
                        {t("downloadModified", { count: activePagesCount })}
                    </span>
                </button>
            </div>

            {/* Visual Page Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {pages.map((page, idx) => (
                    <PdfPageCard
                        key={page.originalIndex}
                        page={page}
                        index={idx}
                        totalPages={pages.length}
                        onRotate={onRotatePage}
                        onMove={onMovePage}
                        onToggleDelete={onToggleDeletePage}
                        onPreview={onPreview}
                    />
                ))}
            </div>

            {/* Split / Extract Page Range Box */}
            <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-2">
                    <span className="icon-[lucide--scissors] size-4 text-primary"></span>
                    {t("splitSectionTitle")}
                </span>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                        type="text"
                        value={rangeInput}
                        onChange={(e) => setRangeInput(e.target.value)}
                        placeholder={t("splitRangePlaceholder")}
                        className="input input-sm input-bordered flex-1 font-mono text-xs focus:outline-primary"
                    />
                    <button
                        type="button"
                        disabled={!rangeInput.trim() || isProcessing}
                        onClick={() => onExtractRange(rangeInput)}
                        className="btn btn-sm btn-outline gap-1.5"
                    >
                        <span className="icon-[lucide--file-output] size-4"></span>
                        <span>{t("splitButton")}</span>
                    </button>
                </div>

                {rangeError && (
                    <span className="text-xs text-error font-medium">
                        {rangeError}
                    </span>
                )}
            </div>
        </div>
    );
}
