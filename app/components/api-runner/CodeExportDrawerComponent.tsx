// app/components/api-runner/CodeExportDrawerComponent.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import CopyButton from "@/app/components/ui/CopyButtonComponent";
import {
    BodyType,
    CodeFormat,
    FormDataItem,
    HttpMethod,
    KeyValueItem,
} from "./types";
import { generateCodeSnippet } from "./helpers";
import { highlightCode } from "./highlight";

interface CodeExportDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    method: HttpMethod;
    url: string;
    headers: KeyValueItem[];
    bodyType: BodyType;
    rawBody: string;
    formDataList: FormDataItem[];
    urlencodedList: KeyValueItem[];
}

const FORMAT_OPTIONS: { id: CodeFormat; label: string; icon: string }[] = [
    { id: "curl", label: "cURL", icon: "icon-[lucide--terminal]" },
    {
        id: "python-requests",
        label: "Python (requests)",
        icon: "icon-[lucide--code]",
    },
    { id: "python-httpx", label: "Python (httpx)", icon: "icon-[lucide--zap]" },
    { id: "js-fetch", label: "JS (fetch)", icon: "icon-[lucide--globe]" },
    { id: "js-axios", label: "Node.js (axios)", icon: "icon-[lucide--layers]" },
];

export default function CodeExportDrawerComponent({
    isOpen,
    onClose,
    method,
    url,
    headers,
    bodyType,
    rawBody,
    formDataList,
    urlencodedList,
}: CodeExportDrawerProps) {
    const [selectedFormat, setSelectedFormat] = useState<CodeFormat>("curl");

    // Handle ESC key and scroll lock
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    const rawSnippet = useMemo(() => {
        return generateCodeSnippet(
            selectedFormat,
            method,
            url,
            headers,
            bodyType,
            rawBody,
            formDataList,
            urlencodedList,
        );
    }, [
        selectedFormat,
        method,
        url,
        headers,
        bodyType,
        rawBody,
        formDataList,
        urlencodedList,
    ]);

    const highlightedHtml = useMemo(() => {
        return highlightCode(rawSnippet, selectedFormat);
    }, [rawSnippet, selectedFormat]);

    return (
        <>
            <div
                className={`overlay-backdrop fixed inset-0 z-40 bg-base-content/10 backdrop-blur-xs transition-opacity duration-200 ${
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                id="code-export-drawer"
                role="dialog"
                tabIndex={-1}
                aria-modal="true"
                className={`overlay overlay-open:translate-x-0 drawer drawer-end fixed top-0 inset-e-0 z-50 h-full w-full max-w-2xl border-s border-base-content/10 bg-base-100 shadow-2xl transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="drawer-header border-b border-base-content/10 flex items-center justify-between">
                    <h3 className="drawer-title flex items-center gap-2">
                        <span className="icon-[lucide--code-2] size-5 text-primary"></span>
                        <span>Code Snippet Preview</span>
                    </h3>
                    <button
                        type="button"
                        className="btn btn-text btn-circle btn-sm"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        <span className="icon-[lucide--x] size-4"></span>
                    </button>
                </div>

                <div className="drawer-body flex flex-col gap-4 overflow-y-auto p-5">
                    {/* Format Selection Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                            {FORMAT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setSelectedFormat(opt.id)}
                                    className={`btn btn-xs gap-1.5 transition-all ${
                                        selectedFormat === opt.id
                                            ? "btn-primary shadow-sm"
                                            : "btn-outline text-base-content/70 hover:bg-base-200"
                                    }`}
                                >
                                    <span
                                        className={`${opt.icon} size-3.5`}
                                    ></span>
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>

                        <CopyButton
                            text={rawSnippet}
                            size="xs"
                            variant="primary"
                        />
                    </div>

                    <div className="mockup-code w-full shadow-md bg-base-200 dark:bg-base-300 text-base-content text-xs font-mono max-h-150 overflow-auto">
                        <pre className="before:hidden px-5 py-3 leading-relaxed whitespace-pre overflow-x-auto">
                            <code
                                dangerouslySetInnerHTML={{
                                    __html: highlightedHtml,
                                }}
                            />
                        </pre>
                    </div>
                </div>

                {/* FlyonUI Drawer Footer */}
                <div className="drawer-footer border-t border-base-content/10 flex items-center justify-between">
                    <span className="text-[11px] text-base-content/50 italic">
                        Generated client-side in browser memory.
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-sm btn-ghost"
                    >
                        Close
                    </button>
                </div>
            </aside>
        </>
    );
}
