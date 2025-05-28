// src/app/api/poems/bookmark/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Poem from "@/models/Poem";
import User from "@/models/User";
import { authOptions } from "@/lib/auth/authOptions";
import { bookmarkPoemSchema } from "@/validators/poemValidator";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = bookmarkPoemSchema.parse(body);

    const poem = await Poem.findById(validatedData.poemId);
    if (!poem) {
      return NextResponse.json({ message: "Poem not found" }, { status: 404 });
    }

    const user = await User.findById(validatedData.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (validatedData.userId !== session.user.id && user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden: Cannot bookmark for another user" }, { status: 403 });
    }

    if (validatedData.action === "add") {
      if (
        !poem.bookmarks.some((b) => b.userId.toString() === validatedData.userId) &&
        !user.bookmarks.some((b) => b.poemId.toString() === validatedData.poemId)
      ) {
        await Poem.updateOne(
          { _id: validatedData.poemId },
          { $push: { bookmarks: { userId: validatedData.userId, bookmarkedAt: new Date() } }, $inc: { bookmarkCount: 1 } }
        );
        await User.updateOne(
          { _id: validatedData.userId },
          { $push: { bookmarks: { poemId: validatedData.poemId, bookmarkedAt: new Date() } } }
        );
        return NextResponse.json({ message: "Poem bookmarked successfully" });
      }
      return NextResponse.json({ message: "Poem already bookmarked" }, { status: 400 });
    } else {
      await Poem.updateOne(
        { _id: validatedData.poemId },
        { $pull: { bookmarks: { userId: validatedData.userId } }, $inc: { bookmarkCount: -1 } }
      );
      await User.updateOne(
        { _id: validatedData.userId },
        { $pull: { bookmarks: { poemId: validatedData.poemId } } }
      );
      return NextResponse.json({ message: "Poem unbookmarked successfully" });
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}