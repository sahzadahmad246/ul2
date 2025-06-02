// src/app/poet/[slug]/[category]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PoetProfileLayout from "@/components/poets/poet-profile-layout";
import PoetWorksContent from "@/components/poets/poet-works-content";
import { generatePoemCollectionStructuredData } from "@/lib/structured-data";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

interface PageProps {
  params: Promise<{ slug: string; category: string }>;
  searchParams: Promise<{ page?: string; sortBy?: string }>;
}

const validCategories = [
  "all-works",
  "ghazal",
  "sher",
  "nazm",
  "top-20",
  "top-20-ghazal",
  "top-20-sher",
];

const categoryLabels: Record<string, string> = {
  "all-works": "All Works",
  ghazal: "Ghazals",
  sher: "Shers",
  nazm: "Nazms",
  "top-20": "Top 20 Poems",
  "top-20-ghazal": "Top 20 Ghazals",
  "top-20-sher": "Top 20 Shers",
};

async function getPoet(slug: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/poets/${slug}`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

async function getPoetWorks(
  slug: string,
  category: string,
  page = 1,
  sortBy = "recent"
) {
  try {
    const apiCategory = category === "all-works" ? "all" : category;
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/poet/${slug}/works?category=${apiCategory}&page=${page}&sortBy=${sortBy}&limit=20`;

    const response = await fetch(url, {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug, category } = await params;
  let page;
  try {
    const resolvedSearchParams = await searchParams;
    page = resolvedSearchParams.page;
  } catch {
    page = "1";
  }

  if (!validCategories.includes(category)) {
    return {
      title: "Category Not Found",
      description: "The requested category could not be found.",
    };
  }

  const poet = await getPoet(slug);
  if (!poet) {
    return {
      title: "Poet Not Found",
      description: "The requested poet profile could not be found.",
    };
  }

  const categoryLabel = categoryLabels[category];
  const pageNum = page ? ` - Page ${page}` : "";
  const title = `${poet.name} - ${categoryLabel}${pageNum} | Poetry Collection`;

  let description = "";
  if (category === "all-works") {
    description = `Browse all poetry works by ${poet.name}. Complete collection of ghazals, shers, nazms and more.`;
  } else if (category.startsWith("top-20")) {
    const type = category === "top-20" ? "poems" : category.split("-")[2] + "s";
    description = `Discover the most popular ${type} by ${poet.name}. Top rated and most viewed poetry collection.`;
  } else {
    description = `Read ${categoryLabel.toLowerCase()} by ${
      poet.name
    }. Beautiful collection of ${category} poetry.`;
  }

  const keywords = `${
    poet.name
  }, ${category}, poetry, ${categoryLabel.toLowerCase()}, urdu poetry, collection`;

  return {
    title,
    description,
    keywords,
    authors: [{ name: poet.name }],
    openGraph: {
      title,
      description,
      type: "website",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/poet/${slug}/${category}`,
      images: poet.profilePicture?.url
        ? [
            {
              url: poet.profilePicture.url,
              width: 400,
              height: 400,
              alt: `${poet.name} profile picture`,
            },
          ]
        : [],
      siteName: "Poetry Collection",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: poet.profilePicture?.url ? [poet.profilePicture.url] : [],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/poet/${slug}/${category}`,
    },
  };
}

// Enable ISR with 1-hour revalidation
export const revalidate = 3600;
// Allow dynamic slugs not pre-generated
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    await dbConnect();
    const poets = await User.find().select("slug").lean();
    const slugs = poets.map((poet) => poet.slug);

    return slugs.flatMap((slug) =>
      validCategories.map((category) => ({
        slug,
        category,
      }))
    );
  } catch {
    // Fallback to a minimal set of paths if database is unavailable
    return validCategories.map((category) => ({
      slug: "default",
      category,
    }));
  }
}

export default async function PoetCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { slug, category } = await params;
  let page, sortBy;
  try {
    const resolvedSearchParams = await searchParams;
    page = resolvedSearchParams.page;
    sortBy = resolvedSearchParams.sortBy;
  } catch {
    page = "1";
    sortBy = "recent";
  }

  if (!validCategories.includes(category)) {
    notFound();
  }

  const poet = await getPoet(slug);
  if (!poet) {
    notFound();
  }

  const pageNum = Number.parseInt(page || "1");
  const sortOption = sortBy || "recent";
  const worksData = await getPoetWorks(slug, category, pageNum, sortOption);

  if (!worksData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Unable to load works for this category. Please try again later.
        </p>
      </div>
    );
  }

  const structuredData = generatePoemCollectionStructuredData(
    poet,
    worksData.poems,
    category
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PoetProfileLayout poet={poet} currentTab={category}>
        <PoetWorksContent
          poet={poet}
          worksData={worksData}
          category={category}
          currentPage={pageNum}
          sortBy={sortOption}
        />
      </PoetProfileLayout>
    </>
  );
}