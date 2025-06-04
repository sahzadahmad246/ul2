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
            alt: `Profile picture of ${poem.poet.name || "Unknown Poet"}`,
          },
        }
      : null,
    content: {
      en: poem.content.en?.map((item: ContentItem) => ({
        ...item,
        _id: item._id ? item._id.toString() : undefined,
      })) || [],
      hi: poem.content.hi?.map((item: ContentItem) => ({
        ...item,
        _id: item._id ? item._id.toString() : undefined,
      })) || [],
      ur: poem.content.ur?.map((item: ContentItem) => ({
        ...item,
        _id: item._id ? item._id.toString() : undefined,
      })) || [],
    },
    bookmarks: poem.bookmarks?.map((bookmark: Bookmark) => ({
      ...bookmark,
      userId: bookmark.userId.toString(),
      bookmarkedAt: bookmark.bookmarkedAt.toISOString(),
    })) || [],
    faqs: poem.faqs?.map((faq: FAQ) => ({
      ...faq,
      _id: faq._id ? faq._id.toString() : undefined,
    })) || [],
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
  }).populate("poet", "name slug");

  if (!poem || !["en", "hi", "ur"].includes(lang)) {
    return {
      title: "Poem Not Found | Unmatched Lines",
      description: "The requested poem could not be found. Explore other poems on Unmatched Lines.",
    };
  }

  const title = poem.title[lang].length > 60 ? poem.title[lang].substring(0, 57) + "..." : poem.title[lang];
  const description =
    poem.summary[lang]?.substring(0, 160) ||
    poem.content[lang][0]?.couplet?.substring(0, 160) ||
    `Read "${poem.title[lang]}" by ${poem.poet?.name || "Unknown Poet"} in ${lang === "en" ? "English" : lang === "hi" ? "Hindi" : "Urdu"} on Unmatched Lines.`;
  const image = poem.coverImage?.url || "/default-og-image.webp";
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://unmatchedlines.com";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/poems/${lang}/${poem.slug[lang]}`,
      type: "article",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `Illustration for ${poem.title[lang]} by ${poem.poet?.name || "Unknown Poet"}`,
        },
      ],
      locale: lang === "en" ? "en_US" : lang === "hi" ? "hi_IN" : "ur_PK",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `Illustration for ${poem.title[lang]} by ${poem.poet?.name || "Unknown Poet"}`,
        },
      ],
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
    notFound();
  }

  const serializedPoem = serializePoem(poem);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://unmatchedlines.com";

  // Structured Data (Poem + BreadcrumbList)
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Poem",
      name: serializedPoem.title[lang],
      description:
        serializedPoem.summary[lang]?.substring(0, 160) ||
        serializedPoem.content[lang][0]?.couplet?.substring(0, 160),
      text: serializedPoem.content[lang][0]?.couplet?.substring(0, 200) || "",
      genre: serializedPoem.topics,
      author: serializedPoem.poet
        ? {
            "@type": "Person",
            name: serializedPoem.poet.name,
            url: serializedPoem.poet.slug
              ? `${baseUrl}/poets/${serializedPoem.poet.slug}`
              : `${baseUrl}/poets/unknown`,
          }
        : {
            "@type": "Person",
            name: "Unknown Poet",
          },
      image: serializedPoem.coverImage?.url || "/default-og-image.webp",
      datePublished: serializedPoem.createdAt,
      dateModified: serializedPoem.updatedAt,
      inLanguage: lang === "en" ? "en-US" : lang === "hi" ? "hi-IN" : "ur-PK",
      url: `${baseUrl}/poems/${lang}/${serializedPoem.slug[lang]}`,
      publisher: {
        "@type": "Organization",
        name: "Unmatched Lines",
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/logo.webp`,
          width: 200,
          height: 60,
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
          name: lang === "en" ? "Home" : lang === "hi" ? "होम" : "ہوم",
          item: `${baseUrl}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: lang === "en" ? "Poems" : lang === "hi" ? "कविताएँ" : "نظمیں",
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
      <html lang={lang === "en" ? "en-US" : lang === "hi" ? "hi-IN" : "ur-PK"} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
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