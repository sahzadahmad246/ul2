import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Poem  from "@/models/Poem";
import { IPoem } from "@/types/poemTypes";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import mongoose, { FilterQuery } from "mongoose";

// Define the schema for query parameters
const searchSchema = z.object({
  query: z.string().min(1, "Search query is required").trim(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  language: z.enum(["en", "hi", "ur"]).optional(),
});

// Define type for regex-based query conditions
interface RegexCondition {
  $regex: string;
  $options: string;
}

// Define type for Poem search conditions using FilterQuery
type PoemSearchConditions = FilterQuery<IPoem> & {
  status: string;
  $or: Array<
    | { [key in `title.${"en" | "hi" | "ur"}`]?: RegexCondition }
    | { [key in `content.${"en" | "hi" | "ur"}.couplet`]?: RegexCondition }
    | { [key in `content.${"en" | "hi" | "ur"}.meaning`]?: RegexCondition }
    | { topics: RegexCondition }
    | { category: RegexCondition }
    | { poet: { $in: mongoose.Types.ObjectId[] } }
  >;
  poet?: { $in: mongoose.Types.ObjectId[] };
};

// Define interface for MongoDB query conditions for users
interface UserSearchConditions {
  $or: Array<{
    [key in "name" | "bio" | "email"]?: RegexCondition;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    // Parse and validate query parameters
    const url = new URL(req.url);
    const queryParams = {
      query: url.searchParams.get("query") || "",
      page: url.searchParams.get("page") || "1",
      limit: url.searchParams.get("limit") || "10",
      language: url.searchParams.get("language") || undefined,
    };

    const parsedParams = searchSchema.safeParse(queryParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        { message: "Invalid query parameters", errors: parsedParams.error.errors },
        { status: 400 }
      );
    }

    const { query, page, limit, language } = parsedParams.data;
    const skip = (page - 1) * limit;

    // Connect to MongoDB
    await dbConnect();

    // Get session for potential admin checks
    const session = await getServerSession(authOptions);

    // Build search conditions for poems
    const poemSearchConditions: PoemSearchConditions = {
      status: "published",
      $or: [
        { [`title.${language || "en"}`]: { $regex: query, $options: "i" } },
        { [`content.${language || "en"}.couplet`]: { $regex: query, $options: "i" } },
        { [`content.${language || "en"}.meaning`]: { $regex: query, $options: "i" } },
        { topics: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    };

    // Optionally search by poet name (requires joining with User model)
    if (session?.user?.role === "admin") {
      const poetIds = await User.find({ name: { $regex: query, $options: "i" } })
        .distinct("_id")
        .lean()
        .then((ids) => ids.map((id) => new mongoose.Types.ObjectId(id)));
      poemSearchConditions.$or.push({
        poet: { $in: poetIds },
      });
    }

    // Search poems
    const poems = await Poem.find(poemSearchConditions)
      .skip(skip)
      .limit(limit)
      .populate("poet", "name slug profilePicture")
      .select("title slug content summary topics category poet coverImage viewsCount bookmarkCount createdAt")
      .lean();

    const totalPoems = await Poem.countDocuments(poemSearchConditions);

    // Build search conditions for users
    const userSearchConditions: UserSearchConditions = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
      ],
    };

    // Include email search only for admins
    if (session?.user?.role === "admin") {
      userSearchConditions.$or.push({ email: { $regex: query, $options: "i" } });
    }

    // Search users
    const users = await User.find(userSearchConditions)
      .skip(skip)
      .limit(limit)
      .select("name slug profilePicture role bio poemCount createdAt")
      .lean();

    const totalUsers = await User.countDocuments(userSearchConditions);

    // Return combined results
    return NextResponse.json({
      poems: {
        results: poems,
        pagination: {
          page,
          limit,
          total: totalPoems,
          pages: Math.ceil(totalPoems / limit),
        },
      },
      users: {
        results: users,
        pagination: {
          page,
          limit,
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit),
        },
      },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { message: "Server error", error: "Unknown error" },
      { status: 500 }
    );
  }
}