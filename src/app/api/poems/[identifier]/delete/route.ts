// source: src/app/api/poems/[identifier]/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Poem from "@/models/Poem";
import User from "@/models/User";
import { authOptions } from "@/lib/auth/authOptions";
import { deleteImage } from "@/lib/utils/cloudinary";

// Define the RouteParams interface with params as a Promise
interface RouteParams {
  params: Promise<{ identifier: string }>;
}

export async function DELETE(
  req: NextRequest,
  context: RouteParams
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Await the params to resolve the Promise
    const { identifier } = await context.params;
    const poem = Types.ObjectId.isValid(identifier)
      ? await Poem.findById(identifier)
      : await Poem.findOne({
          $or: [
            { "slug.en": identifier },
            { "slug.hi": identifier },
            { "slug.ur": identifier },
          ],
        });

    if (!poem) {
      return NextResponse.json({ message: "Poem not found" }, { status: 404 });
    }

    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user is authorized to delete the poem
    if (!poem.poet && currentUser.role !== "admin") {
      // If no poet is set, only admins can delete
      return NextResponse.json({ message: "Forbidden: Only admins can delete poems without an owner" }, { status: 403 });
    } else if (poem.poet && poem.poet.toString() !== session.user.id && currentUser.role !== "admin") {
      // If poet exists, only the poet or admins can delete
      return NextResponse.json({ message: "Forbidden: Only the poet or admins can delete this poem" }, { status: 403 });
    }

    // Delete cover image from Cloudinary if it exists
    if (poem.coverImage?.publicId) {
      try {
        await deleteImage(poem.coverImage.publicId);
      } catch (error) {
        console.error(`Failed to delete cover image: ${error instanceof Error ? error.message : "Unknown error"}`);
        // Continue with deletion even if image deletion fails
      }
    }

    // Update the User's poems array and poemCount if poet exists
    if (poem.poet) {
      await User.updateOne(
        { _id: poem.poet },
        { $pull: { poems: { poemId: poem._id } }, $inc: { poemCount: -1 } }
      );
    }

    // Delete the poem
    await Poem.deleteOne({ _id: poem._id });

    return NextResponse.json({ message: "Poem deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}