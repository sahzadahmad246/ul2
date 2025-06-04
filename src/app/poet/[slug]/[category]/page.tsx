// src/app/poet/[slug]/[category]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Head from "next/head";
import PoetProfileLayout from "@/components/poets/poet-profile-layout";
import PoetWorksContent from "@/components/poets/poet-works-content";
import { generatePoemCollectionStructuredData } from "@/lib/structured-data";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// Define baseUrl using environment variables
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://unmatchedlines.com"
    : "http://localhost:3000");

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
    const response = await fetch(`${baseUrl}/api/poets/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function getPoetWorks(
  slug: string,
  category: string,
  page: number = 1,
  sortBy: string = "recent"
) {
  try {
    const apiCategory = category === "all-works" ? "all" : category;
    const url = `${baseUrl}/api/poet/${slug}/works?category=${apiCategory}&page=${page}&sortBy=${sortBy}&limit=20`;
    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
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
  let page: string;
  try {
    const resolvedSearchParams = await searchParams;
    page = resolvedSearchParams.page ?? "1";
  } catch {
    page = "1";
  }

  if (!validCategories.includes(category)) {
    return {
      title: "Category Not Found | Unmatched Lines",
      description: "The requested category could not be found.",
      robots: "noindex",
    };
  }

  const poet = await getPoet(slug);
  if (!poet) {
    return {
      title: "Poet Not Found | Unmatched Lines",
      description: "The requested poet profile could not be found.",
      robots: "noindex",
    };
  }

  const categoryLabel = categoryLabels[category];
  const pageNum = parseInt(page, 10);
  const title = `${poet.name} - ${categoryLabel}${
    pageNum > 1 ? ` - Page ${pageNum}` : ""
  } | Unmatched Lines`;
  let description = "";
  if (category === "all-works") {
    description = `Browse all poetry by ${poet.name}, including ghazals, shers, and nazms in English, Hindi, and Urdu on Unmatched Lines.`;
  } else if (category.startsWith("top-20")) {
    const type = category === "top-20" ? "poems" : category.split("-")[2] + "s";
    description = `Discover ${poet.name}'s top ${type}, the most popular poetry in English, Hindi, and Urdu on Unmatched Lines.`;
  } else {
    description = `Read ${
      poet.name
    }'s ${categoryLabel.toLowerCase()}, a beautiful collection of ${category} poetry in English, Hindi, and Urdu on Unmatched Lines.`;
  }

  const keywords = [
    `${poet.name} ${categoryLabel.toLowerCase()}`,
    `${poet.name} poetry`,
    categoryLabel.toLowerCase(),
    "poetry collection",
    `${categoryLabel.toLowerCase()} poems`,
    "urdu poetry",
    "hindi poetry",
    "english poetry",
    `poet ${category}`,
  ].join(", ");

  return {
    title,
    description,
    keywords,
    authors: [{ name: poet.name }],
    robots: "index, follow",
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}/poet/${slug}/${category}${
        pageNum > 1 ? `?page=${pageNum}` : ""
      }`,
      images: poet.profilePicture?.url
        ? [
            {
              url: poet.profilePicture.url,
              width: 400,
              height: 400,
              alt: `${poet.name}'s ${categoryLabel} collection`,
              type: "image/webp",
            },
          ]
        : [],
      siteName: "Unmatched Lines",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: poet.profilePicture?.url ? [poet.profilePicture.url] : [],
      creator: "@UnmatchedLines",
    },
    alternates: {
      canonical: `${baseUrl}/poet/${slug}/${category}${
        pageNum > 1 ? `?page=${pageNum}` : ""
      }`,
      languages: {
        "en-US": `${baseUrl}/poet/${slug}/${category}${
          pageNum > 1 ? `?page=${pageNum}` : ""
        }`,
        "hi-IN": `${baseUrl}/hi/poet/${slug}/${category}${
          pageNum > 1 ? `?page=${pageNum}` : ""
        }`,
        "ur-PK": `${baseUrl}/ur/poet/${slug}/${category}${
          pageNum > 1 ? `?page=${pageNum}` : ""
        }`,
      },
    },
  };
}

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    await dbConnect();
    const poets = await User.find({ role: "poet" }).select("slug").lean();
    const slugs = poets.map((poet) => poet.slug);
    return slugs.flatMap((slug) =>
      validCategories.map((category) => ({
        slug,
        category,
      }))
    );
  } catch {
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
  let page: string, sortBy: string;
  try {
    const resolvedSearchParams = await searchParams;
    page = resolvedSearchParams.page ?? "1";
    sortBy = resolvedSearchParams.sortBy ?? "recent";
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

  const pageNum = parseInt(page, 10);
  const worksData = await getPoetWorks(slug, category, pageNum, sortBy);

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
      <Head>
        {pageNum > 1 && (
          <link
            rel="prev"
            href={`${baseUrl}/poet/${slug}/${category}?page=${pageNum - 1}`}
          />
        )}
        {worksData.total > pageNum * 20 && (
          <link
            rel="next"
            href={`${baseUrl}/poet/${slug}/${category}?page=${pageNum + 1}`}
          />
        )}
      </Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData, null, 0),
        }}
      />
      <PoetProfileLayout poet={poet} currentTab={category}>
        <PoetWorksContent
          poet={poet}
          worksData={worksData}
          category={category}
          currentPage={pageNum}
          sortBy={sortBy}
        />
      </PoetProfileLayout>
    </>
  );
}