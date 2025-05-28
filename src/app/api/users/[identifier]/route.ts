import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { adminMiddleware } from "@/lib/middleware/adminMiddleware";
import { deleteImage, configureCloudinary, uploadImageStream } from "@/lib/utils/cloudinary";
import { IUser, Role } from "@/types/userTypes";
import { signupSchema } from "@/validators/userValidator";
import { slugifyUser } from "@/lib/slugify";

export async function GET(req: NextRequest, { params }: { params: Promise<{ identifier: string }> }) {
  try {
    const authResponse = await adminMiddleware();
    if (authResponse) return authResponse;

    const { identifier } = await params; // Resolve the Promise

    await dbConnect();
    const user = await User.findOne({
      $or: [{ _id: identifier }, { slug: identifier }],
    }).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userResponse: IUser = {
      ...user,
      _id: user._id.toString(),
      dob: user.dob ? new Date(user.dob).toISOString() : undefined,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt).toISOString(),
      bookmarks: user.bookmarks?.map((bookmark) => ({
        ...bookmark,
        poemId: bookmark.poemId.toString(),
        bookmarkedAt: bookmark.bookmarkedAt
          ? new Date(bookmark.bookmarkedAt).toISOString()
          : new Date().toISOString(),
      })) || [],
      poems: user.poems?.map((poem) => ({
        ...poem,
        poemId: poem.poemId.toString(),
      })) || [],
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ identifier: string }> }) {
  try {
    const authResponse = await adminMiddleware();
    if (authResponse) return authResponse;

    const { identifier } = await params; // Resolve the Promise

    await dbConnect();
    const formData = await req.formData();
    const data = {
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      bio: formData.get("bio") as string,
      dob: formData.get("dob") as string,
      location: formData.get("location") as string,
      image: formData.get("image") as File | null,
    };

    // Validate input
    const parsedData = signupSchema.partial().parse({
      email: data.email || undefined,
      name: data.name || undefined,
      slug: data.name ? slugifyUser(data.name) : undefined,
      profilePicture: data.image ? {} : undefined,
    });

    // Validate role if provided
    if (data.role && !["user", "poet", "admin"].includes(data.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Find the user by ID or slug
    const user = await User.findOne({
      $or: [{ _id: identifier }, { slug: identifier }],
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for email conflict (if email is being updated)
    if (parsedData.email && parsedData.email !== user.email) {
      if (await User.findOne({ email: parsedData.email, _id: { $ne: user._id } })) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: Partial<IUser> = {};

    if (parsedData.email) updateData.email = parsedData.email;
    if (parsedData.name) updateData.name = parsedData.name;
    if (parsedData.slug) updateData.slug = parsedData.slug;
    if (data.role) updateData.role = data.role as Role;
    if (data.bio) updateData.bio = data.bio;
    if (data.dob) updateData.dob = new Date(data.dob);
    if (data.location) updateData.location = data.location;

    // Handle profile picture update
    if (data.image) {
      if (!["image/jpeg", "image/png"].includes(data.image.type)) {
        return NextResponse.json({ error: "Only JPEG or PNG images are allowed" }, { status: 400 });
      }
      if (data.image.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image must be less than 5MB" }, { status: 400 });
      }
      configureCloudinary();
      const buffer = Buffer.from(await data.image.arrayBuffer());
      const uploadResult = await uploadImageStream(buffer, "dx28ql7ig/profiles");
      if (!uploadResult.publicId || !uploadResult.url) {
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
      }
      updateData.profilePicture = {
        publicId: uploadResult.publicId,
        url: uploadResult.url,
      };

      // Delete old profile picture if it exists
      if (user.profilePicture?.publicId) {
        try {
          await deleteImage(user.profilePicture.publicId);
        } catch (error) {
          console.warn(`Failed to delete previous profile picture: ${error}`);
        }
      }
    }

    // Update user
    const updatedUser = await User.findOneAndUpdate(
      { $or: [{ _id: identifier }, { slug: identifier }] },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userResponse: IUser = {
      ...updatedUser,
      _id: updatedUser._id.toString(),
      dob: updatedUser.dob ? new Date(updatedUser.dob).toISOString() : undefined,
      createdAt: new Date(updatedUser.createdAt).toISOString(),
      updatedAt: new Date(updatedUser.updatedAt).toISOString(),
      bookmarks: updatedUser.bookmarks?.map((bookmark) => ({
        ...bookmark,
        poemId: bookmark.poemId.toString(),
        bookmarkedAt: bookmark.bookmarkedAt
          ? new Date(bookmark.bookmarkedAt).toISOString()
          : new Date().toISOString(),
      })) || [],
      poems: updatedUser.poems?.map((poem) => ({
        ...poem,
        poemId: poem.poemId.toString(),
      })) || [],
    };

    return NextResponse.json({ user: userResponse }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ identifier: string }> }) {
  try {
    const authResponse = await adminMiddleware();
    if (authResponse) return authResponse;

    const { identifier } = await params; // Resolve the Promise

    await dbConnect();
    const user = await User.findOne({
      $or: [{ _id: identifier }, { slug: identifier }],
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete profile picture from Cloudinary if it exists
    if (user.profilePicture?.publicId) {
      await deleteImage(user.profilePicture.publicId);
    }

    await user.deleteOne();

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}