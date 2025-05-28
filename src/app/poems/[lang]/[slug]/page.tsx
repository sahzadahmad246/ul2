// src/app/poems/[lang]/[slug]/page.tsx
import { notFound } from "next/navigation";
import PoemDetails from "@/components/poems/PoemDetails";
import dbConnect from "@/lib/mongodb";
import Poem from "@/models/Poem";
import { Metadata } from "next";
import { IPoem, SerializedPoem, ContentItem, Bookmark, FAQ } from "@/types/poemTypes";

// Utility function to serialize Mongoose document
function serializePoem(poem: IPoem): SerializedPoem {
  return {
    ...poem,
    _id: poem._id.toString(),
    poet: poem.poet
      ? {
          _id: poem.poet._id.toString(),
          name: poem.poet.name || "Unknown Poet",
          slug: poem.poet.slug || undefined,
          profilePicture: poem.poet.profilePicture || {
            url: "/placeholder.svg?height=64&width=64",
          },
        }
      : null,
    content: {
      en: poem.content.en.map((item: ContentItem) => ({
        ...item,
        _id: item._id ? item._id.toString() : undefined,
      })),
      hi: poem.content.hi.map((item: ContentItem) => ({
        ...item,
        _id: item._id ? item._id.toString() : undefined,
      })),
      ur: poem.content.ur.map((item: ContentItem) => ({
        ...item,
        _id: item._id ? item._id.toString() : undefined,
      })),
    },
    bookmarks: poem.bookmarks.map((bookmark: Bookmark) => ({
      ...bookmark,
      userId: bookmark.userId.toString(),
      bookmarkedAt: bookmark.bookmarkedAt.toISOString(),
    })),
    faqs: poem.faqs.map((faq: FAQ) => ({
      ...faq,
      _id: faq._id ? faq._id.toString() : undefined,
    })),
    createdAt: poem.createdAt.toISOString(),
    updatedAt: poem.updatedAt.toISOString(),
  };
}

// Generate dynamic metadata
export async function generateMetadata({
  params,
}: PoemPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  await dbConnect();

  const poem = await Poem.findOne({
    $or: [
      {
        [`slug.${lang}`]: { $regex: `^${slug}$`, $options: "i" },
        status: "published",
      },
    ],
  }).populate("poet", "name");

  if (!poem || !["en", "hi", "ur"].includes(lang)) {
    return {
      title: "Poem Not Found",
      description: "The requested poem could not be found.",
    };
  }

  const title = poem.title[lang];
  const description =
    poem.summary[lang] ||
    poem.content[lang][0]?.couplet?.substring(0, 160) ||
    "";
  const keywords = poem.topics.join(", ");
  const image = poem.coverImage?.url || "/default-og-image.jpg";
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://yourdomain.com";

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/poems/${lang}/${poem.slug[lang]}`,
      type: "article",
      images: [{ url: image, alt: `Cover image for ${title}` }],
      locale: lang === "en" ? "en_US" : lang === "hi" ? "hi_IN" : "ur_PK",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `${baseUrl}/poems/${lang}/${poem.slug[lang]}`,
      languages: {
        "en-US": `${baseUrl}/poems/en/${poem.slug.en}`,
        "hi-IN": `${baseUrl}/poems/hi/${poem.slug.hi}`,
        "ur-PK": `${baseUrl}/poems/ur/${poem.slug.ur}`,
      },
    },
  };
}

interface PoemPageProps {
  params: Promise<{ lang: "en" | "hi" | "ur"; slug: string }>;
}

export default async function PoemPage({ params }: PoemPageProps) {
  const { lang, slug } = await params;
  await dbConnect();

  const poem = await Poem.findOne({
    $or: [
      {
        [`slug.${lang}`]: { $regex: `^${slug}$`, $options: "i" },
        status: "published",
      },
    ],
  })
    .populate("poet", "name slug profilePicture")
    .lean();

  if (!poem || !["en", "hi", "ur"].includes(lang)) {
    console.log("Poem not found for slug:", slug, "lang:", lang);
    notFound();
  }

  const serializedPoem = serializePoem(poem);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://yourdomain.com";

  // Structured Data (CreativeWork + BreadcrumbList)
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: serializedPoem.title[lang],
      description:
        serializedPoem.summary[lang] ||
        serializedPoem.content[lang][0]?.couplet?.substring(0, 160),
      keywords: serializedPoem.topics.join(", "),
      author: serializedPoem.poet
        ? {
            "@type": "Person",
            name: serializedPoem.poet.name,
            url: serializedPoem.poet.slug
              ? `${baseUrl}/poets/${serializedPoem.poet.slug}`
              : undefined,
          }
        : undefined,
      image: serializedPoem.coverImage?.url || "/default-og-image.jpg",
      datePublished: serializedPoem.createdAt,
      dateModified: serializedPoem.updatedAt,
      inLanguage: lang === "en" ? "en-US" : lang === "hi" ? "hi-IN" : "ur-PK",
      url: `${baseUrl}/poems/${lang}/${serializedPoem.slug[lang]}`,
      publisher: {
        "@type": "Organization",
        name: "Your Website Name",
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/logo.png`,
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${baseUrl}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Poems",
          item: `${baseUrl}/poems`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: serializedPoem.title[lang],
          item: `${baseUrl}/poems/${lang}/${serializedPoem.slug[lang]}`,
        },
      ],
    },
  ];

  return (
    <>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <PoemDetails poem={serializedPoem} currentLang={lang} />
    </>
  );
}

export async function generateStaticParams() {
  await dbConnect();
  const poems = await Poem.find({ status: "published" }).select("slug").lean();

  return poems.flatMap((poem) =>
    (["en", "hi", "ur"] as const).map((lang) => ({
      lang,
      slug: poem.slug[lang],
    }))
  );
}