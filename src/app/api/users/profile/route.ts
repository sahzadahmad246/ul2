// src/app/api/users/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Poem from "@/models/Poem";
import { authOptions } from "@/lib/auth";
import { updateProfileSchema } from "@/validators/userValidator";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { IUser } from "@/types/userTypes";
import { slugifyUser } from "@/lib/slugify";
import { Types } from "mongoose";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Zod schema for bookmark and collection operations
const bookmarkSchema = z.object({
  poemId: z.string().nonempty("Poem ID is required"),
  action: z.enum(["add", "remove"]).optional(),
});

const collectionSchema = z.object({
  action: z.enum(["create", "edit", "delete"]),
  collectionId: z.string().optional(),
  name: z.string().max(100, "Collection name cannot exceed 100 characters").optional(),
  description: z.string().max(500, "Collection description cannot exceed 500 characters").optional(),
  poemIds: z.array(z.string()).optional(),
});

interface FormDataObject {
  [key: string]: string | string[] | File | null;
}

// Define specific types for nested structures based on IUser
type Bookmark = {
  poemId: Types.ObjectId;
  bookmarkedAt?: Date;
};



type Collection = {
  _id?: Types.ObjectId;
  name: string;
  description?: string;
  poems: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
};

type LikedPoem = {
  poemId: Types.ObjectId;
};



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
      if (key === "interests" || key === "poemIds") {
        try {
          body[key] = typeof value === "string" ? JSON.parse(value) : value;
        } catch {
          // Ignore parsing errors
        }
      } else {
        body[key] = value;
      }
    });
    const image = formData.get("image") as File | null;

    // Handle profile updates
    if (body.name || body.bio || body.dob || body.dateOfDeath || body.location || body.interests || image || body.slug) {
      const validatedData = updateProfileSchema.parse({ ...body, image });

      const user = await User.findById(session.user.id);
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      const updates: Partial<IUser> = {};
      if (validatedData.name) {
        updates.name = validatedData.name;
        const baseSlug = slugifyUser(validatedData.name);
        let slug = baseSlug;
        let counter = 1;

        while (await User.findOne({ slug, _id: { $ne: user._id } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        updates.slug = slug;
      }
      if (validatedData.slug) {
        let slug = validatedData.slug;
        let counter = 1;
        const baseSlug = slug;
        while (await User.findOne({ slug, _id: { $ne: user._id } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        updates.slug = slug;
      }
      if (validatedData.bio) updates.bio = validatedData.bio;
      if (validatedData.dob) updates.dob = validatedData.dob;
      if (validatedData.dateOfDeath) updates.dateOfDeath = validatedData.dateOfDeath;
      if (validatedData.location) updates.location = validatedData.location;
      if (validatedData.interests) updates.interests = validatedData.interests;

      // Handle image upload
      if (validatedData.image) {
        try {
          if (user.profilePicture?.publicId) {
            const destroyResult = await cloudinary.uploader.destroy(user.profilePicture.publicId, {
              resource_type: "image",
            });
            if (destroyResult.result !== "ok") {
              throw new Error("Failed to delete previous image from Cloudinary");
            }
          }

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

      // Use findByIdAndUpdate to trigger pre("save") hook
      const updatedUser = await User.findByIdAndUpdate(
        session.user.id,
        { $set: updates },
        { new: true, runValidators: true }
      );
      if (!updatedUser) {
        return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
      }
    }

    // Handle bookmark operations
    if (body.poemId || body.action) {
      const bookmarkData = bookmarkSchema.parse(body);
      const user = await User.findById(session.user.id);
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      if (bookmarkData.action === "add") {
        if (!user.bookmarks.some((b: Bookmark) => b.poemId.toString() === bookmarkData.poemId)) {
          await User.updateOne(
            { _id: session.user.id },
            { $push: { bookmarks: { poemId: bookmarkData.poemId, bookmarkedAt: new Date() } } }
          );
        }
      } else if (bookmarkData.action === "remove") {
        await User.updateOne(
          { _id: session.user.id },
          { $pull: { bookmarks: { poemId: bookmarkData.poemId } } }
        );
      }
    }

    // Handle collection operations
    if (body.collectionAction) {
      const collectionData = collectionSchema.parse({
        action: body.collectionAction,
        collectionId: body.collectionId,
        name: body.name,
        description: body.description,
        poemIds: body.poemIds,
      });
      const user = await User.findById(session.user.id);
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      if (collectionData.action === "create") {
        if (!collectionData.name) {
          return NextResponse.json({ message: "Collection name is required" }, { status: 400 });
        }
        await User.updateOne(
          { _id: session.user.id },
          {
            $push: {
              collections: {
                name: collectionData.name,
                description: collectionData.description || "",
                poems: collectionData.poemIds || [],
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          }
        );
      } else if (collectionData.action === "edit" && collectionData.collectionId) {
        await User.updateOne(
          { _id: session.user.id, "collections._id": collectionData.collectionId },
          {
            $set: {
              "collections.$.name": collectionData.name || undefined,
              "collections.$.description": collectionData.description || undefined,
              "collections.$.poems": collectionData.poemIds || undefined,
              "collections.$.updatedAt": new Date(),
            },
          }
        );
      } else if (collectionData.action === "delete" && collectionData.collectionId) {
        await User.updateOne(
          { _id: session.user.id },
          { $pull: { collections: { _id: collectionData.collectionId } } }
        );
      }
    }

    // Generate curated collection if no likes/bookmarks or on demand
    if (body.curateCollection === "true" || (!body.poemId && !body.collectionAction)) {
      const user = await User.findById(session.user.id).populate("likedPoems.poemId bookmarks.poemId");
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      let poemIds: string[] = [];
      if (user.likedPoems.length > 0 || user.bookmarks.length > 0) {
        const likedPoemIds = user.likedPoems.map((p: LikedPoem) => p.poemId.toString());
        const bookmarkedPoemIds = user.bookmarks.map((b: Bookmark) => b.poemId.toString());
        const allPoemIds = [...new Set([...likedPoemIds, ...bookmarkedPoemIds])];

        const poems = await Poem.find({ _id: { $in: allPoemIds } }).select("topics category");
        const topics = poems.flatMap((p) => p.topics || p.category || []);

        const topicFrequency = topics.reduce((acc: Record<string, number>, topic: string) => {
          acc[topic] = (acc[topic] || 0) + 1;
          return acc;
        }, {});

        const topTopics = Object.entries(topicFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([topic]) => topic);

        const curatedPoems = await Poem.find({
          $or: [{ topics: { $in: topTopics } }, { category: { $in: topTopics } }],
          _id: { $nin: allPoemIds },
        })
          .limit(10)
          .select("_id");

        poemIds = curatedPoems.map((p) => p._id.toString());
      } else {
        const randomPoems = await Poem.find().limit(10).select("_id");
        poemIds = randomPoems.map((p) => p._id.toString());
      }

      const existingCurated = user.collections.find((c: Collection) => c.name === "Curated for You");
      if (existingCurated) {
        await User.updateOne(
          { _id: session.user.id, "collections._id": existingCurated._id },
          { $set: { "collections.$.poems": poemIds, "collections.$.updatedAt": new Date() } }
        );
      } else {
        await User.updateOne(
          { _id: session.user.id },
          {
            $push: {
              collections: {
                name: "Curated for You",
                description: "A collection tailored to your interests",
                poems: poemIds,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          }
        );
      }
    }

    const updatedUser = await User.findById(session.user.id).lean();
    return NextResponse.json({ message: "Operation successful", user: updatedUser });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Server error", error: message }, { status: 500 });
  }
}