// src/utils/slugify.ts
export function slugify(title: string, language?: "en" | "hi" | "ur"): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return language ? `${baseSlug}-${language}` : baseSlug;
}

export function slugifyUser(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  console.log(`[slugifyUser] Generated slug: ${slug}`);
  return slug;
}
