// app/components/api-runner/helpers.ts
import {
  BodyType,
  CodeFormat,
  FormDataItem,
  HttpMethod,
  KeyValueItem,
} from "./types";

/**
 * Extracts query parameters from a URL into KeyValueItem rows.
 */
export function extractQueryParams(urlStr: string): {
  baseUrl: string;
  params: KeyValueItem[];
} {
  try {
    const url = new URL(urlStr);
    const params: KeyValueItem[] = [];
    url.searchParams.forEach((value, key) => {
      params.push({
        id: Math.random().toString(36).substring(2, 9),
        key,
        value,
        enabled: true,
      });
    });
    return { baseUrl: `${url.origin}${url.pathname}`, params };
  } catch {
    const qIndex = urlStr.indexOf("?");
    if (qIndex === -1) return { baseUrl: urlStr, params: [] };

    const baseUrl = urlStr.slice(0, qIndex);
    const qs = urlStr.slice(qIndex + 1);
    const searchParams = new URLSearchParams(qs);
    const params: KeyValueItem[] = [];
    searchParams.forEach((value, key) => {
      params.push({
        id: Math.random().toString(36).substring(2, 9),
        key,
        value,
        enabled: true,
      });
    });
    return { baseUrl, params };
  }
}

/**
 * Reconstructs a full URL by appending active query parameters.
 */
export function buildUrlWithParams(
  baseUrl: string,
  params: KeyValueItem[],
): string {
  const activeParams = params.filter((p) => p.enabled && p.key.trim());
  const cleanBase = baseUrl.split("?")[0];
  if (activeParams.length === 0) return cleanBase;

  const sp = new URLSearchParams();
  activeParams.forEach((p) => sp.append(p.key.trim(), p.value));
  return `${cleanBase}?${sp.toString()}`;
}

/**
 * Generates an executable code snippet for the chosen target runtime.
 */
