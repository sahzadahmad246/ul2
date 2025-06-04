// src/app/poet/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PoetProfileLayout from "@/components/poets/poet-profile-layout";
import PoetProfileContent from "@/components/poets/poet-profile-content";
import { generatePoetStructuredData } from "@/lib/structured-data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPoet(slug: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/poets/${slug}`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const poet = await getPoet(slug);

  if (!poet) {
    return {
      title: "Poet Not Found | Poetry Collection",
      description: "The requested poet profile could not be found.",
      robots: "noindex", // Prevent indexing of 404 pages
    };
  }

  const title = `${poet.name} - Poet Profile | Poetry Collection`;
  const description = poet.bio
    ? `Discover ${
        poet.name
      }'s poetry collection, including ghazals, shers, and nazms. ${poet.bio.substring(
        0,
        150
      )}...`
    : `Explore ${poet.name}'s poetry, featuring ghazals, shers, nazms, and more on Poetry Collection.`;
  const keywords = [
    poet.name,
    `${poet.name} poetry`,
    `${poet.name} ghazal`,
    `${poet.name} sher`,
    `${poet.name} nazm`,
    "poetry collection",
    "poet biography",
    "ghazal poetry",
    "sher poetry",
    "nazm poetry",
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
      type: "profile",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/poet/${slug}`,
      images: poet.profilePicture?.url
        ? [
            {
              url: poet.profilePicture.url,
              width: 400,
              height: 400,
              alt: `Profile picture of ${poet.name}`,
              type: "image/webp", // Optimize for WebP
            },
          ]
        : [],
      siteName: "Poetry Collection",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: poet.profilePicture?.url ? [poet.profilePicture.url] : [],
      creator: "@PoetryCollection", // Replace with your Twitter handle
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/poet/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/poets`,
      {
        next: { revalidate: 3600 }, // Optional: Add revalidation for ISR
      }
    );
    if (!response.ok) {
      console.error(`Failed to fetch poets: ${response.statusText}`);
      return []; // Fallback to empty array if API call fails
    }
    const poets = await response.json();
    return poets.map((poet: { slug: string }) => ({
      slug: poet.slug,
    }));
  } catch {
    return [{ slug: "default" }]; // Fallback to a default slug to prevent build failure
  }
}

export default async function PoetProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const poet = await getPoet(slug);

  if (!poet) {
    notFound();
  }

  const structuredData = generatePoetStructuredData(poet);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData, null, 0), // Minify JSON-LD
        }}
      />
      <PoetProfileLayout poet={poet} currentTab="profile">
        <PoetProfileContent poet={poet} />
      </PoetProfileLayout>
    </>
  );
}
