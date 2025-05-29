import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { IPoet } from "@/types/userTypes";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const users = await User.find({ role: "poet" })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments({ role: "poet" });

    const poetsResponse: IPoet[] = users.map((user) => ({
      ...user,
      _id: user._id.toString(),
      role: "poet",
      dob: user.dob ? new Date(user.dob).toISOString() : undefined,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt).toISOString(),
      bookmarks: user.bookmarks?.length
        ? user.bookmarks.map((bookmark) => ({
            poemId: bookmark.poemId?.toString() || "",
            bookmarkedAt: bookmark.bookmarkedAt
              ? new Date(bookmark.bookmarkedAt).toISOString()
              : new Date().toISOString(),
          }))
        : [],
      poems: user.poems?.length
        ? user.poems.map((poem) => ({
            poemId: poem.poemId?.toString() || "",
          }))
        : [],
    }));

    return NextResponse.json({
      poets: poetsResponse,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}