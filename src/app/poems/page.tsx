// src/app/poems/page.tsx
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import PoemList from "@/components/poems/PoemList";
import { BookOpen } from "lucide-react";
import dbConnect from "@/lib/mongodb";
import Poem from "@/models/Poem";
import { IPoem, SerializedPoem, ContentItem, Bookmark, FAQ } from "@/types/poemTypes";

function serializePoem(poem: IPoem): SerializedPoem {
  return {
    ...poem,
    _id: poem._id.toString(),
    poet: poem.poet
      ? {
          ...poem.poet,
          _id: poem.poet._id.toString(),
          name: poem.poet.name || "Unknown Poet",
          profilePicture: poem.poet.profilePicture || {
            url: "/placeholder.svg?height=64&width=64",
          },
        }
      : { _id: "", name: "Unknown Poet", profilePicture: { url: "/placeholder.svg?height=64&width=64" } },
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
    bookmarks: poem.bookmarks?.map((bookmark: Bookmark) => ({
      ...bookmark,
      userId: bookmark.userId.toString(),
      bookmarkedAt: bookmark.bookmarkedAt.toISOString(),
    })) || [], // Fallback to empty array if undefined
    faqs: poem.faqs.map((faq: FAQ) => ({
      ...faq,
      _id: faq._id ? faq._id.toString() : undefined,
    })),
    createdAt: poem.createdAt.toISOString(),
    updatedAt: poem.updatedAt.toISOString(),
  };
}

export default async function PoemsPage() {
  try {
    await dbConnect();

    const page = 1;
    const limit = 10;
    const poems: IPoem[] = await Poem.find({ status: "published" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("poet", "name slug profilePicture")
      .lean();

    const total = await Poem.countDocuments({ status: "published" });
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };

    if (!poems.length) {
      return (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Card className="mb-8">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl flex items-center justify-center gap-2">
                  <BookOpen className="h-8 w-8" />
                  Poetry Collection
                </CardTitle>
                <p className="text-muted-foreground">
                  Discover beautiful poetry from talented poets around the world
                </p>
              </CardHeader>
            </Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium mb-2">No poems yet</h3>
              <p className="text-muted-foreground">
                Be the first to share your poetry with the world.
              </p>
            </div>
          </div>
        </div>
      );
    }

    const serializedPoems = poems.map(serializePoem);

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl flex items-center justify-center gap-2">
                <BookOpen className="h-8 w-8" />
                Poetry Collection
              </CardTitle>
              <p className="text-muted-foreground">
                Discover beautiful poetry from talented poets around the world
              </p>
            </CardHeader>
          </Card>
          <PoemList initialPoems={serializedPoems} initialPagination={pagination} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in PoemsPage:", error);
    notFound();
  }
}