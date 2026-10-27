// app/components/api-runner/HeadersTableComponent.tsx
"use client";

import { KeyValueItem } from "./types";

interface HeadersTableProps {
  headers: KeyValueItem[];
  onChange: (updated: KeyValueItem[]) => void;
}

export default function HeadersTableComponent({ headers, onChange }: HeadersTableProps) {
  const handleAdd = () => {
    onChange([
      ...headers,
      { id: Math.random().toString(36).substring(2, 9), key: "", value: "", enabled: true },
    ]);
  };

  const handleUpdate = (id: string, field: "key" | "value" | "enabled", val: string | boolean) => {
    onChange(headers.map((h) => (h.id === id ? { ...h, [field]: val } : h)));
  };

  const handleRemove = (id: string) => {
    onChange(headers.filter((h) => h.id !== id));
  };

  return (
    <div className="flex flex-col gap-2">
      {headers.length > 0 && (
        <div className="flex items-center gap-2 text-[11px] font-semibold text-base-content/50 uppercase px-1">
          <span className="w-8 text-center">Use</span>
          <span className="flex-1">Header Name</span>
          <span className="flex-1">Header Value</span>
          <span className="w-7"></span>
        </div>
      )}

      {headers.map((h) => (
        <div key={h.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={h.enabled}
            onChange={(e) => handleUpdate(h.id, "enabled", e.target.checked)}
            className="checkbox checkbox-xs checkbox-primary mx-2"
          />
          <input
            type="text"
            value={h.key}
            onChange={(e) => handleUpdate(h.id, "key", e.target.value)}
            placeholder="Header (e.g. Authorization)"
            className="input input-xs input-bordered flex-1 font-mono text-xs focus:outline-primary"
          />
          <input
            type="text"
            value={h.value}
            onChange={(e) => handleUpdate(h.id, "value", e.target.value)}
            placeholder="Value (e.g. Bearer token...)"
            className="input input-xs input-bordered flex-1 font-mono text-xs focus:outline-primary"
          />
          <button
            type="button"
            onClick={() => handleRemove(h.id)}
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
        <span>Add Header</span>
      </button>
    </div>
  );
}
