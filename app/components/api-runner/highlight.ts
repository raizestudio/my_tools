// app/components/api-runner/highlight.ts
import { CodeFormat } from "./types";

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function highlightCode(code: string, format: CodeFormat): string {
    let regex: RegExp;

    if (format === "curl") {
        regex =
            /(#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|((?:^|\s)(?:-[A-Za-z]|--[A-Za-z0-9-]+))|(\b(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b)|(\\)$/gm;
    } else if (format === "python-requests" || format === "python-httpx") {
        regex =
            /(#[^\n]*)|("""[\s\S]*?"""|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:import|from|with|as|def|return|class|pass|for|in|if|else|elif|try|except|finally)\b)|(\b(?:True|False|None)\b)|(\b(?:print|open|requests|httpx|Client)\b)|(\b\d+\b)/gm;
    } else {
        // JavaScript / Node.js
        regex =
            /(\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:import|export|from|const|let|var|await|async|function|return|new|if|else|try|catch)\b)|(\b(?:true|false|null|undefined)\b)|(\b(?:fetch|axios|FormData|URLSearchParams|JSON|console|response|data)\b)|(\b\d+\b)/gm;
    }

    let result = "";
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(code)) !== null) {
        if (match.index > lastIndex) {
            result += escapeHtml(code.slice(lastIndex, match.index));
        }

        const [full, g1, g2, g3, g4, g5, g6] = match;
        const escaped = escapeHtml(full);

        if (format === "curl") {
            if (g1)
                result += `<span class="text-base-content/40 italic">${escaped}</span>`; // comments
            else if (g2)
                result += `<span class="text-success">${escaped}</span>`; // strings
            else if (g3)
                result += `<span class="text-warning font-bold">${escaped}</span>`; // flags
            else if (g4)
                result += `<span class="text-error font-bold">${escaped}</span>`; // verbs
            else if (g5)
                result += `<span class="text-base-content font-bold">${escaped}</span>`; // line continuations
            else result += escaped;
        } else if (format === "python-requests" || format === "python-httpx") {
            if (g1)
                result += `<span class="text-base-content/40 italic">${escaped}</span>`; // comments
            else if (g2)
                result += `<span class="text-success">${escaped}</span>`; // strings
            else if (g3)
                result += `<span class="text-secondary font-bold">${escaped}</span>`; // keywords
            else if (g4)
                result += `<span class="text-warning font-semibold">${escaped}</span>`; // booleans
            else if (g5)
                result += `<span class="text-info font-bold">${escaped}</span>`; // built-ins
            else if (g6)
                result += `<span class="text-accent">${escaped}</span>`; // numbers
            else result += escaped;
        } else {
            if (g1)
                result += `<span class="text-base-content/40 italic">${escaped}</span>`; // comments
            else if (g2)
                result += `<span class="text-success">${escaped}</span>`; // strings
            else if (g3)
                result += `<span class="text-secondary font-bold">${escaped}</span>`; // keywords
            else if (g4)
                result += `<span class="text-warning font-semibold">${escaped}</span>`; // booleans
            else if (g5)
                result += `<span class="text-info font-bold">${escaped}</span>`; // built-ins
            else if (g6)
                result += `<span class="text-accent">${escaped}</span>`; // numbers
            else result += escaped;
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < code.length) {
        result += escapeHtml(code.slice(lastIndex));
    }

    return result;
}
