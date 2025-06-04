"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePoemStore } from "@/store/poem-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, User, Eye, Bookmark, Share2 } from "lucide-react";
import type { SerializedPoem } from "@/types/poemTypes";

interface RecommendedPoemsProps {
  currentPoem: SerializedPoem;
  currentLang: "en" | "hi" | "ur";
}

const localizedStrings = {
  en: {
    moreByPoet: (poet: string) => `More by ${poet}`,
    poemsInCategory: (category: string) => `More in ${category}`,
    seeAll: "See All",
    noPoems: "No related poems found.",
    sharePoem: "Share poem",
  },
  hi: {
    moreByPoet: (poet: string) => `${poet} द्वारा और`,
    poemsInCategory: (category: string) => `${category} में कविताएँ`,
    seeAll: "सभी देखें",
    noPoems: "कोई संबंधित कविताएँ नहीं मिलीं।",
    sharePoem: "कविता साझा करें",
  },
  ur: {
    moreByPoet: (poet: string) => `${poet} کی طرف سے مزید`,
    poemsInCategory: (category: string) => `${category} میں نظمیں`,
    seeAll: "سب دیکھیں",
    noPoems: "کوئی متعلقہ نظمیں نہیں ملیں۔",
    sharePoem: "نظم شیئر کریں",
  },
};

function PoemCard({
  poem,
  currentLang,
  onShare,
}: {
  poem: SerializedPoem;
  currentLang: "en" | "hi" | "ur";
  onShare: (poem: SerializedPoem) => void;
}) {
  const isUrdu = currentLang === "ur";
  const textDirection = isUrdu ? "rtl" : "ltr";
  const fontClass = isUrdu ? "font-noto-nastaliq" : "font-inter";

  // Get first couplet and format it with line breaks
  const firstCouplet = poem.content[currentLang][0]?.couplet || "";
  const formattedCouplet = firstCouplet.split("\n").map((line, index) => (
    <span key={index}>
      {line}
      {index < firstCouplet.split("\n").length - 1 && <br />}
    </span>
  ));

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border w-full">
      <CardContent className="p-8">
        <Link href={`/poems/${currentLang}/${poem.slug[currentLang]}`}>
          <div
            className={`relative ${isUrdu ? "pr-6" : "pl-6"} mb-6`}
            dir={textDirection}
          >
            {/* Vertical gradient line */}
            <div
              className={`absolute top-0 ${
                isUrdu ? "right-0" : "left-0"
              } w-1 h-full bg-gradient-to-b from-foreground via-foreground/60 to-transparent rounded-full`}
            />

            {/* Couplet content */}
            <div
              className={`${fontClass} text-xl leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors`}
            >
              {formattedCouplet}
            </div>
          </div>
        </Link>

        {/* Metadata section */}
        <div
          className={`flex items-center justify-between pt-4 border-t border-border/30 ${fontClass}`}
          dir={textDirection}
        >
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-foreground">
              {poem.poet?.name || "Unknown Poet"}
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {poem.viewsCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="h-4 w-4" />
                {poem.bookmarkCount || 0}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onShare(poem);
            }}
            className="h-10 w-10 p-0 hover:bg-muted/50"
            aria-label={localizedStrings[currentLang].sharePoem}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RecommendedPoems({
  currentPoem,
  currentLang,
}: RecommendedPoemsProps) {
  const { poems, poetWorks, fetchPoems, fetchPoetWorks, loading, poetLoading } =
    usePoemStore();
  const t = localizedStrings[currentLang];
  const poetSlug = currentPoem.poet?.slug || "unknown";
  const poetName = currentPoem.poet?.name || "Unknown Poet";
  const category = currentPoem.category || "all";

  useEffect(() => {
    // Fetch poems in the same category, excluding the current poem
    fetchPoems(1, 3, category);
    // Fetch poems by the same poet
    fetchPoetWorks(poetSlug, "all", 1, 3);
  }, [category, poetSlug, fetchPoems, fetchPoetWorks]);

  // Filter out the current poem from category poems
  const categoryPoems = poems
    .filter(
      (poem) =>
        poem.category === category &&
        poem._id !== currentPoem._id &&
        poem.slug[currentLang] !== currentPoem.slug[currentLang]
    )
    .slice(0, 3);

  // Filter out the current poem from poet works
  const poetPoems = (poetWorks[poetSlug] || [])
    .filter(
      (poem) =>
        poem._id !== currentPoem._id &&
        poem.slug[currentLang] !== currentPoem.slug[currentLang]
    )
    .slice(0, 3);

  const isUrdu = currentLang === "ur";
  const textDirection = isUrdu ? "rtl" : "ltr";
  const fontClass = isUrdu ? "font-noto-nastaliq" : "font-inter";

  const handleShare = async (poem: SerializedPoem) => {
    const shareData = {
      title: poem.title[currentLang],
      text: `${poem.content[currentLang][0]?.couplet || ""} - ${
        poem.poet?.name
      }`,
      url: `${window.location.origin}/poems/${currentLang}/${poem.slug[currentLang]}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(
          `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`
        );
        // You might want to show a toast notification here
      } catch (err) {
        console.log("Error copying to clipboard:", err);
      }
    }
  };

  return (
    <section className="space-y-8 py-8">
      {/* Poems by Category */}
      <div>
        <h2
          className={`flex items-center gap-2 mb-6 text-xl font-semibold ${fontClass}`}
          dir={textDirection}
        >
          <BookOpen className="h-5 w-5 text-primary" />
          {t.poemsInCategory(category)}
        </h2>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse w-full">
                <CardContent className="p-8">
                  <div className="h-24 bg-muted rounded mb-6"></div>
                  <div className="h-5 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : categoryPoems.length > 0 ? (
          <div className="space-y-4">
            {categoryPoems.map((poem) => (
              <PoemCard
                key={poem._id}
                poem={poem}
                currentLang={currentLang}
                onShare={handleShare}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">{t.noPoems}</p>
        )}
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            asChild
            className={fontClass}
            aria-label={`See all poems in ${category}`}
          >
            <Link
              href={`/poems/${currentLang}/category/${encodeURIComponent(
                category
              )}`}
            >
              {t.seeAll}
            </Link>
          </Button>
        </div>
      </div>

      {/* Poems by Poet */}
      <div>
        <h2
          className={`flex items-center gap-2 mb-6 text-xl font-semibold ${fontClass}`}
          dir={textDirection}
        >
          <User className="h-5 w-5 text-primary" />
          {t.moreByPoet(poetName)}
        </h2>
        {poetLoading[poetSlug] ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse w-full">
                <CardContent className="p-8">
                  <div className="h-24 bg-muted rounded mb-6"></div>
                  <div className="h-5 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : poetPoems.length > 0 ? (
          <div className="space-y-4">
            {poetPoems.map((poem) => (
              <PoemCard
                key={poem._id}
                poem={poem}
                currentLang={currentLang}
                onShare={handleShare}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">{t.noPoems}</p>
        )}
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            asChild
            className={fontClass}
            aria-label={`See all poems by ${poetName}`}
          >
            <Link href={`/poets/${poetSlug}`}>{t.seeAll}</Link>
          </Button>
        </div>
      </div>

      <style jsx>{`
        .font-noto-nastaliq {
          font-family: var(--font-noto-nastaliq), "Noto Nastaliq Urdu",
            sans-serif;
        }
        .font-inter {
          font-family: var(--font-inter), "Inter", sans-serif;
        }
      `}</style>
    </section>
  );
}