export function generateCodeSnippet(
  format: CodeFormat,
  method: HttpMethod,
  fullUrl: string,
  headers: KeyValueItem[],
  bodyType: BodyType,
  rawBody: string,
  formDataList: FormDataItem[],
  urlencodedList: KeyValueItem[],
): string {
  const activeHeaders = headers.filter((h) => h.enabled && h.key.trim());
  const hasBody =
    ["POST", "PUT", "PATCH", "DELETE"].includes(method) && bodyType !== "none";

  // --- 1. cURL ---
  if (format === "curl") {
    let cmd = `curl -X ${method} "${fullUrl}"`;
    activeHeaders.forEach((h) => {
      cmd += ` \\\n  -H "${h.key.trim()}: ${h.value.trim()}"`;
    });

    if (hasBody) {
      if ((bodyType === "json" || bodyType === "raw") && rawBody.trim()) {
        cmd += ` \\\n  --data '${rawBody.replace(/'/g, "'\\''")}'`;
      } else if (bodyType === "urlencoded") {
        const active = urlencodedList.filter(
          (item) => item.enabled && item.key.trim(),
        );
        if (active.length > 0) {
          const sp = new URLSearchParams();
          active.forEach((item) => sp.append(item.key.trim(), item.value));
          cmd += ` \\\n  --data "${sp.toString()}"`;
        }
      } else if (bodyType === "form-data") {
        formDataList
          .filter((item) => item.enabled && item.key.trim())
          .forEach((item) => {
            if (item.type === "file" && item.file) {
              cmd += ` \\\n  -F "${item.key.trim()}=@${item.file.name}"`;
            } else {
              cmd += ` \\\n  -F "${item.key.trim()}=${item.value}"`;
            }
          });
      }
    }
    return cmd;
  }

  // --- 2. Python Requests ---
  if (format === "python-requests") {
    const lines: string[] = ["import requests", ""];
    lines.push(`url = "${fullUrl}"`);

    // Headers
    if (activeHeaders.length > 0) {
      lines.push("headers = {");
      activeHeaders.forEach((h) => {
        lines.push(`    "${h.key.trim()}": "${h.value.trim()}",`);
      });
      lines.push("}");
    } else {
      lines.push("headers = {}");
    }

    let callArgs = `url, headers=headers`;

    if (hasBody) {
      if (bodyType === "json" && rawBody.trim()) {
        lines.push(`payload = ${formatPythonDict(rawBody)}`);
        callArgs += `, json=payload`;
      } else if (bodyType === "raw" && rawBody.trim()) {
        lines.push(`data = """${rawBody}"""`);
        callArgs += `, data=data`;
      } else if (bodyType === "urlencoded") {
        lines.push("data = {");
        urlencodedList
          .filter((item) => item.enabled && item.key.trim())
          .forEach((item) =>
            lines.push(`    "${item.key.trim()}": "${item.value}",`),
          );
        lines.push("}");
        callArgs += `, data=data`;
      } else if (bodyType === "form-data") {
        lines.push("files = [");
        formDataList
          .filter((item) => item.enabled && item.key.trim())
          .forEach((item) => {
            if (item.type === "file" && item.file) {
              lines.push(
                `    ("${item.key.trim()}", ("${item.file.name}", open("${item.file.name}", "rb"))),`,
              );
            } else {
              lines.push(
                `    ("${item.key.trim()}", (None, "${item.value}")),`,
              );
            }
          });
        lines.push("]");
        callArgs += `, files=files`;
      }
    }

    lines.push("");
    lines.push(`response = requests.${method.toLowerCase()}(${callArgs})`);
    lines.push(`print(response.status_code)`);
    lines.push(`print(response.text)`);
    return lines.join("\n");
  }

  // --- 3. Python HTTPX ---
  if (format === "python-httpx") {
    const lines: string[] = ["import httpx", ""];
    lines.push(`url = "${fullUrl}"`);

    if (activeHeaders.length > 0) {
      lines.push("headers = {");
      activeHeaders.forEach((h) => {
        lines.push(`    "${h.key.trim()}": "${h.value.trim()}",`);
      });
      lines.push("}");
    } else {
      lines.push("headers = {}");
    }

    let callArgs = `"${method}", url, headers=headers`;

    if (hasBody) {
      if (bodyType === "json" && rawBody.trim()) {
        lines.push(`payload = ${formatPythonDict(rawBody)}`);
        callArgs += `, json=payload`;
      } else if (bodyType === "raw" && rawBody.trim()) {
        lines.push(`content = """${rawBody}"""`);
        callArgs += `, content=content`;
      } else if (bodyType === "urlencoded") {
        lines.push("data = {");
        urlencodedList
          .filter((item) => item.enabled && item.key.trim())
          .forEach((item) =>
            lines.push(`    "${item.key.trim()}": "${item.value}",`),
          );
        lines.push("}");
        callArgs += `, data=data`;
      } else if (bodyType === "form-data") {
        lines.push("files = {");
        formDataList
          .filter((item) => item.enabled && item.key.trim())
          .forEach((item) => {
            if (item.type === "file" && item.file) {
              lines.push(
                `    "${item.key.trim()}": open("${item.file.name}", "rb"),`,
              );
            } else {
              lines.push(`    "${item.key.trim()}": (None, "${item.value}"),`);
            }
          });
        lines.push("}");
        callArgs += `, files=files`;
      }
    }

    lines.push("");
    lines.push("with httpx.Client() as client:");
    lines.push(`    response = client.request(${callArgs})`);
    lines.push(`    print(response.status_code)`);
    lines.push(`    print(response.text)`);
    return lines.join("\n");
  }

  // --- 4. JavaScript / Browser (Fetch) ---
  if (format === "js-fetch") {
    const lines: string[] = [];

    if (hasBody && bodyType === "form-data") {
      lines.push("const formData = new FormData();");
      formDataList
        .filter((item) => item.enabled && item.key.trim())
        .forEach((item) => {
          if (item.type === "file" && item.file) {
            lines.push(
              `// formData.append("${item.key.trim()}", fileInput.files[0]);`,
            );
          } else {
            lines.push(
              `formData.append("${item.key.trim()}", "${item.value}");`,
            );
          }
        });
      lines.push("");
    }

    lines.push(`const response = await fetch("${fullUrl}", {`);
    lines.push(`  method: "${method}",`);

    // Headers
    if (activeHeaders.length > 0) {
      lines.push("  headers: {");
      activeHeaders.forEach((h) => {
        lines.push(`    "${h.key.trim()}": "${h.value.trim()}",`);
      });
      lines.push("  },");
    }

    if (hasBody) {
      if (bodyType === "json" && rawBody.trim()) {
        lines.push(`  body: JSON.stringify(${rawBody.trim()}),`);
      } else if (bodyType === "raw" && rawBody.trim()) {
        lines.push(`  body: ${JSON.stringify(rawBody)},`);
      } else if (bodyType === "urlencoded") {
        const active = urlencodedList.filter(
          (item) => item.enabled && item.key.trim(),
        );
        const sp = new URLSearchParams();
        active.forEach((item) => sp.append(item.key.trim(), item.value));
        lines.push(
          `  body: new URLSearchParams(${JSON.stringify(Object.fromEntries(sp))}),`,
        );
      } else if (bodyType === "form-data") {
        lines.push("  body: formData,");
      }
    }

    lines.push("});");
    lines.push("");
    lines.push("const data = await response.text();");
    lines.push("console.log(data);");
    return lines.join("\n");
  }

  // --- 5. Node.js (Axios) ---
  if (format === "js-axios") {
    const lines: string[] = [`import axios from "axios";`, ""];
    lines.push("const response = await axios({");
    lines.push(`  method: "${method.toLowerCase()}",`);
    lines.push(`  url: "${fullUrl}",`);

    if (activeHeaders.length > 0) {
      lines.push("  headers: {");
      activeHeaders.forEach((h) => {
        lines.push(`    "${h.key.trim()}": "${h.value.trim()}",`);
      });
      lines.push("  },");
    }

    if (hasBody) {
      if (bodyType === "json" && rawBody.trim()) {
        lines.push(`  data: ${rawBody.trim()},`);
      } else if (bodyType === "raw" && rawBody.trim()) {
        lines.push(`  data: ${JSON.stringify(rawBody)},`);
      } else if (bodyType === "urlencoded") {
        const active = urlencodedList.filter(
          (item) => item.enabled && item.key.trim(),
        );
        const sp = new URLSearchParams();
        active.forEach((item) => sp.append(item.key.trim(), item.value));
        lines.push(
          `  data: new URLSearchParams(${JSON.stringify(Object.fromEntries(sp))}),`,
        );
      } else if (bodyType === "form-data") {
        lines.push(
          `  // data: formData (install 'form-data' or use native FormData)`,
        );
      }
    }

    lines.push("});");
    lines.push("");
    lines.push("console.log(response.data);");
    return lines.join("\n");
  }

  return "";
}

