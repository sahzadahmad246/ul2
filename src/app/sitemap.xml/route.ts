// src/app/sitemap.xml/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Poem from "@/models/Poem";

export async function GET() {
  await dbConnect();
  const poems = await Poem.find({ status: "published" }).select("slug createdAt updatedAt").lean();

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://yourdomain.com";
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
      ${poems
        .flatMap((poem) =>
          (["en", "hi", "ur"] as const).map((lang) => `
            <url>
              <loc>${baseUrl}/poems/${lang}/${poem.slug[lang]}</loc>
              <lastmod>${new Date(poem.updatedAt || poem.createdAt).toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.8</priority>
              ${(["en", "hi", "ur"] as const)
                .map(
                  (altLang) => `
                  <xhtml:link
                    rel="alternate"
                    hreflang="${altLang === "en" ? "en-US" : altLang === "hi" ? "hi-IN" : "ur-PK"}"
                    href="${baseUrl}/poems/${altLang}/${poem.slug[altLang]}"
                  />
                `
                )
                .join("")}
            </url>
          `)
        )
        .join("")}
    </urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}