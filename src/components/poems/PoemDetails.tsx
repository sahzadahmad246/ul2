// src/components/poems/PoemDetails.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SerializedPoem } from "@/types/poemTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Sparkles,
  Quote,
  User,
  Tag,
  Info,
  HelpCircle,
  Globe,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUserStore } from "@/store/user-store";
import { usePoemStore } from "@/store/poem-store";
import { toast } from "sonner";

interface PoemDetailsProps {
  poem: SerializedPoem;
  currentLang: "en" | "hi" | "ur";
}

function isPoetObject(
  poet: {
    _id: string;
    name: string;
    role?: string;
    profilePicture?: { 
      publicId?: string; 
      url: string 
    };
    slug?: string;
  } | null,
): poet is {
  _id: string;
  name: string;
  role?: string;
  profilePicture?: { publicId?: string; url: string };
  slug?: string;
} {
  return poet !== null && typeof poet === "object" && "name" in poet;
}

const languageNames = {
  en: "English",
  hi: "हिंदी",
  ur: "اردو",
};

export default function PoemDetails({ poem, currentLang }: PoemDetailsProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [openFAQs, setOpenFAQs] = useState<number[]>([]);
  const { userData, fetchUserData } = useUserStore();
  const { bookmarkPoem } = usePoemStore();

  useEffect(() => {
    if (userData?._id && poem) {
      const userId = userData._id.toString();
      setIsBookmarked(
        userData.bookmarks?.some((b) => b.poemId.toString() === poem._id.toString()) ||
          poem.bookmarks?.some((bookmark) => bookmark.userId.toString() === userId) ||
          false,
      );
    } else {
      setIsBookmarked(false);
    }
  }, [userData, poem]);

  const poetName = isPoetObject(poem.poet) ? poem.poet.name : "Unknown Poet";
  const poetImage = isPoetObject(poem.poet)
    ? poem.poet.profilePicture?.url ?? "/placeholder.svg?height=64&width=64"
    : "/placeholder.svg?height=64&width=64";

  // Debug poet data
  useEffect(() => {
    console.log(`PoemDetails poet data for poem ${poem._id}:`, poem.poet);
  }, [poem._id, poem.poet]);

  useEffect(() => {
    const handleScroll = () => {
      setShowTitle(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBookmark = async () => {
    if (!userData?._id) {
      toast.error("Please log in to bookmark poems");
      return;
    }

    setActionLoading(true);
    const previousIsBookmarked = isBookmarked;
    setIsBookmarked(!isBookmarked);

    try {
      const result = await bookmarkPoem(poem._id, userData._id, isBookmarked ? "remove" : "add");
      if (result.success) {
        await fetchUserData();
        toast.success(isBookmarked ? "Poem removed from bookmarks" : "Poem bookmarked");
      } else {
        throw new Error(result.message || "Failed to update bookmark");
      }
    } catch (error) {
      console.error("Failed to bookmark poem:", error);
      toast.error("Failed to bookmark poem");
      setIsBookmarked(previousIsBookmarked);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: poem.title[currentLang],
        text: poem.content[currentLang][0]?.couplet,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Poem link copied to clipboard");
    }
  };

  const formatCouplet = (couplet: string) => {
    return couplet;
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQs((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hover:bg-muted/80">
              <Link href="/poems">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to poems</span>
              </Link>
            </Button>
            {showTitle && (
              <div className="flex-1 min-w-0 animate-in slide-in-from-left-2 duration-300">
                <h2 className="font-semibold text-lg truncate">{poem.title[currentLang]}</h2>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {poetName}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Language Switcher */}
        <div className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Available Languages</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["en", "hi", "ur"] as const).map((lang) => (
              <Button
                key={lang}
                variant={currentLang === lang ? "default" : "outline"}
                size="sm"
                asChild
                className="transition-all duration-200"
              >
                <Link href={`/poems/${lang}/${poem.slug[lang]}`}>{languageNames[lang]}</Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Enhanced Poet Info */}
        <div className="flex items-start gap-6 p-6 rounded-xl bg-card/50 backdrop-blur-sm border shadow-sm">
          <div className="flex-shrink-0 relative">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 overflow-hidden ring-2 ring-primary/20">
              <Image
                src={poetImage}
                alt={`${poetName} - Poet`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-primary rounded-full flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xl mb-2">{poetName}</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(poem.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {poem.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {poem.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Enhanced Poem Title */}
        <div className="text-center space-y-6 py-8">
          <div className="relative">
            <Quote className="absolute -top-4 -left-4 h-8 w-8 text-primary/20 transform -rotate-12" />
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {poem.title[currentLang]}
            </h1>
            <Quote className="absolute -bottom-4 -right-4 h-8 w-8 text-primary/20 transform rotate-12 scale-x-[-1]" />
          </div>

          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{(poem.viewsCount || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
              <Bookmark className="h-4 w-4 text-primary/80" />
              <span className="font-medium">{(poem.bookmarkCount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* SEO Optimized Cover Image */}
        {poem.coverImage?.url && (
          <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={poem.coverImage.url || "/placeholder.svg"}
              alt={`Cover image for "${poem.title[currentLang]}" by ${poetName} - Poetry illustration`}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        {/* Enhanced Poem Content */}
        <div className="space-y-8 py-6">
          {poem.content[currentLang].map((item, index) => (
            <div key={index} className="relative">
              <div className="max-w-3xl mx-auto">
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border shadow-sm">
                  <div className="absolute top-3 left-3 text-primary/30 font-mono text-xs">{index + 1}</div>
                  <div className="text-sm md:text-base leading-relaxed font-mono text-foreground/90 mb-4 whitespace-pre-line">
                    {formatCouplet(item.couplet)}
                  </div>
                  {item.meaning && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <div className="flex items-start gap-2 text-left">
                        <Info className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground italic leading-relaxed">{item.meaning}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Topics */}
        {poem.topics.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {poem.topics.map((topic: string) => (
              <Badge
                key={topic}
                variant="outline"
                className="px-3 py-1 text-sm hover:bg-primary/10 transition-colors cursor-pointer"
              >
                #{topic}
              </Badge>
            ))}
          </div>
        )}

        {/* Enhanced Summary */}
        {poem.summary[currentLang] && (
          <div className="p-6 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Summary</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">{poem.summary[currentLang]}</p>
          </div>
        )}

        {/* Enhanced Did You Know */}
        {poem.didYouKnow[currentLang] && (
          <div className="p-6 rounded-xl bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-lg font-semibold">Did You Know?</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">{poem.didYouKnow[currentLang]}</p>
          </div>
        )}

        {/* Enhanced FAQs with Dropdown */}
        {poem.faqs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
            </div>
            <div className="space-y-3">
              {poem.faqs.map((faq, index) => (
                <Collapsible key={index} open={openFAQs.includes(index)}>
                  <CollapsibleTrigger
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium pr-4">{faq.question[currentLang] || faq.question.en}</h4>
                      {openFAQs.includes(index) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <p className="text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
                      {faq.answer[currentLang] || faq.answer.en}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Sticky Footer */}
      <div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-around max-w-md mx-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{(poem.viewsCount || 0).toLocaleString()}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-2 transition-all duration-200 ${
                isBookmarked ? "text-primary bg-primary/10" : "hover:bg-muted/80"
              }`}
              onClick={handleBookmark}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-primary border-muted" />
              ) : (
                <Bookmark
                  className={`h-4 w-4 transition-all duration-200 ${isBookmarked ? "fill-current scale-110" : ""}`}
                />
              )}
              <span className="font-medium">{(poem.bookmarkCount || 0).toLocaleString()}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 hover:bg-muted/80 transition-colors"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Share</span>
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .poetry-text {
          line-height: 1.8;
          letter-spacing: 0.02em;
        }
      `}</style>
    </div>
  );
}