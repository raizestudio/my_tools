// app/components/JsonConverterComponent.tsx
"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";
import CopyButton from "@/app/components/ui/CopyButtonComponent";

type TargetOutput = "typescript" | "pydantic" | "formatted" | "minified";

const DEFAULT_SAMPLE_JSON = JSON.stringify(
  {
    id: 1042,
    username: "alex_dev",
    is_active: true,
    score: 98.5,
    tags: ["admin", "moderator"],
    profile: {
      bio: "Fullstack developer",
      website: "https://0w.lat",
      social_links: [{ platform: "github", url: "https://github.com" }],
    },
    metadata: null,
  },
  null,
  2,
);

function toPascalCase(str: string): string {
  return (
    str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^([a-z])/, (_, chr) => chr.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, "") || "Item"
  );
}

function isValidIdentifier(key: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
}

function generateTypeScript(rootName: string, jsonVal: unknown): string {
  const definitions: string[] = [];

  function inferType(val: unknown, currentKey: string): string {
    if (val === null) return "unknown";
    if (typeof val === "string") return "string";
    if (typeof val === "number") return "number";
    if (typeof val === "boolean") return "boolean";

    if (Array.isArray(val)) {
      if (val.length === 0) return "unknown[]";
      const itemTypes = Array.from(
        new Set(val.map((item) => inferType(item, currentKey))),
      );
      const unifiedType =
        itemTypes.length === 1 ? itemTypes[0] : `(${itemTypes.join(" | ")})`;
      return `${unifiedType}[]`;
    }

    if (typeof val === "object" && val !== null) {
      const typeName = toPascalCase(currentKey);
      const props: string[] = [];

      for (const [key, value] of Object.entries(val)) {
        const propName = isValidIdentifier(key) ? key : JSON.stringify(key);
        const isNullable = value === null;
        const inferred = inferType(value, key);
        props.push(`  ${propName}: ${inferred}${isNullable ? " | null" : ""};`);
      }

      definitions.push(
        `export interface ${typeName} {\n${props.join("\n")}\n}`,
      );
      return typeName;
    }

    return "unknown";
  }

  const rootTypeName = toPascalCase(rootName);
  const resultType = inferType(jsonVal, rootTypeName);

  if (Array.isArray(jsonVal)) {
    return `${definitions.join("\n\n")}\n\nexport type ${rootTypeName} = ${resultType};`.trim();
  }

  return definitions.join("\n\n").trim();
}

function generatePydantic(rootName: string, jsonVal: unknown): string {
  const definitions: string[] = [];
  const pythonKeywords = new Set([
    "False",
    "None",
    "True",
    "and",
    "as",
    "assert",
    "async",
    "await",
    "break",
    "class",
    "continue",
    "def",
    "del",
    "elif",
    "else",
    "except",
    "finally",
    "for",
    "from",
    "global",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "nonlocal",
    "not",
    "or",
    "pass",
    "raise",
    "return",
    "try",
    "while",
    "with",
    "yield",
  ]);

  function inferType(val: unknown, currentKey: string): string {
    if (val === null) return "Optional[Any] = None";
    if (typeof val === "string") return "str";
    if (typeof val === "number") return Number.isInteger(val) ? "int" : "float";
    if (typeof val === "boolean") return "bool";

    if (Array.isArray(val)) {
      if (val.length === 0) return "list[Any]";
      const itemTypes = Array.from(
        new Set(val.map((item) => inferType(item, currentKey))),
      );
      const unifiedType =
        itemTypes.length === 1
          ? itemTypes[0]
          : `Union[${itemTypes.join(", ")}]`;
      return `list[${unifiedType}]`;
    }

    if (typeof val === "object" && val !== null) {
      const modelName = toPascalCase(currentKey);
      const fields: string[] = [];

      for (const [key, value] of Object.entries(val)) {
        let fieldName = key;
        const needsAlias = !isValidIdentifier(key) || pythonKeywords.has(key);
        if (needsAlias) {
          fieldName = `field_${key.replace(/[^a-zA-Z0-9_]/g, "_")}`;
        }

        const isNullable = value === null;
        const typeStr = inferType(value, key);

        let typeAnnotation = typeStr;
        if (isNullable) {
          typeAnnotation = "Optional[Any] = None";
        }

        if (needsAlias) {
          fields.push(
            `    ${fieldName}: ${typeAnnotation} = Field(alias="${key}")`,
          );
        } else {
          fields.push(`    ${fieldName}: ${typeAnnotation}`);
        }
      }

      definitions.push(
        `class ${modelName}(BaseModel):\n${fields.length > 0 ? fields.join("\n") : "    pass"}`,
      );
      return modelName;
    }

    return "Any";
  }

  const rootModelName = toPascalCase(rootName);
  inferType(jsonVal, rootModelName);

  const header = `from __future__ import annotations\nfrom typing import Any, Optional, Union\nfrom pydantic import BaseModel, Field\n\n`;
  return `${header}${definitions.join("\n\n")}`.trim();
}

