"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { IPoem } from "@/types/poemTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  Eye,
  Calendar,
  User,
  Globe,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePoetStore } from "@/store/poetStore";
import { Types } from "mongoose";

interface PoemDetailsProps {
  poem: IPoem;
  currentLang: "en" | "hi" | "ur";
}

// Type guard to check if poet is an object with name and profilePicture
function isPoetObject(
  poet:
    | Types.ObjectId
    | {
        _id: Types.ObjectId;
        name: string;
        role: string;
        profilePicture?: { publicId?: string; url?: string };
      }
): poet is {
  _id: Types.ObjectId;
  name: string;
  role: string;
  profilePicture?: { publicId?: string; url?: string };
} {
  return typeof poet === "object" && "name" in poet;
}

const languageNames = {
  en: "English",
  hi: "हिंदी",
  ur: "اردو",
};

export default function PoemDetails({ poem, currentLang }: PoemDetailsProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const { poet, fetchPoet } = usePoetStore();

  // Fetch poet data when component mounts
  useEffect(() => {
    if (typeof poem.poet === "string") {
      fetchPoet(poem.poet);
    } else if (isPoetObject(poem.poet)) {
      fetchPoet(poem.poet._id.toString());
    }
  }, [poem.poet, fetchPoet]);

  // Poet information with fallback
  const poetName =
    poet?.name || (isPoetObject(poem.poet) ? poem.poet.name : "Unknown Poet");
  const poetImage =
    poet?.profilePicture?.url ??
    (isPoetObject(poem.poet)
      ? poem.poet.profilePicture?.url ?? "/placeholder.svg?height=64&width=64"
      : "/placeholder.svg?height=64&width=64");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowTitle(scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: poem.title[currentLang],
        text: poem.content[currentLang][0]?.couplet,
        url: window.location.href,
      });
    }
  };

  const formatCouplet = (couplet: string) => {
    return couplet.replace(/\n/g, "\n");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/poems">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>

            {showTitle && (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-lg truncate">
                  {poem.title[currentLang]}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  by {poetName}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Language Switcher */}
        <div className="mb-6 p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">
              Read in other languages:
            </span>
          </div>
          <div className="flex gap-2">
            {(["en", "hi", "ur"] as const).map((lang) => (
              <Button
                key={lang}
                variant={currentLang === lang ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={`/poems/${lang}/${poem.slug[lang]}`}>
                  {languageNames[lang]}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Poet Info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 overflow-hidden">
            <Image
              src={poetImage}
              alt={poetName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              {poetName}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(poem.createdAt, { addSuffix: true })}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {poem.category}
              </Badge>
            </div>
          </div>
        </div>

        {/* Poem Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 leading-tight text-center">
            {poem.title[currentLang]}
          </h1>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{poem.viewsCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bookmark className="h-4 w-4" />
              <span>{poem.bookmarkCount.toLocaleString()}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {poem.status}
            </Badge>
          </div>
        </div>

        {/* Cover Image */}
        {poem.coverImage && (
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-8">
            <Image
              src={poem.coverImage || "/placeholder.svg"}
              alt={poem.title[currentLang]}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Poem Content */}
        <div className="space-y-8 mb-8">
          {poem.content[currentLang].map((item, index) => (
            <div key={index} className="text-center">
              <div className="max-w-2xl mx-auto">
                <p className="text-xl md:text-2xl leading-relaxed font-medium mb-4 whitespace-pre-line">
                  {formatCouplet(item.couplet)}
                </p>
                {item.meaning && (
                  <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-4 text-left">
                    {item.meaning}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Topics */}
        {poem.topics.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {poem.topics.map((topic) => (
              <Badge key={topic} variant="outline">
                #{topic}
              </Badge>
            ))}
          </div>
        )}

        {/* Summary */}
        {poem.summary[currentLang] && (
          <div className="mb-8 p-6 rounded-lg bg-muted/30">
            <h3 className="text-lg font-semibold mb-3">Summary</h3>
            <p className="text-muted-foreground leading-relaxed">
              {poem.summary[currentLang]}
            </p>
          </div>
        )}

        {/* Did You Know */}
        {poem.didYouKnow[currentLang] && (
          <div className="mb-8 p-6 rounded-lg bg-muted/30">
            <h3 className="text-lg font-semibold mb-3">Did You Know</h3>
            <p className="text-muted-foreground leading-relaxed">
              {poem.didYouKnow[currentLang]}
            </p>
          </div>
        )}

        {/* FAQs */}
        {poem.faqs.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              {poem.faqs.map((faq, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">
                    {faq.question[currentLang] ||
                      faq.question.en ||
                      "Question not available"}
                  </h4>
                  <p className="text-muted-foreground">
                    {faq.answer[currentLang] ||
                      faq.answer.en ||
                      "Answer not available"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-50 bg-background/80 backdrop-blur-md border-t border-border w-full">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className={`flex-1 ${isLiked ? "text-red-500" : ""}`}
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart
                className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`}
              />
              Like
            </Button>

            <Button
              variant="ghost"
              className={`flex-1 ${isBookmarked ? "text-primary" : ""}`}
              onClick={() => setIsBookmarked(!isBookmarked)}
            >
              <Bookmark
                className={`h-4 w-4 mr-2 ${isBookmarked ? "fill-current" : ""}`}
              />
              Save
            </Button>

            <Button variant="ghost" className="flex-1" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
