// app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const backendUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  try {
    const res = await fetch(`${backendUrl}/health`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ live: false, version: null });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      live: true,
      version: data.version ?? null,
    });
  } catch {
    return NextResponse.json({ live: false, version: null });
  }
}
