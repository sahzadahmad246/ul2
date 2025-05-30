import { IPoet } from "@/types/userTypes";
import { IPoem } from "@/types/poemTypes";

export function generatePoetStructuredData(poet: IPoet) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: poet.name,
    alternateName: poet.slug,
    description: poet.bio || `Poet and writer ${poet.name}`,
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/poet/${poet.slug}`,
    image: poet.profilePicture?.url || "",
    sameAs: [],
    jobTitle: "Poet",
    worksFor: {
      "@type": "Organization",
      name: "Poetry Collection",
    },
    address: poet.location
      ? {
          "@type": "PostalAddress",
          addressLocality: poet.location,
        }
      : undefined,
    email: poet.email,
    dateCreated: poet.createdAt,
    numberOfWorks: poet.poemCount || 0,
    genre: ["Poetry", "Urdu Literature", "Ghazal", "Nazm", "Sher"],
  };
}

export function generatePoemCollectionStructuredData(poet: IPoet, poems: IPoem[], category: string) {
  const categoryLabels: Record<string, string> = {
    "all-works": "Complete Poetry Collection",
    ghazal: "Ghazal Collection",
    sher: "Sher Collection",
    nazm: "Nazm Collection",
    "top-20": "Top 20 Poems",
    "top-20-ghazal": "Top 20 Ghazals",
    "top-20-sher": "Top 20 Shers",
  };

  return {
    "@context": "https://schema.org",
    "@type": "Collection",
    name: `${categoryLabels[category]} by ${poet.name}`,
    description: `A collection of ${category === "all-works" ? "poetry works" : category.replace("-", " ")} by ${poet.name}`,
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/poet/${poet.slug}/${category}`,
    creator: {
      "@type": "Person",
      name: poet.name,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/poet/${poet.slug}`,
    },
    numberOfItems: poems.length,
    genre: ["Poetry", "Urdu Literature"],
    inLanguage: "ur",
    hasPart: poems.map((poem) => ({
      "@type": "CreativeWork",
      name: poem.title.en, // Specify language for title
      author: {
        "@type": "Person",
        name: poet.name,
      },
      dateCreated: poem.createdAt,
      genre: poem.category,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/poem/${poem.slug.en}`, // Specify language for slug
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