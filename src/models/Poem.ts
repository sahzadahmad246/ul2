// src/app/models/Poem.ts
import mongoose, { Schema, model, Model } from "mongoose";
import sanitizeHtml from "sanitize-html";
import { IPoem } from "../types/poemTypes";

const PoemSchema = new Schema<IPoem>(
  {
    title: {
      en: { type: String, required: true, trim: true },
      hi: { type: String, required: true, trim: true },
      ur: { type: String, required: true, trim: true },
    },
    content: {
      en: [
        {
          couplet: { type: String, required: true },
          meaning: { type: String, default: "" },
        },
      ],
      hi: [
        {
          couplet: { type: String, required: true },
          meaning: { type: String, default: "" },
        },
      ],
      ur: [
        {
          couplet: { type: String, required: true },
          meaning: { type: String, default: "" },
        },
      ],
    },
    poet: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Changed from author to poet
    bookmarks: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        bookmarkedAt: { type: Date, default: Date.now },
      },
    ],
    bookmarkCount: { type: Number, default: 0 },
    coverImage: { type: String, default: "" },
    topics: [String],
    category: {
      type: String,
      enum: ["poem", "ghazal", "sher", "nazm", "rubai", "marsiya", "qataa", "other"],
      default: "poem",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    slug: {
      en: { type: String, required: true, unique: true },
      hi: { type: String, required: true, unique: true },
      ur: { type: String, required: true, unique: true },
    },
    summary: {
      en: { type: String, default: "" },
      hi: { type: String, default: "" },
      ur: { type: String, default: "" },
    },
    didYouKnow: {
      en: { type: String, default: "" },
      hi: { type: String, default: "" },
      ur: { type: String, default: "" },
    },
    faqs: [
      {
        question: {
          en: { type: String, default: "" },
          hi: { type: String, default: "" },
          ur: { type: String, default: "" },
        },
        answer: {
          en: { type: String, default: "" },
          hi: { type: String, default: "" },
          ur: { type: String, default: "" },
        },
      },
    ],
    likes: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        likedAt: { type: Date, default: Date.now },
      },
    ],
    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Sanitize inputs and sync counters
PoemSchema.pre("save", function (next) {
  // Sanitize string fields
  if (this.title.en) this.title.en = sanitizeHtml(this.title.en);
  if (this.title.hi) this.title.hi = sanitizeHtml(this.title.hi);
  if (this.title.ur) this.title.ur = sanitizeHtml(this.title.ur);

  if (this.summary.en) this.summary.en = sanitizeHtml(this.summary.en);
  if (this.summary.hi) this.summary.hi = sanitizeHtml(this.summary.hi);
  if (this.summary.ur) this.summary.ur = sanitizeHtml(this.summary.ur);

  if (this.didYouKnow.en) this.didYouKnow.en = sanitizeHtml(this.didYouKnow.en);
  if (this.didYouKnow.hi) this.didYouKnow.hi = sanitizeHtml(this.didYouKnow.hi);
  if (this.didYouKnow.ur) this.didYouKnow.ur = sanitizeHtml(this.didYouKnow.ur);

  this.content.en.forEach((item) => {
    if (item.couplet) item.couplet = sanitizeHtml(item.couplet);
    if (item.meaning) item.meaning = sanitizeHtml(item.meaning);
  });
  this.content.hi.forEach((item) => {
    if (item.couplet) item.couplet = sanitizeHtml(item.couplet);
    if (item.meaning) item.meaning = sanitizeHtml(item.meaning);
  });
  this.content.ur.forEach((item) => {
    if (item.couplet) item.couplet = sanitizeHtml(item.couplet);
    if (item.meaning) item.meaning = sanitizeHtml(item.meaning);
  });

  this.faqs.forEach((faq) => {
    if (faq.question.en) faq.question.en = sanitizeHtml(faq.question.en);
    if (faq.question.hi) faq.question.hi = sanitizeHtml(faq.question.hi);
    if (faq.question.ur) faq.question.ur = sanitizeHtml(faq.question.ur);
    if (faq.answer.en) faq.answer.en = sanitizeHtml(faq.answer.en);
    if (faq.answer.hi) faq.answer.hi = sanitizeHtml(faq.answer.hi);
    if (faq.answer.ur) faq.answer.ur = sanitizeHtml(faq.answer.ur);
  });

  if (this.topics) this.topics = this.topics.map((topic) => sanitizeHtml(topic));
  if (this.coverImage) this.coverImage = sanitizeHtml(this.coverImage);

  // Sync bookmarkCount and likes count
  this.bookmarkCount = this.bookmarks.length;
  this.likes = this.likes || [];
  this.viewsCount = this.viewsCount || 0;

  next();
});

const Poem: Model<IPoem> = mongoose.models.Poem || model<IPoem>("Poem", PoemSchema);

export default Poem;