import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import CategoryPoemList from "@/components/poems/CategoryPoemList";
import { BookOpen, Sparkles, Heart } from "lucide-react";
import { FeedItem, Pagination } from "@/types/poemTypes";

export default async function CategoryPoemsPage({ params }: { params: Promise<{ category: string }> }) {
  try {
    const { category } = await params; // Await params to resolve dynamic route parameters
    const page = 1;
    const limit = 10;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const url = `${baseUrl}/api/poems-by-category?category=${category}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      credentials: "include",
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch poems for category: ${response.status} ${response.statusText}`);
    }

    const data = await response.json().catch(() => {
      throw new Error("Invalid response format from category poems API");
    });

    const { items: feedItems, pagination }: { items: FeedItem[]; pagination: Pagination } = data;

    if (!feedItems.length) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          <div className="container mx-auto px-4 py-12 max-w-5xl">
            <Card className="mb-12 border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm shadow-xl">
              <CardHeader className="text-center py-12">
                <div className="relative mb-6">
                  <div className="h-20 w-20 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center shadow-lg">
                    <BookOpen className="h-10 w-10 text-primary" />
                  </div>
                  <Sparkles className="absolute top-2 right-1/3 h-6 w-6 text-primary/60 animate-pulse" />
                  <Heart className="absolute bottom-2 left-1/3 h-5 w-5 text-accent/60 animate-pulse delay-300" />
                </div>
                <CardTitle className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
                  {category.charAt(0).toUpperCase() + category.slice(1)} Poetry
                </CardTitle>
                <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                  Explore beautiful {category} from talented poets
                </p>
              </CardHeader>
            </Card>
            <div className="text-center py-20">
              <div className="text-8xl mb-6">📝</div>
              <h3 className="text-2xl font-bold mb-4">No {category} poems yet</h3>
              <p className="text-muted-foreground text-lg">
                Be the first to share your {category} with the world.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <Card className="mb-12 border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center py-12">
              <div className="relative mb-6">
                <div className="h-20 w-20 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center shadow-lg">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <Sparkles className="absolute top-2 right-1/3 h-6 w-6 text-primary/60 animate-pulse" />
                <Heart className="absolute bottom-2 left-1/3 h-5 w-5 text-accent/60 animate-pulse delay-300" />
              </div>
              <CardTitle className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
                {category.charAt(0).toUpperCase() + category.slice(1)} 
              </CardTitle>
              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                Explore beautiful {category} from talented poets
              </p>
            </CardHeader>
          </Card>
          <CategoryPoemList initialFeedItems={feedItems} initialPagination={pagination} category={category} />
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}