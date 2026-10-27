// app/components/api-runner/BodyEditorComponent.tsx
"use client";

import { ChangeEvent } from "react";
import { BodyType, FormDataItem, KeyValueItem } from "./types";

interface BodyEditorProps {
  bodyType: BodyType;
  onBodyTypeChange: (type: BodyType) => void;
  rawBody: string;
  onRawBodyChange: (val: string) => void;
  formDataList: FormDataItem[];
  onFormDataChange: (items: FormDataItem[]) => void;
  urlencodedList: KeyValueItem[];
  onUrlencodedChange: (items: KeyValueItem[]) => void;
}

export default function BodyEditorComponent({
  bodyType,
  onBodyTypeChange,
  rawBody,
  onRawBodyChange,
  formDataList,
  onFormDataChange,
  urlencodedList,
  onUrlencodedChange,
}: BodyEditorProps) {
  // Prettify JSON
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(rawBody);
      onRawBodyChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Ignore formatting on invalid JSON
    }
  };

  // Form-Data item actions
  const handleAddFormData = () => {
    onFormDataChange([
      ...formDataList,
      {
        id: Math.random().toString(36).substring(2, 9),
        key: "",
        value: "",
        type: "text",
        file: null,
        enabled: true,
      },
    ]);
  };

  const handleUpdateFormData = (
    id: string,
    field: "key" | "value" | "type" | "enabled" | "file",
    val: unknown
  ) => {
    onFormDataChange(
      formDataList.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveFormData = (id: string) => {
    onFormDataChange(formDataList.filter((item) => item.id !== id));
  };

  // URL-Encoded item actions
  const handleAddUrlencoded = () => {
    onUrlencodedChange([
      ...urlencodedList,
      { id: Math.random().toString(36).substring(2, 9), key: "", value: "", enabled: true },
    ]);
  };

  const handleUpdateUrlencoded = (
    id: string,
    field: "key" | "value" | "enabled",
    val: string | boolean
  ) => {
    onUrlencodedChange(
      urlencodedList.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveUrlencoded = (id: string) => {
    onUrlencodedChange(urlencodedList.filter((item) => item.id !== id));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Body Format Switcher */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-base-content/10">
        {(["none", "json", "form-data", "urlencoded", "raw"] as BodyType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onBodyTypeChange(type)}
            className={`btn btn-xs ${
              bodyType === type ? "btn-neutral" : "btn-ghost text-base-content/60"
            }`}
          >
            {type === "none" && "None"}
            {type === "json" && "JSON"}
            {type === "form-data" && "Multipart Form (Files)"}
            {type === "urlencoded" && "x-www-form-urlencoded"}
            {type === "raw" && "Raw Text"}
          </button>
        ))}

        {bodyType === "json" && (
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFormatJson}
              className="btn btn-xs btn-ghost text-primary"
            >
              Prettify JSON
            </button>
            <button
              type="button"
              onClick={() => onRawBodyChange("")}
              className="btn btn-xs btn-ghost text-error"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* None View */}
      {bodyType === "none" && (
        <div className="py-8 text-center text-xs text-base-content/40 italic">
          This request does not include a body payload.
        </div>
      )}

      {/* JSON & Raw Text View */}
      {(bodyType === "json" || bodyType === "raw") && (
        <textarea
          value={rawBody}
          onChange={(e) => onRawBodyChange(e.target.value)}
          rows={7}
          placeholder={bodyType === "json" ? '{\n  "name": "0w toolkit",\n  "offline": true\n}' : "Raw plain text content..."}
          className="textarea textarea-bordered font-mono text-xs w-full focus:outline-primary leading-relaxed"
        />
      )}

      {/* Multipart Form-Data (With File Upload Support) */}
      {bodyType === "form-data" && (
        <div className="flex flex-col gap-2">
          {formDataList.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => handleUpdateFormData(item.id, "enabled", e.target.checked)}
                className="checkbox checkbox-xs checkbox-primary mx-1"
              />

              <input
                type="text"
                value={item.key}
                onChange={(e) => handleUpdateFormData(item.id, "key", e.target.value)}
                placeholder="Field name"
                className="input input-xs input-bordered w-1/3 font-mono text-xs focus:outline-primary"
              />

              <select
                value={item.type}
                onChange={(e) =>
                  handleUpdateFormData(item.id, "type", e.target.value as "text" | "file")
                }
                className="select select-xs select-bordered w-20 text-[11px]"
              >
                <option value="text">Text</option>
                <option value="file">File</option>
              </select>

              {item.type === "text" ? (
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => handleUpdateFormData(item.id, "value", e.target.value)}
                  placeholder="Text value"
                  className="input input-xs input-bordered flex-1 font-mono text-xs focus:outline-primary"
                />
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="file"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files?.[0]) {
                        handleUpdateFormData(item.id, "file", e.target.files[0]);
                      }
                    }}
                    className="file-input file-input-xs file-input-bordered flex-1 text-xs"
                  />
                  {item.file && (
                    <span className="text-[10px] text-base-content/50 font-mono shrink-0">
                      {(item.file.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleRemoveFormData(item.id)}
                className="btn btn-xs btn-ghost btn-square text-error hover:bg-error/10"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddFormData}
            className="btn btn-xs btn-ghost self-start gap-1 text-primary mt-1"
          >
            <span className="icon-[lucide--plus] size-3.5"></span>
            <span>Add Form Field</span>
          </button>
        </div>
      )}

      {/* URL-Encoded Form View */}
      {bodyType === "urlencoded" && (
        <div className="flex flex-col gap-2">
          {urlencodedList.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => handleUpdateUrlencoded(item.id, "enabled", e.target.checked)}
                className="checkbox checkbox-xs checkbox-primary mx-1"
              />
              <input
                type="text"
                value={item.key}
                onChange={(e) => handleUpdateUrlencoded(item.id, "key", e.target.value)}
                placeholder="Key"
                className="input input-xs input-bordered flex-1 font-mono text-xs focus:outline-primary"
              />
              <input
                type="text"
                value={item.value}
                onChange={(e) => handleUpdateUrlencoded(item.id, "value", e.target.value)}
                placeholder="Value"
                className="input input-xs input-bordered flex-1 font-mono text-xs focus:outline-primary"
              />
              <button
                type="button"
                onClick={() => handleRemoveUrlencoded(item.id)}
                className="btn btn-xs btn-ghost btn-square text-error hover:bg-error/10"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddUrlencoded}
            className="btn btn-xs btn-ghost self-start gap-1 text-primary mt-1"
          >
            <span className="icon-[lucide--plus] size-3.5"></span>
            <span>Add Encoded Field</span>
          </button>
        </div>
      )}
    </div>
  );
}
