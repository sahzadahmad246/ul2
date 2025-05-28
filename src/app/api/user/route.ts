import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { configureCloudinary, uploadImageStream, deleteImage } from "@/lib/utils/cloudinary";
import { IUser } from "@/types/userTypes";

export async function GET() {
  try {
    await dbConnect();
    const sessionUser = await getCurrentUser();
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await User.findById(sessionUser.id).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...user,
      _id: user._id.toString(),
      dob: user.dob ? new Date(user.dob).toISOString() : null,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt).toISOString(),
      bookmarks: user.bookmarks?.map((bookmark) => ({
        ...bookmark,
        bookmarkedAt: bookmark.bookmarkedAt ? new Date(bookmark.bookmarkedAt).toISOString() : null,
      })) || [],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await dbConnect();
    const sessionUser = await getCurrentUser();
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(sessionUser.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const dob = formData.get("dob") as string;
    const location = formData.get("location") as string;
    const image = formData.get("image") as File | null;

    // Validate image type and size
    if (image) {
      if (!["image/jpeg", "image/png"].includes(image.type)) {
        return NextResponse.json({ error: "Only JPEG or PNG images are allowed" }, { status: 400 });
      }
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image must be less than 5MB" }, { status: 400 });
      }
    }

    const updateData: Partial<IUser> = {};

    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (dob) updateData.dob = new Date(dob);
    if (location) updateData.location = location;

    if (image) {
      try {
        configureCloudinary();
        // Delete previous image if it exists
        if (user.profilePicture?.publicId) {
          try {
            await deleteImage(user.profilePicture.publicId);
          } catch (error) {
            console.warn(`Failed to delete previous profile picture: ${error}`);
          }
        }
        // Upload new image
        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadResult = await uploadImageStream(buffer, "dx28ql7ig/profiles");
        updateData.profilePicture = {
          publicId: uploadResult.publicId,
          url: uploadResult.url,
        };
      } catch (uploadError) {
        return NextResponse.json(
          { error: `Failed to upload image to Cloudinary: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}` },
          { status: 500 }
        );
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      sessionUser.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...updatedUser,
        _id: updatedUser._id.toString(),
        dob: updatedUser.dob ? new Date(updatedUser.dob).toISOString() : null,
        createdAt: new Date(updatedUser.createdAt).toISOString(),
        updatedAt: new Date(updatedUser.updatedAt).toISOString(),
        bookmarks: updatedUser.bookmarks?.map((bookmark) => ({
          ...bookmark,
          bookmarkedAt: bookmark.bookmarkedAt ? new Date(bookmark.bookmarkedAt).toISOString() : null,
        })) || [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}