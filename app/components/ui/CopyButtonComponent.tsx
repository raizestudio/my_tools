// app/components/ui/CopyButtonComponent.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "neutral";
  size?: "xs" | "sm" | "md";
  iconOnly?: boolean;
  className?: string;
  title?: string;
}

export default function CopyButton({
  text,
  label,
  copiedLabel,
  variant = "primary",
  size = "sm",
  iconOnly = false,
  className = "",
  title,
}: CopyButtonProps) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);

  const displayLabel = label ?? t("copy");
  const displayCopiedLabel = copiedLabel ?? t("copied");

  const handleCopy = async () => {
    if (!text || copied) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const btnVariant = copied ? "btn-success" : `btn-${variant}`;
  const btnSize = `btn-${size}`;

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      title={title || displayLabel}
      className={`btn ${btnSize} ${btnVariant} gap-1.5 transition-all ${className}`}
    >
      <span
        className={`icon-[lucide--${copied ? "check" : "copy"}] ${
          size === "xs" ? "size-3" : "size-3.5"
        }`}
      ></span>
      {!iconOnly && <span>{copied ? displayCopiedLabel : displayLabel}</span>}
    </button>
  );
}
