import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Poem from "@/models/Poem";
import { FeedItem } from "@/types/poemTypes";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Validate category
    const validCategories = ["poem", "ghazal", "sher", "nazm", "rubai", "marsiya", "qataa", "other"];
    if (!category || !validCategories.includes(category)) {
      
      return NextResponse.json(
        { message: "Invalid or missing category" },
        { status: 400 }
      );
    }

    

    // Fetch poems by category
    const poems = await Poem.find({ category, status: "published" }) // Relaxed poet filter for debugging
      .skip(skip)
      .limit(limit)
      .populate({
        path: "poet",
        select: "name slug profilePicture",
      })
      .select("title content coverImage viewsCount bookmarkCount slug topics category createdAt")
      .lean();

    

    // Filter poems with valid poet and English content
    const validPoems = poems.filter(
      (poem): poem is typeof poem & { poet: { name: string; slug: string; profilePicture?: { publicId?: string; url?: string } } } =>
        poem.poet !== null &&
        poem.poet.name != null &&
        poem.poet.slug != null &&
        poem.content.en &&
        poem.content.en.length > 0
    );

   

    const total = await Poem.countDocuments({ category, status: "published" });

    // Transform poems to FeedItem format (English only)
    const feedItems: FeedItem[] = validPoems.map((poem) => {
      const includeImage = Math.random() < 0.3 && poem.coverImage;
      const randomCoupletIndex = Math.floor(Math.random() * poem.content.en.length);
      const couplet = poem.content.en[randomCoupletIndex]?.couplet || "";

      const feedItem: FeedItem = {
        id: `${poem._id}-en-${randomCoupletIndex}`,
        poemId: poem._id.toString(),
        poet: {
          name: poem.poet.name,
          profilePicture: poem.poet.profilePicture || undefined,
          slug: poem.poet.slug,
        },
        language: "en",
        slug: poem.slug.en,
        couplet,
        coverImage: includeImage ? poem.coverImage : null,
        viewsCount: poem.viewsCount,
        bookmarkCount: poem.bookmarkCount,
        topics: poem.topics,
        category: poem.category,
        createdAt: poem.createdAt ? new Date(poem.createdAt) : undefined,
      };
      return feedItem;
    });

    

    return NextResponse.json({
      items: feedItems,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { message: "Server error", error: errorMessage },
      { status: 500 }
    );
  }
}