/**
 * Format JSON strings into valid Python dictionaries (True/False/None).
 */
function formatPythonDict(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 4)
      .replace(/: true/g, ": True")
      .replace(/: false/g, ": False")
      .replace(/: null/g, ": None");
  } catch {
    return `"""${raw}"""`;
  }
}

/**
 * Parses raw cURL command lines into structured request state.
 */
export function parseCurlCommand(raw: string) {
  const clean = raw.replace(/\\\r?\n/g, " ");

  let method: HttpMethod = "GET";
  let url = "";
  const headers: KeyValueItem[] = [];
  let rawBody = "";
  let bodyType: BodyType = "none";
  const formDataList: FormDataItem[] = [];

  const urlMatch = clean.match(
    /(?:--url\s+|curl\s+)?['"]?(https?:\/\/[^\s'"]+)['"]?/i,
  );
  if (urlMatch) url = urlMatch[1];

  const methodMatch = clean.match(/(?:-X|--request)\s+([A-Z]+)/i);
  if (methodMatch) method = methodMatch[1].toUpperCase() as HttpMethod;

  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/gi;
  let hMatch: RegExpExecArray | null;
  while ((hMatch = headerRegex.exec(clean)) !== null) {
    const parts = hMatch[1].split(":");
    if (parts.length >= 2) {
      headers.push({
        id: Math.random().toString(36).substring(2, 9),
        key: parts[0].trim(),
        value: parts.slice(1).join(":").trim(),
        enabled: true,
      });
    }
  }

  const formRegex = /(?:-F|--form)\s+['"]?([^'"\s]+)['"]?/gi;
  let fMatch: RegExpExecArray | null;
  while ((fMatch = formRegex.exec(clean)) !== null) {
    const [k, v] = fMatch[1].split("=");
    if (k && v) {
      bodyType = "form-data";
      formDataList.push({
        id: Math.random().toString(36).substring(2, 9),
        key: k.trim(),
        value: v.startsWith("@") ? "" : v.trim(),
        type: v.startsWith("@") ? "file" : "text",
        file: null,
        enabled: true,
      });
    }
  }

  const bodyMatch = clean.match(
    /(?:-d|--data|--data-raw)\s+['"]([\s\S]*?)['"](?:\s+-[a-zA-Z]|\s*$)/,
  );
  if (bodyMatch && bodyType !== "form-data") {
    rawBody = bodyMatch[1];
    bodyType = rawBody.trim().startsWith("{") ? "json" : "raw";
    if (!methodMatch && method === "GET") method = "POST";
  }

  return { method, url, headers, bodyType, rawBody, formDataList };
}
