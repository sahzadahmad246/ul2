import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Poem from "@/models/Poem";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { updatePoemSchema } from "@/validators/poemValidator";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { slugify } from "@/lib/slugify";
import { IPoem } from "@/types/poemTypes";
import mongoose from "mongoose";

// Define the structure for the body object
interface PoemUpdateFormData {
  title?: { en: string; hi: string; ur: string };
  summary?: { en: string; hi: string; ur: string };
  didYouKnow?: { en: string; hi: string; ur: string };
  content?: { en: string; hi: string; ur: string };
  topics?: string[];
  faqs?: Array<{
    question: { en: string; hi: string; ur: string };
    answer: { en: string; hi: string; ur: string };
  }>;
  coverImage?: File | null;
  addBookmark?: string;
  removeBookmark?: string;
  addLike?: string;
  removeLike?: string;
  category?: string;
  status?: string;
  [key: string]: unknown; // Allow other fields
}

// Define the FAQ structure
interface FAQ {
  question: { en?: string; hi?: string; ur?: string };
  answer: { en?: string; hi?: string; ur?: string };
}

// Define Bookmark and Like structures
interface Bookmark {
  userId: mongoose.Types.ObjectId;
  bookmarkedAt: Date;
}

interface Like {
  userId: mongoose.Types.ObjectId;
  likedAt: Date;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET: Retrieve a specific poem by slug
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();

    const { slug } = await params;
    console.log("[GET_POEM] Received slug:", slug);

    const poem = await Poem.findOne({
      $or: [
        { "slug.en": { $regex: `^${slug}$`, $options: "i" } },
        { "slug.hi": { $regex: `^${slug}$`, $options: "i" } },
        { "slug.ur": { $regex: `^${slug}$`, $options: "i" } },
      ],
    })
      .populate("poet", "name")
      .lean();

    if (!poem) {
      console.log("[GET_POEM] Poem not found for slug:", slug);
      return NextResponse.json({ message: "Poem not found" }, { status: 404 });
    }

    console.log("[GET_POEM] Found poem:", poem._id, "slug:", poem.slug.en);

    // Increment viewsCount
    await Poem.updateOne({ _id: poem._id }, { $inc: { viewsCount: 1 } });

