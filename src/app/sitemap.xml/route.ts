import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Poem from "@/models/Poem";
import User from "@/models/User";

// Define the query interface to avoid using `any`
interface PoemQuery {
  poet: string;
  status: string;
  type?: string | { $in: string[] };
}

export async function GET() {
  await dbConnect();

  // Define valid categories first to avoid ReferenceError
  const validCategories = [
    "all-works",
    "ghazal",
    "sher",
    "nazm",
    "top-20",
    "top-20-ghazal",
    "top-20-sher",
  ];

  // Fetch poets
  const poets = await User.find({ role: "poet" })
    .select("slug createdAt updatedAt")
    .lean();

  // Fetch poems
  const poems = await Poem.find({ status: "published" })
    .select("slug createdAt updatedAt")
    .lean();

  // Fetch works data from database (count poems per poet and category)
  const worksDataPromises = poets.flatMap((poet) =>
    validCategories.map(async (category) => {
      try {
        const query: PoemQuery = { poet: poet.slug, status: "published" };
        if (category !== "all-works") {
          if (category === "top-20") {
            query.type = { $in: ["ghazal", "sher", "nazm"] };
          } else if (category === "top-20-ghazal") {
            query.type = "ghazal";
          } else if (category === "top-20-sher") {
            query.type = "sher";
          } else {
            query.type = category;
          }
        }
        const total = await Poem.countDocuments(query);
        return { slug: poet.slug, category, total };
      } catch {
        return { slug: poet.slug, category, total: 0 };
      }
    })
  );
  const worksData = await Promise.all(worksDataPromises);

  // Use NEXT_PUBLIC_BASE_URL with fallbacks
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://unmatchedlines.com"
      : "http://localhost:3000");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
      <!-- Poet Profiles -->
      ${poets
        .map(
          (poet) => `
            <url>
              <loc>${baseUrl}/poet/${poet.slug}</loc>
              <lastmod>${new Date(
                poet.updatedAt || poet.createdAt
              ).toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.8</priority>
              ${(["en", "hi", "ur"] as const)
                .map(
                  (lang) => `
                  <xhtml:link
                    rel="alternate"
                    hreflang="${
                      lang === "en"
                        ? "en-US"
                        : lang === "hi"
                        ? "hi-IN"
                        : "ur-PK"
                    }"
                    href="${baseUrl}/${lang}/poet/${poet.slug}"
                  />
                `
                )
                .join("")}
            </url>
          `
        )
        .join("")}
      <!-- Poet Works Categories (including paginated pages) -->
      ${worksData
        .flatMap(({ slug, category, total }) => {
          const pageCount = Math.ceil(total / 20);
          return Array.from({ length: pageCount }, (_, i) => i + 1).map(
            (page) => `
              <url>
                <loc>${baseUrl}/poet/${slug}/${category}${
              page > 1 ? `?page=${page}` : ""
            }</loc>
                <lastmod>${new Date().toISOString()}</lastmod>
                <changefreq>daily</changefreq>
                <priority>${page === 1 ? 0.7 : 0.6}</priority>
                ${(["en", "hi", "ur"] as const)
                  .map(
                    (lang) => `
                    <xhtml:link
                      rel="alternate"
                      hreflang="${
                        lang === "en"
                          ? "en-US"
                          : lang === "hi"
                          ? "hi-IN"
                          : "ur-PK"
                      }"
                      href="${baseUrl}/${lang}/poet/${slug}/${category}${
                      page > 1 ? `?page=${page}` : ""
                    }"
                    />
                  `
                  )
                  .join("")}
              </url>
            `
          );
        })
        .join("")}
      <!-- Poems -->
      ${poems
        .flatMap((poem) =>
          (["en", "hi", "ur"] as const).map(
            (lang) => `
              <url>
                <loc>${baseUrl}/poems/${lang}/${poem.slug[lang]}</loc>
                <lastmod>${new Date(
                  poem.updatedAt || poem.createdAt
                ).toISOString()}</lastmod>
                <changefreq>weekly</changefreq>
                <priority>0.8</priority>
                ${(["en", "hi", "ur"] as const)
                  .map(
                    (altLang) => `
                    <xhtml:link
                      rel="alternate"
                      hreflang="${
                        altLang === "en"
                          ? "en-US"
                          : altLang === "hi"
                          ? "hi-IN"
                          : "ur-PK"
                      }"
                      href="${baseUrl}/poems/${altLang}/${poem.slug[altLang]}"
                    />
                  `
                  )
                  .join("")}
              </url>
            `
          )
        )
        .join("")}
    </urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}