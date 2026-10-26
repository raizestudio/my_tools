// app/components/har/harWorker.ts
export const HAR_WORKER_CODE = `
self.onmessage = async (e) => {
  const { file } = e.data;

  try {
    const text = await file.text();
    const har = JSON.parse(text);

    if (!har.log || !Array.isArray(har.log.entries)) {
      throw new Error("Invalid HAR structure: missing log.entries");
    }

    const SENSITIVE_HEADERS = new Set([
      "authorization", "cookie", "set-cookie", "proxy-authorization",
      "x-api-key", "api-key", "apikey", "x-auth-token", "x-csrf-token",
      "x-xsrf-token", "cf-access-jwt-assertion", "token", "session"
    ]);

    const SENSITIVE_PARAM_KEYS = new Set([
      "token", "access_token", "auth", "key", "api_key", "apikey",
      "secret", "client_secret", "password", "code", "refresh_token", "sig", "signature"
    ]);

    let redactedCount = 0;
    const previewList = [];

    // Nettoyage en place
    for (let i = 0; i < har.log.entries.length; i++) {
      const entry = har.log.entries[i];
      let entryRedacted = false;

      // 1. Sanitize Request Headers
      if (Array.isArray(entry.request?.headers)) {
        for (const h of entry.request.headers) {
          if (SENSITIVE_HEADERS.has(h.name.toLowerCase())) {
            h.value = "[REDACTED]";
            redactedCount++;
            entryRedacted = true;
          }
        }
      }

      // 2. Sanitize Response Headers
      if (Array.isArray(entry.response?.headers)) {
        for (const h of entry.response.headers) {
          if (SENSITIVE_HEADERS.has(h.name.toLowerCase())) {
            h.value = "[REDACTED]";
            redactedCount++;
            entryRedacted = true;
          }
        }
      }

      // 3. Sanitize Query Params
      if (Array.isArray(entry.request?.queryString)) {
        for (const q of entry.request.queryString) {
          if (SENSITIVE_PARAM_KEYS.has(q.name.toLowerCase())) {
            q.value = "[REDACTED]";
            redactedCount++;
            entryRedacted = true;
          }
        }
      }

      // 4. Sanitize Cookies
      if (Array.isArray(entry.request?.cookies)) {
        for (const c of entry.request.cookies) {
          c.value = "[REDACTED]";
          redactedCount++;
          entryRedacted = true;
        }
      }
      if (Array.isArray(entry.response?.cookies)) {
        for (const c of entry.response.cookies) {
          c.value = "[REDACTED]";
          redactedCount++;
          entryRedacted = true;
        }
      }

      // 5. Sanitize Request Body (postData)
      if (entry.request?.postData?.text) {
        try {
          const bodyJson = JSON.parse(entry.request.postData.text);
          let bodyChanged = false;
          const redactObject = (obj) => {
            if (!obj || typeof obj !== "object") return;
            for (const k of Object.keys(obj)) {
              if (SENSITIVE_PARAM_KEYS.has(k.toLowerCase())) {
                obj[k] = "[REDACTED]";
                redactedCount++;
                bodyChanged = true;
                entryRedacted = true;
              } else if (typeof obj[k] === "object") {
                redactObject(obj[k]);
              }
            }
          };
          redactObject(bodyJson);
          if (bodyChanged) {
            entry.request.postData.text = JSON.stringify(bodyJson, null, 2);
          }
        } catch {
          // Corps non-JSON ignoré
        }
      }

      // Extraction du modèle allégé pour l'UI React (tronque les corps lourds à 15 Ko max en prévisualisation)
      const reqBody = entry.request?.postData?.text || "";
      const resBody = entry.response?.content?.text || "";

      previewList.push({
        id: i,
        method: entry.request?.method || "GET",
        url: entry.request?.url || "",
        status: entry.response?.status || 0,
        time: Math.round(entry.time || 0),
        headers: entry.request?.headers || [],
        responseHeaders: entry.response?.headers || [],
        queryString: entry.request?.queryString || [],
        cookies: entry.request?.cookies || [],
        requestBody: reqBody.length > 15000 ? reqBody.slice(0, 15000) + "\\n... [Truncated preview]" : reqBody,
        responseBody: resBody.length > 15000 ? resBody.slice(0, 15000) + "\\n... [Truncated preview]" : resBody,
        isRedacted: entryRedacted,
      });
    }

    // Sérialisation du fichier complet assaini
    const cleanedJsonStr = JSON.stringify(har);
    const cleanedBlob = new Blob([cleanedJsonStr], { type: "application/json" });

    self.postMessage({
      success: true,
      cleanedBlob,
      redactedCount,
      totalEntries: har.log.entries.length,
      previewList,
    });
  } catch (err) {
    self.postMessage({ success: false, error: err.message || "Parse failed" });
  }
};
`;
