// src/app/robots.txt/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://yourdomain.com";
  const content = `
User-agent: *
Allow: /
Allow: /poems/
Disallow: /api/
Disallow: /admin/
Disallow: /login/
Disallow: /signup/

Sitemap: ${baseUrl}/sitemap.xml
  `.trim();

  return new NextResponse(content, {
    headers: { "Content-Type": "text/plain" },
  });
}