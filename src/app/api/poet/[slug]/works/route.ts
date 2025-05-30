import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Poem from "@/models/Poem";
import User from "@/models/User";
import { IPoem, Bookmark } from "@/types/poemTypes";
import { FilterQuery } from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") || "all";
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "recent"; // recent, top, views

    // Find poet by slug
    const poet = await User.findOne({ slug }).select("_id name");
    if (!poet) {
      return NextResponse.json({ error: "Poet not found" }, { status: 404 });
    }

    // Build query
    let query: FilterQuery<IPoem> = {
      poet: poet._id,
      status: "published",
    };

    // Add category filter
    if (category !== "all") {
      if (category === "top20") {
        // Top 20 across all categories
        query = { ...query };
      } else if (category.startsWith("top20-")) {
        // Top 20 of specific category
        const specificCategory = category.replace("top20-", "");
        query.category = specificCategory;
      } else {
        query.category = category;
      }
    }

    // Build sort criteria
    let sortCriteria: { [key: string]: 1 | -1 } = {};
    if (sortBy === "top" || category.startsWith("top20")) {
      sortCriteria = { viewsCount: -1, createdAt: -1 };
    } else if (sortBy === "views") {
      sortCriteria = { viewsCount: -1 };
    } else {
      sortCriteria = { createdAt: -1 };
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Fetch poems with pagination
    const poems = await Poem.find(query)
      .populate("poet", "name slug profilePicture")
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Poem.countDocuments(query);
    const pages = Math.ceil(total / limit);

    // Serialize poems
    const serializedPoems = poems.map((poem: IPoem) => ({
      ...poem,
      _id: poem._id.toString(),
      poet: poem.poet
        ? {
            ...poem.poet,
            _id: poem.poet._id.toString(),
          }
        : null,
      createdAt: poem.createdAt.toISOString(),
      updatedAt: poem.updatedAt.toISOString(),
      bookmarks: Array.isArray(poem.bookmarks)
        ? poem.bookmarks.map((bookmark: Bookmark) => ({
            userId: bookmark.userId.toString(),
            bookmarkedAt: bookmark.bookmarkedAt.toISOString(),
          }))
        : [], // Fallback to empty array if bookmarks is undefined or not an array
    }));

    return NextResponse.json({
      poems: serializedPoems,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
      category,
      sortBy,
    });
  } catch (error) {
    console.error("Error fetching poet works:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}