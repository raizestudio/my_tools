// app/components/api-runner/types.ts

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
export type ExecutionEngine = "direct" | "relay";
export type BodyType = "none" | "json" | "form-data" | "urlencoded" | "raw";

export type CodeFormat =
  | "curl"
  | "python-requests"
  | "python-httpx"
  | "js-fetch"
  | "js-axios";

export interface KeyValueItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface FormDataItem {
  id: string;
  key: string;
  value: string;
  type: "text" | "file";
  file?: File | null;
  enabled: boolean;
}

export interface TimingBreakdown {
  dnsMs: number;
  ttfbMs: number;
  downloadMs: number;
  totalMs: number;
}

export interface ApiRunResponse {
  statusCode: number;
  statusText: string;
  timing: TimingBreakdown;
  headers: { key: string; value: string }[];
  body: string;
  isJson: boolean;
  isTruncated: boolean;
  sizeBytes: number;
}

export interface CollectionFolder {
  id: string;
  name: string;
  parentId: string | null; // null for top-level root groups
}

export interface SavedRequest {
  id: string;
  folderId: string | null; // null for root, or points to parent CollectionFolder
  name: string;
  method: HttpMethod;
  url: string;
  queryParams: KeyValueItem[];
  headers: KeyValueItem[];
  bodyType: BodyType;
  rawBody: string;
  formDataList: FormDataItem[];
  urlencodedList: KeyValueItem[];
  createdAt: number;
}

export interface ApiCollection {
  version: "2.0";
  name: string;
  updatedAt: string;
  folders: CollectionFolder[];
  requests: SavedRequest[];
}
