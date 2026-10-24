// app/url-shtnr/[short_code]/route.ts
import { NextResponse } from 'next/server';

interface RouteProps {
  params: Promise<{ short_code: string }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  const { short_code } = await params;
  const apiUrl = process.env.API_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${apiUrl}/url-shtnr/${short_code}`);

    if (!res.ok) {
      return new NextResponse('Short link not found', { status: 404 });
    }

    const data = await res.json();
    // Native HTTP 307 redirect straight to destination
    return NextResponse.redirect(data.original_url, 307);
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
