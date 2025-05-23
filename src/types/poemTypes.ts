// src/app/types/poemTypes.ts
import { Types } from "mongoose";

export interface IPoem {
  _id?: Types.ObjectId;
  title: {
    en: string;
    hi: string;
    ur: string;
  };
  content: {
    en: { couplet: string; meaning?: string }[];
    hi: { couplet: string; meaning?: string }[];
    ur: { couplet: string; meaning?: string }[];
  };
  author: Types.ObjectId;
  bookmarks: { userId: Types.ObjectId; bookmarkedAt: Date }[];
  bookmarkCount: number;
  coverImage?: string;
  topics: string[];
  category: "poem" | "ghazal" | "sher" | "nazm" | "rubai" | "marsiya" | "qataa" | "other";
  status: "draft" | "published";
  slug: {
    en: string;
    hi: string;
    ur: string;
  };
  summary: {
    en?: string;
    hi?: string;
    ur?: string;
  };
  didYouKnow: {
    en?: string;
    hi?: string;
    ur?: string;
  };
  faqs: {
    question: {
      en?: string;
      hi?: string;
      ur?: string;
    };
    answer: {
      en?: string;
      hi?: string;
      ur?: string;
    };
  }[];
  likes: { userId: Types.ObjectId; likedAt: Date }[];
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}