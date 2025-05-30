import type { Metadata } from "next"
import { notFound } from "next/navigation"
import PoetProfileLayout from "@/components/poets/poet-profile-layout"
import PoetProfileContent from "@/components/poets/poet-profile-content"
import { generatePoetStructuredData } from "@/lib/structured-data"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getPoet(slug: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/poets/${slug}`, {
      
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching poet:", error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const poet = await getPoet(slug)

  if (!poet) {
    return {
      title: "Poet Not Found",
      description: "The requested poet profile could not be found.",
    }
  }

  const title = `${poet.name} - Poet Profile | Poetry Collection`
  const description = poet.bio
    ? `Discover ${poet.name}'s poetry collection. ${poet.bio.substring(0, 150)}...`
    : `Explore the complete poetry collection of ${poet.name}. Read ghazals, shers, nazms and more.`

  return {
    title,
    description,
    keywords: `${poet.name}, poetry, ghazal, sher, nazm, urdu poetry, poet profile`,
    authors: [{ name: poet.name }],
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
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/poet/${slug}`,
    },
  }
}

export default async function PoetProfilePage({ params }: PageProps) {
  const { slug } = await params
  const poet = await getPoet(slug)

  if (!poet) {
    notFound()
  }

  const structuredData = generatePoetStructuredData(poet)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PoetProfileLayout poet={poet} currentTab="profile">
        <PoetProfileContent poet={poet} />
      </PoetProfileLayout>
    </>
  )
}
