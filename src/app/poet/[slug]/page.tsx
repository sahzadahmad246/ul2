import PoetProfile from "@/components/poets/poet-profile";

// Define the interface for the params prop
interface PoetPageProps {
  params: Promise<{ slug: string }>; // Use Promise for params
}

// Use async function to handle the Promise
export default async function PoetPage({ params }: PoetPageProps) {
  // Await the params to resolve the Promise
  const { slug } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <PoetProfile slug={slug} />
    </div>
  );
}