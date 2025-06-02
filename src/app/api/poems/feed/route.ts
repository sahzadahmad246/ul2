import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/mongodb";
import Poem from "@/models/Poem";
import { IPoem, ContentItem } from "@/types/poemTypes";
import User from "@/models/User";
import { IUser } from "@/types/userTypes";
import { authOptions } from "@/lib/auth/authOptions";

type Language = 'en' | 'hi' | 'ur';

interface FeedItem {
  id: string;
  poemId: string;
  poet: {
    name: string;
    profilePicture?: {
      publicId?: string;
      url?: string;
    };
    slug: string;
  };
  language: Language;
  slug: string;
  couplet: string;
  coverImage?: {
    publicId: string;
    url: string;
  } | null;
  viewsCount: number;
  bookmarkCount: number;
  topics: string[];
  category?: IPoem['category'];
  createdAt: string;
}

interface PoemWithPopulatedPoet extends Omit<IPoem, 'poet'> {
  poet: {
    _id: string;
    name: string;
    profilePicture?: {
      publicId?: string;
      url?: string;
    };
    slug: string;
  };
}

interface AggregatedPoem {
  _id: string;
  poet: {
    name: string;
    profilePicture?: {
      publicId?: string;
      url?: string;
    };
    slug: string;
  };
  title: {
    en: string;
    hi: string;
    ur: string;
  };
  content: {
    en: ContentItem[];
    hi: ContentItem[];
    ur: ContentItem[];
  };
  coverImage?: {
    publicId: string;
    url: string;
  };
  viewsCount: number;
  bookmarkCount: number;
  slug: {
    en: string;
    hi: string;
    ur: string;
  };
  topics: string[];
  category?: IPoem['category'];
  createdAt?: Date;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const session = await getServerSession(authOptions);

    let userId: string | null = null;
    let userBookmarks: string[] = [];

    // Get user info if logged in
    if (session?.user?.id) {
      const user = await User.findById<IUser>(session.user.id).select("bookmarks");
      if (user) {
        userId = user._id.toString();
        userBookmarks = user.bookmarks.map(b => b.poemId.toString());
      }
    }

    // Personalized feed algorithm
    let poems: (PoemWithPopulatedPoet | AggregatedPoem)[] = [];
    const total = await Poem.countDocuments({ status: "published" });

    if (userId && userBookmarks.length > 0) {
      const bookmarkedPoems = await Poem.find<IPoem>({
        _id: { $in: userBookmarks }
      }).select("poet topics category");

      const poetIds = [...new Set(bookmarkedPoems.map(p => p.poet?._id.toString()).filter((id): id is string => id != null))];
      const topics = [...new Set(bookmarkedPoems.flatMap(p => p.topics))];

      // Get personalized poems
      const personalizedPoems = await Poem.find<IPoem>({
        status: "published",
        $or: [
          { poet: { $in: poetIds } },
          { topics: { $in: topics } }
        ],
        _id: { $nin: userBookmarks }
      })
      .populate<{ poet: { _id: string; name: string; profilePicture?: { publicId?: string; url?: string }; slug: string } }>("poet", "name profilePicture slug")
      .skip(skip)
      .limit(limit)
      .select("poet title content coverImage viewsCount bookmarkCount slug topics category createdAt")
      .lean();

      poems = personalizedPoems;

      // If not enough personalized poems, fill with random
      if (personalizedPoems.length < limit) {
        const additionalLimit = limit - personalizedPoems.length;
        const randomPoems = await Poem.find<IPoem>({
          status: "published",
          _id: {
            $nin: [...userBookmarks, ...personalizedPoems.map(p => p._id.toString())]
          }
        })
        .populate<{ poet: { _id: string; name: string; profilePicture?: { publicId?: string; url?: string }; slug: string } }>("poet", "name profilePicture slug")
        .limit(additionalLimit)
        .select("poet title content coverImage viewsCount bookmarkCount slug topics category createdAt")
        .lean();

        poems = [...poems, ...randomPoems];
      }
    } else {
      poems = await Poem.aggregate<AggregatedPoem>([
        { $match: { status: "published" } },
        { $sample: { size: limit } },
        { $skip: skip },
        {
          $lookup: {
            from: "users",
            localField: "poet",
            foreignField: "_id",
            as: "poet"
          }
        },
        { $unwind: "$poet" },
        {
          $project: {
            "poet.name": 1,
            "poet.profilePicture": 1,
            "poet.slug": 1,
            title: 1,
            content: 1,
            coverImage: 1,
            viewsCount: 1,
            bookmarkCount: 1,
            slug: 1,
            topics: 1,
            category: 1,
            createdAt: 1
          }
        }
      ]);
    }

    // Transform poems into feed items
    const feedItems: FeedItem[] = [];
    const languages: Language[] = ['en', 'hi', 'ur'];

    for (const poem of poems) {
      for (const lang of languages) {
        const content = poem.content[lang];
        if (content && content.length > 0) {
          const includeImage = Math.random() < 0.3 && poem.coverImage;
          const randomCoupletIndex = Math.floor(Math.random() * content.length);
          const couplet = content[randomCoupletIndex].couplet;

          feedItems.push({
            id: `${poem._id}-${lang}-${randomCoupletIndex}`,
            poemId: poem._id.toString(),
            poet: {
              name: poem.poet.name,
              profilePicture: poem.poet.profilePicture,
              slug: poem.poet.slug,
            },
            language: lang,
            slug: poem.slug[lang],
            couplet,
            coverImage: includeImage ? poem.coverImage : null,
            viewsCount: poem.viewsCount,
            bookmarkCount: poem.bookmarkCount,
            topics: poem.topics,
            category: poem.category,
            createdAt: poem.createdAt ? new Date(poem.createdAt).toISOString() : ""
          });
        }
      }
    }

    // Shuffle feed items to mix languages
    const shuffledItems = shuffleArray(feedItems);

    const response = {
      items: shuffledItems.slice(0, limit),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Server error", error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}