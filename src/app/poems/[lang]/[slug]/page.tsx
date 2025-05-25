// src/app/poems/[lang]/[slug]/page.tsx
import { notFound } from "next/navigation";
import PoemDetails from "@/components/poems/PoemDetails";

interface PoemPageProps {
  params: Promise<{
    lang: "en" | "hi" | "ur";
    slug: string;
  }>;
}

async function getPoem(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/poems/${slug}`, {
      cache: "no-store", // or appropriate caching strategy
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function PoemPage({ params }: PoemPageProps) {
  const { lang, slug } = await params; // Await params

  // Validate language
  if (!["en", "hi", "ur"].includes(lang)) {
    notFound();
  }

  const poem = await getPoem(slug);

  if (!poem) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <PoemDetails poem={poem} currentLang={lang} />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PoemPageProps) {
  const { slug, lang } = await params; // Await params

  const poem = await getPoem(slug);

  if (!poem) {
    return {
      title: "Poem Not Found",
    };
  }

  const title = poem.title[lang] || poem.title.en;

  return {
    title: `${title} - Poetry Collection`,
    description: poem.summary[lang] || poem.summary.en || poem.content[lang]?.[0]?.couplet,
  };
}