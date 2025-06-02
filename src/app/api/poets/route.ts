import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const random = url.searchParams.get("random") === "true";
    const skip = (page - 1) * limit;

    let poets;
    let total;

    if (random) {
      poets = await User.aggregate([
        { $match: { role: { $in: ["poet", "admin"] } } },
        { $sample: { size: limit } },
        {
          $project: {
            name: 1,
            slug: 1,
            profilePicture: 1,
            bio: 1,
            poemCount: 1,
            createdAt: 1,
          },
        },
      ]);
      total = await User.countDocuments({ role: { $in: ["poet", "admin"] } });
    } else {
      poets = await User.find({ role: { $in: ["poet", "admin"] } })
        .skip(skip)
        .limit(limit)
        .select("name slug profilePicture bio poemCount createdAt")
        .lean();
      total = await User.countDocuments({ role: { $in: ["poet", "admin"] } });
    }

    // Serialize dates to ISO strings
    const poetsResponse = poets.map((poet) => ({
      ...poet,
      _id: poet._id.toString(),
      createdAt: new Date(poet.createdAt).toISOString(),
      updatedAt: poet.updatedAt ? new Date(poet.updatedAt).toISOString() : undefined,
    }));

    return NextResponse.json({
      poets: poetsResponse,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Poets API error:", errorMessage);
    return NextResponse.json(
      { message: "Server error", error: errorMessage },
      { status: 500 }
    );
  }
}