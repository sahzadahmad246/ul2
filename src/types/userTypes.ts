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
  dob?: string;
  location?: string;
  poems: { poemId: string }[];
  poemCount: number;
  bookmarks: { poemId: string; bookmarkedAt: string }[];
  createdAt: string;
  updatedAt: string;
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
  dob?: string | Date;
  location?: string;
  poems: { poemId: string }[];
  poemCount: number;
  bookmarks: { poemId: string; bookmarkedAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export type Role = "user" | "poet" | "admin";