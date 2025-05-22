// src/app/types/userTypes.ts
import { Types } from "mongoose";

export interface IUser {
  googleId?: string;
  email: string;
  name: string;
  profilePicture?: {
    publicId?: string;
    url?: string;
  };
  roles?: string[];
  bio?: string;
  dob?: Date;
  dateOfDeath?: Date;
  location?: string;
  following: Array<{ userId: Types.ObjectId; followedAt: Date }>;
  followers: Array<{ userId: Types.ObjectId; followedAt: Date }>;
  followerCount: number;
  followingCount: number;
  interests: string[];
  likedPoems: Array<{ poemId: Types.ObjectId }>;
  poems?: Array<{ poemId: Types.ObjectId }>;
  poemCount?: number;
  createdAt: Date;
  updatedAt: Date;
}