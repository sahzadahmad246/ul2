// src/app/api/users/poets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    // Explicitly await params to satisfy Next.js
    const params = await context.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ message: "Poet ID is required" }, { status: 400 });
    }

    let poet;

    if (mongoose.Types.ObjectId.isValid(id)) {
      poet = await User.findOne({ _id: id, role: "poet" })
        .select("_id name slug profilePicture role")
        .lean();
    } else {
      poet = await User.findOne({ slug: id, role: "poet" })
        .select("_id name slug profilePicture role")
        .lean();
    }

    if (!poet) {
      return NextResponse.json({ message: "Poet not found" }, { status: 404 });
    }

    return NextResponse.json(poet);
  } catch (error) {
    console.error("[GET_POET_ERROR]", error);
    return NextResponse.json(
      { message: "Server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}