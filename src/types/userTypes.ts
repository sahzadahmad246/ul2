// src/types/userTypes.ts
export type Role = "user" | "poet" | "admin";

export interface IUser {
  _id: string;
  googleId?: string | null;
  email: string;
  name: string;
  slug: string;
  profilePicture?: {
    publicId?: string | null;
    url?: string;
  };
  role: Role;
  // Changed from string to Role
  bio?: string;
  dob?: Date | string;
  location?: string;
  poems: { poemId: string }[];
  poemCount: number;
  bookmarks: { poemId: string; bookmarkedAt: string | Date }[];
  createdAt: Date | string;
  updatedAt: Date | string;
}