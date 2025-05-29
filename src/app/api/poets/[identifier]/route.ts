import { NextResponse, NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { IPoet } from "@/types/userTypes";

export async function GET(req: NextRequest, { params }: { params: Promise<{ identifier: string }> }) {
  try {
    await dbConnect();

    const { identifier } = await params;

    const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isValidObjectId
      ? { $or: [{ _id: identifier }, { slug: identifier }], role: "poet" }
      : { slug: identifier, role: "poet" };

    const user = await User.findOne(query).lean();

    if (!user) {
      return NextResponse.json({ error: "Poet not found" }, { status: 404 });
    }

    const poetResponse: IPoet = {
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
    };

    return NextResponse.json(poetResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}