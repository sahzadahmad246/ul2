// src/app/api/poems/[identifier]/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Poem from "@/models/Poem";
import User from "@/models/User";
import { authOptions } from "@/lib/auth/authOptions";
import { updatePoemSchema } from "@/validators/poemValidator";
import {
  configureCloudinary,
  uploadImageStream,
  deleteImage,
} from "@/lib/utils/cloudinary";
import { slugify } from "@/lib/slugify";
import { IPoem } from "@/types/poemTypes";

// Define the type for updateData to allow partial updates with optional content fields
type UpdatePoemData = Partial<
  Omit<IPoem, "content" | "poet"> & {
    content?: {
      en?: { couplet: string; meaning?: string }[];
      hi?: { couplet: string; meaning?: string }[];
      ur?: { couplet: string; meaning?: string }[];
    };
  }
> & {
  coverImage?: { publicId: string; url: string };
  poet?: Types.ObjectId | string; // Define poet as ObjectId or string
};

interface PoemFormData {
  title?: { en: string; hi: string; ur: string };
  content?: {
    en?: { couplet: string; meaning?: string }[];
    hi?: { couplet: string; meaning?: string }[];
    ur?: { couplet: string; meaning?: string }[];
  };
  summary?: { en?: string; hi?: string; ur?: string };
  didYouKnow?: { en?: string; hi?: string; ur?: string };
  faqs?: {
    question: { en?: string; hi?: string; ur?: string };
    answer: { en?: string; hi?: string; ur?: string };
  }[];
  topics?: string[];
  poet?: string;
  coverImage?: File | null;
  slug?: { en: string; hi: string; ur: string };
  category?: string;
  status?: "draft" | "published";
  [key: string]: unknown;
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ identifier: string }> }
) {
  try {
    const params = await context.params;
    const { identifier } = params;
    console.log("PUT request received for identifier:", identifier); // Debug log

    await dbConnect();
    console.log("Database connected");

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("Unauthorized: No session or user ID found");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await User.findById(session.user.id);
    if (
      !currentUser ||
      (currentUser.role !== "poet" && currentUser.role !== "admin")
    ) {
      console.log("Forbidden: User role is", currentUser?.role || "none");
      return NextResponse.json(
        { message: "Forbidden: Only poets or admins can update poems" },
        { status: 403 }
      );
    }

    const poem = await Poem.findOne({
      $or: [
        { "slug.en": identifier },
        { "slug.hi": identifier },
        { "slug.ur": identifier },
      ],
    });
    console.log("Poem query result:", poem); // Debug log
    if (!poem) {
      console.log("Poem not found for identifier:", identifier);
      return NextResponse.json({ message: "Poem not found" }, { status: 404 });
    }
    
    // Check if the user is authorized to update this poem
    if (currentUser.role === "poet") {
      if (!poem.poet || poem.poet._id.toString() !== session.user.id) {
        console.log(
          "Forbidden: User ID",
          session.user.id,
          "does not match poem poet ID",
          poem.poet ? poem.poet._id.toString() : "null"
        );
        return NextResponse.json(
          { message: "Forbidden: You can only update your own poems" },
          { status: 403 }
        );
      }
    }

    const formData = await req.formData();
    const body: PoemFormData = {};

    // Handle title updates
    const titleEn = formData.get("title[en]");
    const titleHi = formData.get("title[hi]");
    const titleUr = formData.get("title[ur]");
    if (titleEn || titleHi || titleUr) {
      if (
        typeof titleEn !== "string" ||
        typeof titleHi !== "string" ||
        typeof titleUr !== "string"
      ) {
        console.log("Invalid title fields:", { titleEn, titleHi, titleUr });
        return NextResponse.json(
          { message: "Missing or invalid title fields" },
          { status: 400 }
        );
      }
      body.title = { en: titleEn, hi: titleHi, ur: titleUr };
      body.slug = {
        en: slugify(titleEn, "en"),
        hi: slugify(titleEn, "hi"),
        ur: slugify(titleEn, "ur"),
      };
    }

    // Handle JSON-parsed fields with error checking
    for (const key of ["content", "topics", "faqs"]) {
      const value = formData.get(key);
      if (value !== null && value !== undefined) {
        if (typeof value !== "string") {
          console.log(`Invalid ${key} format:`, value);
          return NextResponse.json(
            { message: `Invalid ${key} format: must be a string` },
            { status: 400 }
          );
        }
        try {
          body[key] = JSON.parse(value);
        } catch (error) {
          console.log(`Invalid ${key} JSON format:`, error);
          return NextResponse.json(
            { message: `Invalid ${key} JSON format` },
            { status: 400 }
          );
        }
      }
    }

    // Handle optional multilingual fields
    const summaryEn = formData.get("summary[en]");
    const summaryHi = formData.get("summary[hi]");
    const summaryUr = formData.get("summary[ur]");
    if (summaryEn || summaryHi || summaryUr) {
      body.summary = {
        en: typeof summaryEn === "string" ? summaryEn : undefined,
        hi: typeof summaryHi === "string" ? summaryHi : undefined,
        ur: typeof summaryUr === "string" ? summaryUr : undefined,
      };
    }

    const didYouKnowEn = formData.get("didYouKnow[en]");
    const didYouKnowHi = formData.get("didYouKnow[hi]");
    const didYouKnowUr = formData.get("didYouKnow[ur]");
    if (didYouKnowEn || didYouKnowHi || didYouKnowUr) {
      body.didYouKnow = {
        en: typeof didYouKnowEn === "string" ? didYouKnowEn : undefined,
        hi: typeof didYouKnowHi === "string" ? didYouKnowHi : undefined,
        ur: typeof didYouKnowUr === "string" ? didYouKnowUr : undefined,
      };
    }

    // Handle poet update (admin only)
    let poetId: string | undefined;
    if (currentUser.role === "admin") {
      const poetValue = formData.get("poet");
      if (poetValue !== null && poetValue !== undefined) {
        if (typeof poetValue !== "string") {
          console.log("Invalid poet ID format:", poetValue);
          return NextResponse.json(
            { message: "Invalid poet ID format" },
            { status: 400 }
          );
        }
        poetId = poetValue;
        const poet = await User.findById(poetId);
        if (!poet || poet.role !== "poet") {
          console.log("Invalid or non-poet user selected:", poetId);
          return NextResponse.json(
            { message: "Invalid or non-poet user selected" },
            { status: 400 }
          );
        }
      }
    }

    // Handle category and status
    const category = formData.get("category");
    if (category !== null && category !== undefined) {
      if (typeof category !== "string") {
        console.log("Invalid category format:", category);
        return NextResponse.json(
          { message: "Invalid category format" },
          { status: 400 }
        );
      }
      body.category = category;
    }

    const status = formData.get("status");
    if (status !== null && status !== undefined) {
      if (typeof status !== "string") {
        console.log("Invalid status format:", status);
        return NextResponse.json(
          { message: "Invalid status format" },
          { status: 400 }
        );
      }
      body.status = status as "draft" | "published";
    }

    // Check for slug uniqueness (excluding the current poem)
    if (body.slug) {
      const existingSlugs = await Poem.find({
        $or: [
          { "slug.en": body.slug.en },
          { "slug.hi": body.slug.hi },
          { "slug.ur": body.slug.ur },
        ],
        _id: { $ne: poem._id },
      }).select("slug");
      console.log("Existing slugs check:", existingSlugs); // Debug log
      if (existingSlugs.length > 0) {
        return NextResponse.json(
          { message: "Slug already exists" },
          { status: 400 }
        );
      }
    }

    // Validate data with Zod
    const validatedData = updatePoemSchema.parse({
      ...body,
      coverImage: formData.get("coverImage") as File | null,
    });

    // Handle cover image update
    let coverImage: { publicId: string; url: string } | undefined;
    if (validatedData.coverImage && validatedData.coverImage instanceof File) {
      configureCloudinary();
      // Delete previous cover image if it exists
      if (poem.coverImage?.publicId) {
        try {
          await deleteImage(poem.coverImage.publicId);
        } catch (error) {
          console.error("Failed to delete previous cover image:", error);
          return NextResponse.json(
            {
              message: "Failed to delete previous cover image",
              error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
          );
        }
      }
      // Upload new cover image
      const buffer = Buffer.from(await validatedData.coverImage.arrayBuffer());
      const { publicId, url } = await uploadImageStream(
        buffer,
        "unmatchedlines/poems"
      );
      coverImage = { publicId, url };
    }

    // Prepare update object, excluding coverImage from validatedData
    const updateData: UpdatePoemData = {
      ...validatedData,
      coverImage: undefined, // Explicitly set to undefined to avoid type mismatch
    };
    if (coverImage) {
      updateData.coverImage = coverImage;
    }
    if (poetId) {
      updateData.poet = poetId;
    }

    // Update poem
    const updatedPoem = await Poem.findByIdAndUpdate(poem._id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("poet", "name slug")
      .select("-__v")
      .lean();

    if (!updatedPoem) {
      console.log("Failed to update poem with ID:", poem._id);
      return NextResponse.json(
        { message: "Failed to update poem" },
        { status: 500 }
      );
    }

    // If poet changes, update the User model
    if (poetId && poetId !== (poem.poet?._id.toString() ?? "")) {
      if (poem.poet) {
        await User.findByIdAndUpdate(poem.poet._id, {
          $pull: { poems: { poemId: poem._id } },
          $inc: { poemCount: -1 },
        });
      }
      await User.findByIdAndUpdate(poetId, {
        $push: { poems: { poemId: poem._id } },
        $inc: { poemCount: 1 },
      });
    }
    console.log("Poem updated successfully:", updatedPoem);
    return NextResponse.json(
      { message: "Poem updated successfully", poem: updatedPoem },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in PUT /api/poems/[identifier]/update:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}