import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { adminMiddleware } from "@/lib/middleware/adminMiddleware";
import { getCurrentUser } from "@/lib/auth/session";
import { configureCloudinary, uploadImageStream, deleteImage } from "@/lib/utils/cloudinary";
import { signupSchema } from "@/validators/userValidator";
import { Role, IUser } from "@/types/userTypes";
import { slugifyUser } from "@/lib/slugify";

export async function GET(req: NextRequest) {
  try {
    const isAdminRoute = req.url.includes("/api/users") && !req.url.includes("/[identifier]");
    if (isAdminRoute) {
      const authResponse = await adminMiddleware();
      if (authResponse) return authResponse;

      await dbConnect();
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;

      const users = await User.find()
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await User.countDocuments();

      return NextResponse.json({
        users: users.map((user) => ({
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
              : new Date().toISOString(), // Fallback to current date if bookmarkedAt is null/undefined
          })) || [],
          poems: user.poems?.map((poem) => ({
            ...poem,
            poemId: poem.poemId.toString(),
          })) || [],
        })) as IUser[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } else {
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
        dob: user.dob ? new Date(user.dob).toISOString() : undefined,
        createdAt: new Date(user.createdAt).toISOString(),
        updatedAt: new Date(user.updatedAt).toISOString(),
        bookmarks: user.bookmarks?.map((bookmark) => ({
          ...bookmark,
          poemId: bookmark.poemId.toString(),
          bookmarkedAt: bookmark.bookmarkedAt
            ? new Date(bookmark.bookmarkedAt).toISOString()
            : new Date().toISOString(), // Fallback to current date
        })) || [],
        poems: user.poems?.map((poem) => ({
          ...poem,
          poemId: poem.poemId.toString(),
        })) || [],
      } as IUser);
    }
  } catch (error) {
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResponse = await adminMiddleware();
    if (authResponse) return authResponse;

    await dbConnect();
    const formData = await req.formData();
    const data = {
      googleId: formData.get("googleId") as string,
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      bio: formData.get("bio") as string,
      dob: formData.get("dob") as string,
      location: formData.get("location") as string,
      image: formData.get("image") as File | null,
    };

    // Validate input
    const parsedData = signupSchema.parse({
      googleId: data.googleId || undefined,
      email: data.email,
      name: data.name,
      slug: data.name ? slugifyUser(data.name) : undefined,
      profilePicture: data.image ? {} : undefined,
    });

    // Validate role
    if (data.role && !["user", "poet", "admin"].includes(data.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check for existing email
    if (await User.findOne({ email: parsedData.email })) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    let profilePicture: { publicId: string; url: string } | undefined;
    if (data.image) {
      if (!["image/jpeg", "image/png"].includes(data.image.type)) {
        return NextResponse.json({ error: "Only JPEG or PNG images are allowed" }, { status: 400 });
      }
      if (data.image.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image must be less than 5MB" }, { status: 400 });
      }
      configureCloudinary();
      const buffer = Buffer.from(await data.image.arrayBuffer());
      profilePicture = await uploadImageStream(buffer, "dx28ql7ig/profiles");
    }

    const newUser = new User({
      ...parsedData,
      role: (data.role as Role) || "poet",
      bio: data.bio,
      dob: data.dob ? new Date(data.dob) : undefined,
      location: data.location,
      profilePicture,
      bookmarks: [], // Ensure bookmarks is empty to avoid null bookmarkedAt
    });

    try {
      await newUser.save();
    } catch (error) {
      // Rollback Cloudinary upload if user save fails
      if (profilePicture?.publicId) {
        await deleteImage(profilePicture.publicId);
      }
      throw error;
    }

    const userResponse: IUser = {
      ...newUser.toObject(),
      _id: newUser._id.toString(),
      dob: newUser.dob ? new Date(newUser.dob).toISOString() : undefined,
      createdAt: new Date(newUser.createdAt).toISOString(),
      updatedAt: new Date(newUser.updatedAt).toISOString(),
      bookmarks: newUser.bookmarks?.map((bookmark) => ({
        ...bookmark,
        poemId: bookmark.poemId.toString(),
        bookmarkedAt: bookmark.bookmarkedAt
          ? new Date(bookmark.bookmarkedAt).toISOString()
          : new Date().toISOString(), // Fallback to current date
      })) || [],
      poems: newUser.poems?.map((poem) => ({
        ...poem,
        poemId: poem.poemId.toString(),
      })) || [],
    };

    return NextResponse.json({ user: userResponse }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}