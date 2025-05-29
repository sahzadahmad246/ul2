import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { adminMiddleware } from "@/lib/middleware/adminMiddleware";
import {
  configureCloudinary,
  uploadImageStream,
  deleteImage,
} from "@/lib/utils/cloudinary";
import { signupSchema } from "@/validators/userValidator";
import { Role, IUser } from "@/types/userTypes";
import { slugifyUser } from "@/lib/slugify";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const isAdminRoute =
      req.url.includes("/api/users") && !req.url.includes("/[identifier]");
    if (isAdminRoute) {
      const authResponse = await adminMiddleware();
      if (authResponse) return authResponse;

      await dbConnect();
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;

      const users = await User.find().skip(skip).limit(limit).lean();

      const total = await User.countDocuments();

      return NextResponse.json({
        users: users.map((user) => ({
          ...user,
          _id: user._id.toString(),
          dob: user.dob ? new Date(user.dob).toISOString() : undefined,
          createdAt: new Date(user.createdAt).toISOString(),
          updatedAt: new Date(user.updatedAt).toISOString(),
          bookmarks:
            user.bookmarks?.map((bookmark) => ({
              ...bookmark,
              poemId: bookmark.poemId.toString(),
              bookmarkedAt: bookmark.bookmarkedAt
                ? new Date(bookmark.bookmarkedAt).toISOString()
                : new Date().toISOString(),
            })) || [],
          poems:
            user.poems?.map((poem) => ({
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
        bookmarks:
          user.bookmarks?.map((bookmark) => ({
            ...bookmark,
            poemId: bookmark.poemId.toString(),
            bookmarkedAt: bookmark.bookmarkedAt
              ? new Date(bookmark.bookmarkedAt).toISOString()
              : new Date().toISOString(),
          })) || [],
        poems:
          user.poems?.map((poem) => ({
            ...poem,
            poemId: poem.poemId.toString(),
          })) || [],
      } as IUser);
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
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
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      bio: formData.get("bio") as string,
      location: formData.get("location") as string,
      dob: formData.get("dob") as string,
      image: formData.get("image") as File | null,
    };

    if (!data.email || !data.name) {
      return NextResponse.json(
        { error: "Email and name are required fields" },
        { status: 400 }
      );
    }

    const slug = slugifyUser(data.name);
    const validRoles = ["user", "poet", "admin"];
    if (data.role && !validRoles.includes(data.role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const existingSlug = await User.findOne({ slug });
    if (existingSlug) {
      return NextResponse.json(
        { error: "A user with this name already exists (slug conflict)" },
        { status: 400 }
      );
    }

    let parsedData;
    try {
      parsedData = signupSchema.parse({
        email: data.email,
        name: data.name,
        slug: slug,
        profilePicture: data.image ? {} : undefined,
      });
    } catch (zodError: unknown) {
      const errorMessage =
        zodError instanceof Error ? zodError.message : "Invalid data format";
      return NextResponse.json(
        { error: `Validation failed: ${errorMessage}` },
        { status: 400 }
      );
    }

    let profilePicture: { publicId: string; url: string } | undefined;
    if (data.image && data.image.size > 0) {
      if (!["image/jpeg", "image/png", "image/jpg"].includes(data.image.type)) {
        return NextResponse.json(
          { error: "Only JPEG and PNG images are allowed" },
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
      profilePicture = await uploadImageStream(buffer, "dx28ql7ig/profiles");
    }

    const newUser = new User({
      email: parsedData.email,
      name: parsedData.name,
      slug: parsedData.slug,
      role: (data.role as Role) || "user",
      bio: data.bio || "",
      location: data.location || "",
      dob: data.dob ? new Date(data.dob) : undefined,
      profilePicture,
      bookmarks: [],
      poems: [],
    });

    try {
      await newUser.save();
    } catch (saveError: unknown) {
      if (profilePicture?.publicId) {
        try {
          await deleteImage(profilePicture.publicId);
        } catch {}
      }
      if (
        saveError &&
        typeof saveError === "object" &&
        "code" in saveError &&
        saveError.code === 11000
      ) {
        const mongoError = saveError as { keyPattern?: Record<string, number> };
        const field = Object.keys(mongoError.keyPattern || {})[0] || "field";
        return NextResponse.json(
          { error: `A user with this ${field} already exists` },
          { status: 400 }
        );
      }
      throw saveError;
    }

    const userResponse: IUser = {
      ...newUser.toObject(),
      _id: newUser._id.toString(),
      dob: newUser.dob ? new Date(newUser.dob).toISOString() : undefined,
      createdAt: new Date(newUser.createdAt).toISOString(),
      updatedAt: new Date(newUser.updatedAt).toISOString(),
      bookmarks:
        newUser.bookmarks?.map((bookmark) => ({
          ...bookmark,
          poemId: bookmark.poemId.toString(),
          bookmarkedAt: bookmark.bookmarkedAt
            ? new Date(bookmark.bookmarkedAt).toISOString()
            : new Date().toISOString(),
        })) || [],
      poems:
        newUser.poems?.map((poem) => ({
          ...poem,
          poemId: poem.poemId.toString(),
        })) || [],
    };

    return NextResponse.json(
      { user: userResponse, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
