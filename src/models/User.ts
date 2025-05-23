// src/app/models/User.ts
import mongoose, { Schema, model, Model } from "mongoose";
import sanitizeHtml from "sanitize-html";
import { IUser } from "../types/userTypes";

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: [100, "Name cannot exceed 100 characters"] },
    profilePicture: {
      publicId: { type: String },
      url: { type: String },
    },
    roles: {
      type: [String],
      enum: ["user", "poet", "admin"],
      default: ["user"],
    },
    bio: { type: String, trim: true, maxlength: [500, "Bio cannot exceed 500 characters"] },
    dob: { type: Date },
    dateOfDeath: { type: Date },
    location: { type: String, trim: true, maxlength: [100, "Location cannot exceed 100 characters"] },
    following: {
      type: [{ userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, followedAt: { type: Date, default: Date.now } }],
      default: [],
    },
    followers: {
      type: [{ userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, followedAt: { type: Date, default: Date.now } }],
      default: [],
    },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    interests: { type: [String], default: [] },
    likedPoems: {
      type: [{ poemId: { type: Schema.Types.ObjectId, ref: "Poem", required: true } }],
      default: [],
    },
    poems: {
      type: [{ poemId: { type: Schema.Types.ObjectId, ref: "Poem" } }],
      default: [],
    },
    poemCount: { type: Number, default: 0 },
    bookmarks: {
      type: [{
        poemId: { type: Schema.Types.ObjectId, ref: "Poem", required: true },
        bookmarkedAt: { type: Date, default: Date.now }
      }],
      default: [],
    },
    collections: {
      type: [{
        name: { type: String, required: true, trim: true, maxlength: [100, "Collection name cannot exceed 100 characters"] },
        description: { type: String, trim: true, maxlength: [500, "Collection description cannot exceed 500 characters"] },
        poems: [{ type: Schema.Types.ObjectId, ref: "Poem" }],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      }],
      default: [],
    },
  },
  { timestamps: true }
);

// Sanitize inputs and sync counters
UserSchema.pre("save", function (next) {
  if (this.bio) this.bio = sanitizeHtml(this.bio);
  if (this.location) this.location = sanitizeHtml(this.location);
  this.followerCount = this.followers.length;
  this.followingCount = this.following.length;
  this.poemCount = this.poems?.length || 0;
  // Ensure roles is defined before checking includes
  if (!(this.roles && this.roles.includes("poet"))) {
    this.poems = [];
    this.poemCount = 0;
  }
  next();
});



const User: Model<IUser> = mongoose.models.User || model<IUser>("User", UserSchema);

export default User;