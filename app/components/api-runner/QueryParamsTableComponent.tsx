// app/components/api-runner/QueryParamsTableComponent.tsx
"use client";

import { KeyValueItem } from "./types";

interface QueryParamsTableProps {
  params: KeyValueItem[];
  onChange: (updated: KeyValueItem[]) => void;
}

export default function QueryParamsTableComponent({ params, onChange }: QueryParamsTableProps) {
  const handleAdd = () => {
    onChange([
      ...params,
      { id: Math.random().toString(36).substring(2, 9), key: "", value: "", enabled: true },
    ]);
  };

  const handleUpdate = (id: string, field: "key" | "value" | "enabled", val: string | boolean) => {
    onChange(params.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };

  const handleRemove = (id: string) => {
    onChange(params.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col gap-2">
      {params.length > 0 && (
        <div className="flex items-center gap-2 text-[11px] font-semibold text-base-content/50 uppercase px-1">
          <span className="w-8 text-center">Use</span>
          <span className="flex-1">Parameter Key</span>
          <span className="flex-1">Value</span>
          <span className="w-7"></span>
        </div>
      )}

      {params.map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={p.enabled}
            onChange={(e) => handleUpdate(p.id, "enabled", e.target.checked)}
            className="checkbox checkbox-xs checkbox-primary mx-2"
          />
          <input
            type="text"
            value={p.key}
            onChange={(e) => handleUpdate(p.id, "key", e.target.value)}
            placeholder="param (e.g. limit)"
            className="input input-xs input-bordered flex-1 font-mono text-xs focus:outline-primary"
          />
          <input
            type="text"
            value={p.value}
            onChange={(e) => handleUpdate(p.id, "value", e.target.value)}
            placeholder="value (e.g. 50)"
            className="input input-xs input-bordered flex-1 font-mono text-xs focus:outline-primary"
          />
          <button
            type="button"
            onClick={() => handleRemove(p.id)}
            className="btn btn-xs btn-ghost btn-square text-error hover:bg-error/10"
            title="Remove"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="btn btn-xs btn-ghost self-start gap-1 text-primary mt-1"
      >
        <span className="icon-[lucide--plus] size-3.5"></span>
        <span>Add Parameter</span>
      </button>
    </div>
  );
}
