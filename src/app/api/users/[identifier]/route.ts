import { NextResponse, NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { adminMiddleware } from "@/lib/middleware/adminMiddleware";
import {
  deleteImage,
  configureCloudinary,
  uploadImageStream,
} from "@/lib/utils/cloudinary";
import { IUser, Role } from "@/types/userTypes";
import { updateProfileSchema } from "@/validators/userValidator";
import { slugifyUser } from "@/lib/slugify";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const authResponse = await adminMiddleware();
    if (authResponse) return authResponse;

    const { identifier } = await params;
    await dbConnect();

    const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isValidObjectId
      ? { $or: [{ _id: identifier }, { slug: identifier }] }
      : { slug: identifier };
    const user = await User.findOne(query).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userResponse: IUser = {
      ...user,
      _id: user._id.toString(),
      dob: user.dob ? new Date(user.dob).toISOString() : undefined,
      createdAt: user.createdAt
        ? new Date(user.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: user.updatedAt
        ? new Date(user.updatedAt).toISOString()
        : new Date().toISOString(),
      bookmarks: user.bookmarks?.length
        ? user.bookmarks.map((bookmark) => ({
            ...bookmark,
            poemId: bookmark.poemId?.toString() || "",
            bookmarkedAt: bookmark.bookmarkedAt
              ? new Date(bookmark.bookmarkedAt).toISOString()
              : new Date().toISOString(),
          }))
        : [],
      poems: user.poems?.length
        ? user.poems.map((poem) => ({
            ...poem,
            poemId: poem.poemId?.toString() || "",
          }))
        : [],
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const authResponse = await adminMiddleware();
    if (authResponse) return authResponse;

    const { identifier } = await params;
    await dbConnect();

    const formData = await req.formData();
    const data = {
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      bio: formData.get("bio") as string,
      dob: formData.get("dob") as string,
      location: formData.get("location") as string,
      image: formData.get("image") as File | null,
    };

    let parsedData;
    try {
      parsedData = updateProfileSchema.parse({
        name: data.name || undefined,
        slug: data.name ? slugifyUser(data.name) : undefined,
        bio: data.bio || undefined,
        dob: data.dob || undefined,
        location: data.location || undefined,
        image: data.image || undefined,
      });
    } catch (validationError) {
      const errorMessage =
        validationError instanceof Error
          ? validationError.message
          : "Invalid data format";
      return NextResponse.json(
        { error: `Validation failed: ${errorMessage}` },
        { status: 400 }
      );
    }

    if (data.role && !["user", "poet", "admin"].includes(data.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isValidObjectId
      ? { $or: [{ _id: identifier }, { slug: identifier }] }
      : { slug: identifier };
    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (parsedData.slug && parsedData.slug !== user.slug) {
      const existingSlug = await User.findOne({
        slug: parsedData.slug,
        _id: { $ne: user._id },
      });
      if (existingSlug) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 }
        );
      }
    }

    const updateData: Partial<IUser> = {};
    if (parsedData.name) updateData.name = parsedData.name;
    if (parsedData.slug) updateData.slug = parsedData.slug;
    if (data.role) updateData.role = data.role as Role;
    if (data.bio) updateData.bio = data.bio;
    if (parsedData.dob) updateData.dob = parsedData.dob;
    if (data.location) updateData.location = data.location;

    if (data.image && data.image.size > 0) {
      if (!["image/jpeg", "image/png"].includes(data.image.type)) {
        return NextResponse.json(
          { error: "Only JPEG or PNG images are allowed" },
          { status: 400 }
        );
      }
      if (data.image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image must be less than 5MB" },
          { status: 400 }
        );
      }
      configureCloudinary();
      const buffer = Buffer.from(await data.image.arrayBuffer());
      const uploadResult = await uploadImageStream(
        buffer,
        "dx28ql7ig/profiles"
      );
      if (!uploadResult.publicId || !uploadResult.url) {
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }
      updateData.profilePicture = {
        publicId: uploadResult.publicId,
        url: uploadResult.url,
      };

      if (user.profilePicture?.publicId) {
        try {
          await deleteImage(user.profilePicture.publicId);
        } catch {}
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      isValidObjectId
        ? { $or: [{ _id: identifier }, { slug: identifier }] }
        : { slug: identifier },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userResponse: IUser = {
      ...updatedUser,
      _id: updatedUser._id.toString(),
      dob: updatedUser.dob
        ? new Date(updatedUser.dob).toISOString()
        : undefined,
      createdAt: new Date(updatedUser.createdAt).toISOString(),
      updatedAt: new Date(updatedUser.updatedAt).toISOString(),
      bookmarks: updatedUser.bookmarks?.length
        ? updatedUser.bookmarks.map((bookmark) => ({
            ...bookmark,
            poemId: bookmark.poemId?.toString() || "",
            bookmarkedAt: bookmark.bookmarkedAt
              ? new Date(bookmark.bookmarkedAt).toISOString()
              : new Date().toISOString(),
          }))
        : [],
      poems: updatedUser.poems?.length
        ? updatedUser.poems.map((poem) => ({
            ...poem,
            poemId: poem.poemId?.toString() || "",
          }))
        : [],
    };

    return NextResponse.json({ user: userResponse }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const authResponse = await adminMiddleware();
    if (authResponse) return authResponse;

    const { identifier } = await params;
    await dbConnect();

    const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const user = await User.findOne(
      isValidObjectId
        ? { $or: [{ _id: identifier }, { slug: identifier }] }
        : { slug: identifier }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.profilePicture?.publicId) {
      try {
        configureCloudinary();
        await deleteImage(user.profilePicture.publicId);
      } catch {}
    }

    await user.deleteOne();

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
