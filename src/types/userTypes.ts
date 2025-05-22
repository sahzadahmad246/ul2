import { Types } from "mongoose";

export interface IUser {
  _id?: Types.ObjectId;
  googleId?: string;
  email: string;
  name: string;
  profilePicture?: {
    publicId?: string;
    url?: string;
  };
  roles: ("user" | "poet" | "admin")[];
  bio?: string;
  dob?: Date;
  dateOfDeath?: Date;
  location?: string;
  following: { userId: Types.ObjectId; followedAt: Date }[];
  followers: { userId: Types.ObjectId; followedAt: Date }[];
  followerCount: number;
  followingCount: number;
  interests: string[];
  likedPoems: { poemId: Types.ObjectId }[];
  poems: { poemId: Types.ObjectId }[];
  poemCount: number;
  createdAt: Date;
  updatedAt: Date;
}