export default function JsonConverterComponent() {
  const t = useTranslations("tools.jsonConverter");

  const [inputJson, setInputJson] = useState<string>(DEFAULT_SAMPLE_JSON);
  const [rootName, setRootName] = useState<string>("Root");
  const [activeTab, setActiveTab] = useState<TargetOutput>("typescript");

  const { parsedJson, jsonError, outputResult } = useMemo(() => {
    let parsed: unknown = null;
    let error: string | null = null;
    let result = "";

    if (inputJson.trim().length > 0) {
      try {
        parsed = JSON.parse(inputJson);
      } catch (err: unknown) {
        error = err instanceof Error ? err.message : "Invalid JSON";
      }
    }

    if (error) {
      result = t("syntaxError", { error });
    } else if (!parsed) {
      result = t("emptyHint");
    } else {
      switch (activeTab) {
        case "typescript":
          result = generateTypeScript(rootName, parsed);
          break;
        case "pydantic":
          result = generatePydantic(rootName, parsed);
          break;
        case "formatted":
          result = JSON.stringify(parsed, null, 2);
          break;
        case "minified":
          result = JSON.stringify(parsed);
          break;
      }
    }

    return { parsedJson: parsed, jsonError: error, outputResult: result };
  }, [inputJson, rootName, activeTab, t]);

  const handleFormatInput = () => {
    if (parsedJson) {
      setInputJson(JSON.stringify(parsedJson, null, 2));
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--code-xml]"
        actions={
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setInputJson(DEFAULT_SAMPLE_JSON)}
              className="btn btn-xs btn-outline"
            >
              {t("loadSample")}
            </button>
            <button
              type="button"
              onClick={() => setInputJson("")}
              className="btn btn-xs btn-ghost text-base-content/60"
            >
              {t("clear")}
            </button>
          </div>
        }
      />

      <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-base-content/70">
            {t("rootName")} :
          </label>
          <input
            type="text"
            value={rootName}
            onChange={(e) => setRootName(e.target.value || "Root")}
            placeholder={t("rootPlaceholder")}
            className="input input-sm input-bordered font-mono text-xs w-36 focus:outline-primary"
          />
        </div>
        <span className="badge badge-sm badge-soft badge-success">
          {t("localOnlyBadge")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Colonne Gauche: Entrée JSON */}
        <div className="card card-border bg-base-100 p-4 flex flex-col gap-3 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b border-base-content/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
              {t("sourceJson")}
            </span>
            <button
              type="button"
              onClick={handleFormatInput}
              disabled={Boolean(jsonError) || !parsedJson}
              className="btn btn-xs btn-ghost text-base-content/70 hover:text-primary gap-1.5"
            >
              <span className="icon-[lucide--align-left] size-3.5"></span>
              <span>{t("formatInput")}</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              placeholder={'{\n  "key": "value"\n}'}
              className={`textarea textarea-bordered font-mono text-xs w-full h-120 leading-relaxed resize-none focus:outline-primary ${
                jsonError ? "border-error focus:border-error" : ""
              }`}
              spellCheck={false}
            />
            {jsonError && (
              <div className="absolute bottom-3 left-3 right-3 alert alert-soft alert-error text-xs p-2.5 flex items-center gap-2">
                <span className="icon-[lucide--alert-circle] size-4 shrink-0"></span>
                <span className="truncate">{jsonError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Colonne Droite: Sortie Typée */}
        <div className="card card-border bg-base-100 p-4 flex flex-col gap-3 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-base-content/10">
            <div className="join">
              <button
                type="button"
                onClick={() => setActiveTab("typescript")}
                className={`join-item btn btn-xs ${activeTab === "typescript" ? "btn-primary" : "btn-ghost text-base-content/70"}`}
              >
                {t("tabTypescript")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pydantic")}
                className={`join-item btn btn-xs ${activeTab === "pydantic" ? "btn-primary" : "btn-ghost text-base-content/70"}`}
              >
                {t("tabPydantic")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("formatted")}
                className={`join-item btn btn-xs ${activeTab === "formatted" ? "btn-primary" : "btn-ghost text-base-content/70"}`}
              >
                {t("tabBeautify")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("minified")}
                className={`join-item btn btn-xs ${activeTab === "minified" ? "btn-primary" : "btn-ghost text-base-content/70"}`}
              >
                {t("tabMinify")}
              </button>
            </div>

            <CopyButton
              text={outputResult}
              size="xs"
              variant="primary"
            />
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={outputResult}
              className="textarea textarea-bordered font-mono text-xs w-full h-120 leading-relaxed resize-none bg-base-200/40 select-all focus:outline-primary"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
