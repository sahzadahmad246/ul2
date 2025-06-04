// src/lib/structured-data.ts
import { IPoet } from "@/types/userTypes";
import { IPoem } from "@/types/poemTypes";
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://unmatchedlines.com"
    : "http://localhost:3000");
export function generatePoetStructuredData(poet: IPoet) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: poet.name,
    alternateName: poet.slug,
    description:
      poet.bio || `${poet.name}, a poet known for ghazals, shers, and nazms.`,
    url: `${baseUrl}/poet/${poet.slug}`,
    image: poet.profilePicture?.url || `${baseUrl}/placeholder.svg`,
    jobTitle: "Poet",
    worksFor: {
      "@type": "Organization",
      name: "Unmatched Lines",
    },
    address: poet.location
      ? {
          "@type": "PostalAddress",
          addressLocality: poet.location,
        }
      : undefined,
    knowsLanguage: ["English", "Hindi", "Urdu"], // Reflect multilingual content
    inLanguage: "en", // Primary language for poet info
    dateCreated: poet.createdAt
      ? new Date(poet.createdAt).toISOString()
      : undefined,
    numberOfWorks: poet.poemCount || 0,
    genre: ["Poetry", "Urdu Literature", "Ghazal", "Nazm", "Sher"],
    hasCreativeWork: [
      {
        "@type": "CollectionPage",
        name: `All Works by ${poet.name}`,
        url: `${baseUrl}/poet/${poet.slug}/all-works`,
      },
      {
        "@type": "CollectionPage",
        name: `Ghazals by ${poet.name}`,
        url: `${baseUrl}/poet/${poet.slug}/ghazal`,
      },
      {
        "@type": "CollectionPage",
        name: `Shers by ${poet.name}`,
        url: `${baseUrl}/poet/${poet.slug}/sher`,
      },
      {
        "@type": "CollectionPage",
        name: `Nazms by ${poet.name}`,
        url: `${baseUrl}/poet/${poet.slug}/nazm`,
      },
    ],
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}` },
        {
          "@type": "ListItem",
          position: 2,
          name: "Poets",
          item: `${baseUrl}/poets`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: poet.name,
          item: `${baseUrl}/poet/${poet.slug}`,
        },
      ],
    },
  };
}

export function generatePoemCollectionStructuredData(
  poet: IPoet,
  poems: IPoem[],
  category: string,
  pageNum: number = 1,
  totalItems: number = 0
) {
  const categoryLabels: Record<string, string> = {
    "all-works": "Complete Poetry Collection",
    ghazal: "Ghazal Collection",
    sher: "Sher Collection",
    nazm: "Nazm Collection",
    "top-20": "Top 20 Poems",
    "top-20-ghazal": "Top 20 Ghazals",
    "top-20-sher": "Top 20 Shers",
  };

  const collectionUrl = `${baseUrl}/poet/${poet.slug}/${category}${
    pageNum > 1 ? `?page=${pageNum}` : ""
  }`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryLabels[category] || "Poetry Collection"} by ${poet.name}`,
    description: `Explore ${poet.name}'s ${
      categoryLabels[category]?.toLowerCase() || "poems"
    } in English, Hindi, and Urdu on Unmatched Lines.`,
    url: collectionUrl,
    creator: {
      "@type": "Person",
      name: poet.name,
      url: `${baseUrl}/poet/${poet.slug}`,
    },
    numberOfItems: poems.length,
    totalItems: totalItems, // Total items across all pages
    inLanguage: ["en", "hi", "ur"], // Support multilingual poems
    isPartOf: {
      "@type": "WebSite",
      name: "Unmatched Lines",
      url: `${baseUrl}`,
    },
    previousPage:
      pageNum > 1
        ? `${baseUrl}/poet/${poet.slug}/${category}?page=${pageNum - 1}`
        : undefined,
    nextPage:
      totalItems > pageNum * 20
        ? `${baseUrl}/poet/${poet.slug}/${category}?page=${pageNum + 1}`
        : undefined,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}` },
        {
          "@type": "ListItem",
          position: 2,
          name: "Poets",
          item: `${baseUrl}/poets`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: poet.name,
          item: `${baseUrl}/poet/${poet.slug}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: categoryLabels[category] || "Poems",
          item: collectionUrl,
        },
      ],
    },
    hasPart: poems.map((poem) => ({
      "@type": "CreativeWork",
      name: poem.title?.en || poem.title?.hi || poem.title?.ur || "Untitled",
      description:
        poem.summary?.en || poem.summary?.hi || poem.summary?.ur || "",
      author: {
        "@type": "Person",
        name: poet.name,
      },
      dateCreated: poem.createdAt
        ? new Date(poem.createdAt).toISOString()
        : undefined,
      genre: [poem.category, "Poetry"],
      inLanguage: ["en", "hi", "ur"],
      url: `${baseUrl}/poem/${poem.slug?.en}`,
      image:
        poem.coverImage?.url ||
        poet.profilePicture?.url ||
        `${baseUrl}/placeholder.svg`,
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/ViewAction",
          userInteractionCount: poem.viewsCount || 0,
        },
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/BookmarkAction",
          userInteractionCount: poem.bookmarks?.length || 0,
        },
      ],
    })),
  };
}
