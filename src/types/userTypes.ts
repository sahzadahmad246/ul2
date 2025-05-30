// src/types/userTypes.ts
export interface IPoet {
  _id: string;
  email: string;
  name: string;
  slug: string;
  profilePicture?: {
    publicId?: string;
    url?: string;
  };
  role: "poet";
  bio?: string;
  dob?: string; // Unchanged
  location?: string;
  poems: { poemId: string }[];
  poemCount: number;
  bookmarks: {
    poemId: string;
    bookmarkedAt: string | null;
    poem?: {
      firstCouplet: string;
      slug: string;
      viewsCount: number;
      poetName: string;
    } | null;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface IPoemPopulated {
  _id: string;
  content: {
    en: { couplet: string; meaning?: string }[];
  };
  slug: {
    en: string;
  };
  viewsCount: number;
  poet: {
    name: string;
  };
}

export interface IUser {
  _id: string;
  googleId?: string;
  email: string;
  name: string;
  slug: string;
  profilePicture?: {
    publicId?: string;
    url?: string;
  };
  role: "user" | "poet" | "admin";
  bio?: string;
  dob?: string | Date; // Unchanged
  location?: string;
  poems: { poemId: string }[];
  poemCount: number;
  bookmarks: {
    poemId: string;
    bookmarkedAt: string | null;
    poem?: {
      firstCouplet: string;
      slug: string;
      viewsCount: number;
      poetName: string;
    } | null;
  }[];
  createdAt: string;
  updatedAt: string;
}

export type Role = "user" | "poet" | "admin";