    return NextResponse.json(poem);
  } catch (error) {
    console.error("[GET_POEM] Server error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT: Update a specific poem by slug
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();

    const { slug } = await params;
    console.log("[PUT_POEM] Received slug:", slug);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("[PUT_POEM] Unauthorized: No session or user ID");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const poem = await Poem.findOne({
      $or: [
        { "slug.en": { $regex: `^${slug}$`, $options: "i" } },
        { "slug.hi": { $regex: `^${slug}$`, $options: "i" } },
        { "slug.ur": { $regex: `^${slug}$`, $options: "i" } },
      ],
    });

    if (!poem) {
      console.log("[PUT_POEM] Poem not found for slug:", slug);
      const similarPoems = await Poem.find({
        $or: [
          { "slug.en": { $regex: slug, $options: "i" } },
          { "slug.hi": { $regex: slug, $options: "i" } },
          { "slug.ur": { $regex: slug, $options: "i" } },
        ],
      }).select("slug");
      console.log("[PUT_POEM] Similar poems found:", similarPoems);
      return NextResponse.json({ message: "Poem not found" }, { status: 404 });
    }

    console.log("[PUT_POEM] Found poem:", poem._id, "slug:", poem.slug.en);

    // Check if user is authorized to edit the poem
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      console.log("[PUT_POEM] User not found:", session.user.id);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    if (poem.poet.toString() !== session.user.id && currentUser.role !== "admin") {
      console.log("[PUT_POEM] Forbidden: User not authorized to edit poem", {
        userId: session.user.id,
        poemPoet: poem.poet.toString(),
        role: currentUser.role,
      });
      return NextResponse.json(
        { message: "Forbidden: You can only edit your own poems" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const body: PoemUpdateFormData = {};
    formData.forEach((value, key) => {
      if (key === "content" || key === "topics") {
        try {
          body[key] = typeof value === "string" ? JSON.parse(value) : value;
        } catch (error) {
          console.error(`[PUT_POEM] Failed to parse ${key}:`, error);
        }
      } else {
        body[key] = value;
      }
    });

    // Explicitly construct title, summary, didYouKnow, and faqs only if provided
    if (formData.get("title[en]")) {
      body.title = {
        en: formData.get("title[en]") as string,
        hi: formData.get("title[hi]") as string,
        ur: formData.get("title[ur]") as string,
      };
    }
    // Only include summary if any summary field is provided
    if (formData.get("summary[en]") || formData.get("summary[hi]") || formData.get("summary[ur]")) {
      body.summary = {
        en: formData.get("summary[en]") as string || "",
        hi: formData.get("summary[hi]") as string || "",
        ur: formData.get("summary[ur]") as string || "",
      };
    }
    // Only include didYouKnow if any didYouKnow field is provided
    if (formData.get("didYouKnow[en]") || formData.get("didYouKnow[hi]") || formData.get("didYouKnow[ur]")) {
      body.didYouKnow = {
        en: formData.get("didYouKnow[en]") as string || "",
        hi: formData.get("didYouKnow[hi]") as string || "",
        ur: formData.get("didYouKnow[ur]") as string || "",
      };
    }
    // Handle faqs
    const faqsRaw = formData.get("faqs") as string;
    if (faqsRaw) {
      try {
        const faqsArray: FAQ[] = JSON.parse(faqsRaw);
        body.faqs = faqsArray
          .filter((faq: FAQ) => faq.question && faq.answer)
          .map((faq: FAQ) => ({
            question: {
              en: faq.question?.en || "",
              hi: faq.question?.hi || "",
              ur: faq.question?.ur || "",
            },
            answer: {
              en: faq.answer?.en || "",
              hi: faq.answer?.hi || "",
              ur: faq.answer?.ur || "",
            },
          }));
      } catch (error) {
        console.error("[PUT_POEM] Failed to parse faqs:", error);
      }
    }

    // Generate new slugs if title is updated
    if (body.title?.en) {
      body.slug = {
        en: slugify(body.title.en, "en"),
        hi: slugify(body.title.en, "hi"),
        ur: slugify(body.title.en, "ur"),
      };
    }

    // Validate input
    const validatedData = updatePoemSchema.parse({
      ...body,
      coverImage: formData.get("coverImage") as File | null,
    });

    // Handle Cloudinary image upload
    let coverImageUrl = poem.coverImage;
    if (validatedData.coverImage) {
      try {
        // Delete existing image if it exists
        if (poem.coverImage) {
          const publicId = poem.coverImage.split("/").pop()?.split(".")[0];
          if (publicId) {
            await cloudinary.uploader.destroy(
              `unmatchedlines/poems/${publicId}`,
              { resource_type: "image" }
            );
          }
        }

        // Upload new image
        const buffer = Buffer.from(
          await validatedData.coverImage.arrayBuffer()
        );
        const stream = Readable.from(buffer);
        const uploadResult = await new Promise<{ secure_url: string }>(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "unmatchedlines/poems", resource_type: "image" },
              (error, result) => {
                if (error || !result)
                  reject(error || new Error("Upload failed"));
                else resolve({ secure_url: result.secure_url });
              }
            );
            stream.pipe(uploadStream);
          }
        );
        coverImageUrl = uploadResult.secure_url;
      } catch (error) {
        console.error("[PUT_POEM] Image upload error:", error);
        return NextResponse.json(
          {
            message: "Image upload error",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    // Define updates with IPoem type
    const updates: Partial<IPoem> = {};
    if (validatedData.title) updates.title = validatedData.title;
    if (validatedData.content) {
      updates.content = {
        en: validatedData.content.en || poem.content.en,
        hi: validatedData.content.hi || poem.content.hi,
        ur: validatedData.content.ur || poem.content.ur,
      };
    }
    if (validatedData.coverImage) updates.coverImage = coverImageUrl;
    if (validatedData.topics) updates.topics = validatedData.topics;
    if (validatedData.category) updates.category = validatedData.category;
    if (validatedData.status) updates.status = validatedData.status;
    if (validatedData.slug) updates.slug = validatedData.slug;
    if (validatedData.summary) updates.summary = validatedData.summary;
    if (validatedData.didYouKnow) updates.didYouKnow = validatedData.didYouKnow;
    if (validatedData.faqs) {
      updates.faqs = validatedData.faqs.filter(
        (faq): faq is { question: { en?: string; hi?: string; ur?: string }; answer: { en?: string; hi?: string; ur?: string } } =>
          faq.question != null && faq.answer != null
      );
    }

    // Handle bookmark and like operations
    if (validatedData.addBookmark) {
      const userId = new mongoose.Types.ObjectId(validatedData.addBookmark);
      // Check for duplicates in both Poem and User collections
      const user = await User.findById(userId);
      if (
        !poem.bookmarks?.some((b: Bookmark) => b.userId.toString() === userId.toString()) &&
        !user?.bookmarks.some((b) => b.poemId.toString() === poem._id.toString())
      ) {
        updates.bookmarks = [
          ...(poem.bookmarks || []),
          {
            userId,
            bookmarkedAt: new Date(),
          },
        ];
        updates.bookmarkCount = updates.bookmarks.length;
        // Update User collection
        await User.updateOne(
          { _id: userId },
          { $push: { bookmarks: { poemId: poem._id, bookmarkedAt: new Date() } } }
        );
        console.log("[PUT_POEM] Added bookmark for user:", userId.toString(), "poem:", poem._id.toString());
      } else {
        console.log("[PUT_POEM] Bookmark already exists for user:", userId.toString(), "poem:", poem._id.toString());
      }
    }
    if (validatedData.removeBookmark) {
      const userId = validatedData.removeBookmark;
      updates.bookmarks = poem.bookmarks?.filter(
        (b: Bookmark) => b.userId.toString() !== userId
      ) || [];
      updates.bookmarkCount = updates.bookmarks.length;
      // Update User collection
      await User.updateOne(
        { _id: userId },
        { $pull: { bookmarks: { poemId: poem._id } } }
      );
      console.log("[PUT_POEM] Removed bookmark for user:", userId, "poem:", poem._id.toString());
    }
    if (validatedData.addLike) {
      const userId = new mongoose.Types.ObjectId(validatedData.addLike);
      // Check for duplicates in both Poem and User collections
      const user = await User.findById(userId);
      if (
        !poem.likes?.some((l: Like) => l.userId.toString() === userId.toString()) &&
        !user?.likedPoems.some((p) => p.poemId.toString() === poem._id.toString())
      ) {
        updates.likes = [
          ...(poem.likes || []),
          {
            userId,
            likedAt: new Date(),
          },
        ];
        // Update User collection
        await User.updateOne(
          { _id: userId },
          { $push: { likedPoems: { poemId: poem._id, likedAt: new Date() } } }
        );
        console.log("[PUT_POEM] Added like for user:", userId.toString(), "poem:", poem._id.toString());
      } else {
        console.log("[PUT_POEM] Like already exists for user:", userId.toString(), "poem:", poem._id.toString());
      }
    }
    if (validatedData.removeLike) {
      const userId = validatedData.removeLike;
      updates.likes = poem.likes?.filter(
        (l: Like) => l.userId.toString() !== userId
      ) || [];
      // Update User collection
      await User.updateOne(
        { _id: userId },
        { $pull: { likedPoems: { poemId: poem._id } } }
      );
      console.log("[PUT_POEM] Removed like for user:", userId, "poem:", poem._id.toString());
    }

    await Poem.updateOne({ _id: poem._id }, { $set: updates });

    const updatedPoem = await Poem.findById(poem._id)
      .populate("poet", "name")
      .lean();
    console.log("[PUT_POEM] Poem updated successfully:", poem._id.toString());
    return NextResponse.json({
      message: "Poem updated successfully",
      poem: updatedPoem,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[PUT_POEM] Validation error:", error.errors);
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("[PUT_POEM] Server error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific poem by slug
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();

    const { slug } = await params;
    console.log("[DELETE_POEM] Received slug:", slug);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("[DELETE_POEM] Unauthorized: No session or user ID");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const poem = await Poem.findOne({
      $or: [
        { "slug.en": { $regex: `^${slug}$`, $options: "i" } },
        { "slug.hi": { $regex: `^${slug}$`, $options: "i" } },
        { "slug.ur": { $regex: `^${slug}$`, $options: "i" } },
      ],
    });

    if (!poem) {
      console.log("[DELETE_POEM] Poem not found for slug:", slug);
      return NextResponse.json({ message: "Poem not found" }, { status: 404 });
    }

    console.log("[DELETE_POEM] Found poem:", poem._id, "slug:", poem.slug.en);

    if (poem.poet.toString() !== session.user.id) {
      console.log("[DELETE_POEM] Forbidden: User not authorized to delete poem", {
        userId: session.user.id,
        poemPoet: poem.poet.toString(),
      });
      return NextResponse.json(
        { message: "Forbidden: You can only delete your own poems" },
        { status: 403 }
      );
    }

    // Delete image from Cloudinary if it exists
    if (poem.coverImage) {
      const publicId = poem.coverImage.split("/").pop()?.split(".")[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`unmatchedlines/poems/${publicId}`, {
          resource_type: "image",
        });
      }
    }

    await Poem.deleteOne({ _id: poem._id });

    // Remove poem from user's poems array
    await User.updateOne(
      { _id: poem.poet },
      { $pull: { poems: { poemId: poem._id } }, $inc: { poemCount: -1 } }
    );

    console.log("[DELETE_POEM] Poem deleted successfully:", poem._id.toString());
    return NextResponse.json({ message: "Poem deleted successfully" });
  } catch (error) {
    console.error("[DELETE_POEM] Server error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}