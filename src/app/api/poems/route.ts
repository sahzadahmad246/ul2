import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Poem from "@/models/Poem";
import User from "@/models/User";
import { authOptions } from "@/lib/auth/authOptions";
import { createPoemSchema } from "@/validators/poemValidator";
import { configureCloudinary, uploadImageStream } from "@/lib/utils/cloudinary";
import { slugify } from "@/lib/slugify";

interface PoemFormData {
  title?: { en: string; hi: string; ur: string };
  content?: { en: { couplet: string; meaning?: string }[]; hi: { couplet: string; meaning?: string }[]; ur: { couplet: string; meaning?: string }[] };
  summary?: { en?: string; hi?: string; ur?: string };
  didYouKnow?: { en?: string; hi?: string; ur?: string };
  faqs?: { question: { en?: string; hi?: string; ur?: string }; answer: { en?: string; hi?: string; ur?: string } }[];
  topics?: string[];
  poet?: string;
  coverImage?: File | null;
  slug?: { en: string; hi: string; ur: string };
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const poems = await Poem.find({ status: "published" })
      .skip(skip)
      .limit(limit)
      .populate("poet", "name slug")
      .select("-__v")
      .lean();
    const total = await Poem.countDocuments({ status: "published" });

    return NextResponse.json({
      poems,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json(
      { message: "Server error", error: "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await User.findById(session.user.id);
    if (!currentUser || (currentUser.role !== "poet" && currentUser.role !== "admin")) {
      return NextResponse.json({ message: "Forbidden: Only poets or admins can create poems" }, { status: 403 });
    }

    const formData = await req.formData();
    const body: PoemFormData = {};

    // Validate required title fields
    const titleEn = formData.get("title[en]");
    const titleHi = formData.get("title[hi]");
    const titleUr = formData.get("title[ur]");
    if (typeof titleEn !== "string" || typeof titleHi !== "string" || typeof titleUr !== "string") {
      return NextResponse.json({ message: "Missing or invalid title fields" }, { status: 400 });
    }
    body.title = { en: titleEn, hi: titleHi, ur: titleUr };
    body.slug = {
      en: slugify(titleEn, "en"),
      hi: slugify(titleEn, "hi"),
      ur: slugify(titleEn, "ur"),
    };

    // Handle JSON-parsed fields with error checking
    for (const key of ["content", "topics", "faqs"]) {
      const value = formData.get(key);
      if (value) {
        if (typeof value !== "string") {
          return NextResponse.json({ message: `Invalid ${key} format: must be a string` }, { status: 400 });
        }
        try {
          body[key] = JSON.parse(value);
        } catch {
          return NextResponse.json({ message: `Invalid ${key} JSON format` }, { status: 400 });
        }
      }
    }

    // Validate content presence
    if (!body.content) {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    // Handle optional multilingual fields
    const summaryEn = formData.get("summary[en]");
    const summaryHi = formData.get("summary[hi]");
    const summaryUr = formData.get("summary[ur]");
    if (summaryEn || summaryHi || summaryUr) {
      body.summary = {
        en: typeof summaryEn === "string" ? summaryEn : "",
        hi: typeof summaryHi === "string" ? summaryHi : "",
        ur: typeof summaryUr === "string" ? summaryUr : "",
      };
    }

    const didYouKnowEn = formData.get("didYouKnow[en]");
    const didYouKnowHi = formData.get("didYouKnow[hi]");
    const didYouKnowUr = formData.get("didYouKnow[ur]");
    if (didYouKnowEn || didYouKnowHi || didYouKnowUr) {
      body.didYouKnow = {
        en: typeof didYouKnowEn === "string" ? didYouKnowEn : "",
        hi: typeof didYouKnowHi === "string" ? didYouKnowHi : "",
        ur: typeof didYouKnowUr === "string" ? didYouKnowUr : "",
      };
    }

    // Determine poet ID
    const poetId = currentUser.role === "poet" ? session.user.id : formData.get("poet");
    if (currentUser.role === "admin" && !poetId) {
      return NextResponse.json({ message: "Poet ID is required for admins" }, { status: 400 });
    }
    const poet = await User.findById(poetId);
    if (!poet || poet.role !== "poet") {
      return NextResponse.json({ message: "Invalid or non-poet user selected" }, { status: 400 });
    }

    // Check for slug uniqueness
    const existingSlugs = await Poem.find({
      $or: [{ "slug.en": body.slug?.en }, { "slug.hi": body.slug?.hi }, { "slug.ur": body.slug?.ur }],
    }).select("slug");
    if (existingSlugs.length > 0) {
      return NextResponse.json({ message: "Slug already exists" }, { status: 400 });
    }

    // Validate data with Zod
    const validatedData = createPoemSchema.parse({
      ...body,
      poet: poetId,
      coverImage: formData.get("coverImage") as File | null,
    });

    // Upload cover image if provided
    let coverImage: { publicId: string; url: string } | undefined;
    if (validatedData.coverImage) {
      configureCloudinary();
      const buffer = Buffer.from(await validatedData.coverImage.arrayBuffer());
      const { publicId, url } = await uploadImageStream(buffer, "unmatchedlines/poems");
      coverImage = { publicId, url };
    }

    // Create poem
    const poem = await Poem.create({
      ...validatedData,
      poet: validatedData.poet,
      coverImage,
    });

    // Update user's poems and poemCount
    await User.findByIdAndUpdate(poetId, {
      $push: { poems: { poemId: poem._id } },
      $inc: { poemCount: 1 },
    });

    return NextResponse.json({ message: "Poem created successfully", poem }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}