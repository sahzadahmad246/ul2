import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Poem from "@/models/Poem";
import { authOptions } from "@/lib/auth";
import { updateProfileSchema } from "@/validators/userValidator";
import { IUser } from "@/types/userTypes";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import mongoose from "mongoose";

const ALLOWED_INTERESTS = ["love", "nature", "history", "philosophy", "spirituality", "life"] as const;
type AllowedInterest = typeof ALLOWED_INTERESTS[number];

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface FormDataObject {
  [key: string]: string | string[] | File | null;
}

// Function to create automatic collections based on interests, likes, and bookmarks
async function createAutomaticCollections(user: IUser) {
  const collectionsToCreate = new Set<string>();

  // Add interests to collections
  user.interests?.forEach((interest) => collectionsToCreate.add(interest));

  // Get poems from likes and bookmarks
  const poemIds = [
    ...user.likedPoems.map((p) => p.poemId),
    ...user.bookmarks.map((b) => b.poemId),
  ];

  // Fetch poems to get their tags
  const poems = await Poem.find({ _id: { $in: poemIds } }).select("tags").lean();

  // Add poem tags to collections
  poems.forEach((poem) => {
    poem.topics?.forEach((tag: string) => {
      if (ALLOWED_INTERESTS.includes(tag as AllowedInterest)) {
        collectionsToCreate.add(tag);
      }
    });
  });

  // Create or update collections
  const newCollections = await Promise.all(
    Array.from(collectionsToCreate).map(async (tag) => {
      // Fetch poems that match the tag
      const matchingPoems = await Poem.find({
        _id: { $in: poemIds },
        tags: tag,
      }).select("_id").lean();

      return {
        name: tag.charAt(0).toUpperCase() + tag.slice(1),
        description: `Automatically generated collection for ${tag} poems`,
        poems: matchingPoems.map((poem) => poem._id),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    })
  );

  return newCollections;
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const body: FormDataObject = {};
    formData.forEach((value, key) => {
      if (key === "interests" || key === "addBookmark" || key === "removeBookmark") {
        try {
          body[key] = typeof value === "string" ? JSON.parse(value) : value;
        } catch {
          // Silently handle parsing error
        }
      } else {
        body[key] = value;
      }
    });
    const image = formData.get("image") as File | null;

    const validatedData = updateProfileSchema.parse({ ...body, image });

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updates: Partial<IUser> = {};
    if (validatedData.name) updates.name = validatedData.name;
    if (validatedData.bio) updates.bio = validatedData.bio;
    if (validatedData.dob) updates.dob = validatedData.dob;
    if (validatedData.dateOfDeath) updates.dateOfDeath = validatedData.dateOfDeath;
    if (validatedData.location) updates.location = validatedData.location;
    if (validatedData.interests) updates.interests = validatedData.interests;

    // Handle bookmark operations
    if (validatedData.addBookmark) {
      const poemId = new mongoose.Types.ObjectId(validatedData.addBookmark);
      // Check if poem exists
      const poem = await Poem.findById(poemId);
      if (!poem) {
        return NextResponse.json({ message: "Poem not found" }, { status: 404 });
      }
      if (!user.bookmarks.some((b) => b.poemId.equals(poemId))) {
        user.bookmarks.push({ poemId, bookmarkedAt: new Date() });
      }
    }

    if (validatedData.removeBookmark) {
      const poemId = new mongoose.Types.ObjectId(validatedData.removeBookmark);
      user.bookmarks = user.bookmarks.filter((b) => !b.poemId.equals(poemId));
    }

    // Handle image upload
    if (validatedData.image) {
      try {
        // Delete old image from Cloudinary if it exists
        if (user.profilePicture?.publicId) {
          const destroyResult = await cloudinary.uploader.destroy(user.profilePicture.publicId, {
            resource_type: "image",
          });
          if (destroyResult.result !== "ok") {
            throw new Error("Failed to delete previous image from Cloudinary");
          }
        }

        // Upload new image to Cloudinary
        const buffer = Buffer.from(await validatedData.image.arrayBuffer());
        const stream = Readable.from(buffer);
        const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "unmatchedlines/profiles", resource_type: "image" },
            (error, result) => {
              if (error || !result) reject(error || new Error("Upload failed"));
              else resolve({ secure_url: result.secure_url, public_id: result.public_id });
            }
          );
          stream.pipe(uploadStream);
        });

        updates.profilePicture = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to process image";
        return NextResponse.json({ message: "Image upload error", error: message }, { status: 500 });
      }
    }

    // Generate automatic collections
    updates.collections = await createAutomaticCollections(user);

    // Apply updates
    await User.updateOne({ _id: session.user.id }, { $set: { ...updates, bookmarks: user.bookmarks } });

    const updatedUser = await User.findById(session.user.id).lean();
    return NextResponse.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Server error", error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}