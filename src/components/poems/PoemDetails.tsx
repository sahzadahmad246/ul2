"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SerializedPoem } from "@/types/poemTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RecommendedPoems from "@/components/poems/RecommendedPoems";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  BookOpen,
  Heart,
  Languages,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUserStore } from "@/store/user-store";
import { usePoemStore } from "@/store/poem-store";
import { toast } from "sonner";
import { Download } from "lucide-react";
import DownloadCouplet from "./DownloadCouplet";
interface PoemDetailsProps {
  poem: SerializedPoem;
  currentLang: "en" | "hi" | "ur";
}

function isPoetObject(
  poet: {
    _id: string;
    name: string;
    role?: string;
    profilePicture?: { publicId?: string; url: string; alt?: string };
    slug?: string;
  } | null
): poet is {
  _id: string;
  name: string;
  role?: string;
  profilePicture?: { publicId?: string; url: string; alt?: string };
  slug?: string;
} {
  return poet !== null && typeof poet === "object" && "name" in poet;
}

const languageNames = {
  en: "English",
  hi: "हिंदी",
  ur: "اردو",
};

const localizedStrings = {
  en: {
    backToPoems: "Back to poems",
    availableLanguages: "Available Languages",
    published: "Published",
    summary: "Summary",
    didYouKnow: "Did You Know?",
    faqs: "Frequently Asked Questions",
    viewMeaning: "View Meaning",
    allTopics: "All Topics",
    coverImageAlt: (title: string, poet: string) =>
      `Cover image for "${title}" by ${poet}`,
    poetImageAlt: (poet: string) => `Profile picture of ${poet}`,
    relatedPoems: "Related Poems",
    share: "Share",
    moreByPoet: (poet: string) => `More by ${poet}`,
    poemsInCategory: (category: string) => `Poems in ${category}`,
  },
  hi: {
    backToPoems: "कविताओं पर वापस",
    availableLanguages: "उपलब्ध भाषाएँ",
    published: "प्रकाशित",
    summary: "सारांश",
    didYouKnow: "क्या आप जानते हैं?",
    faqs: "अक्सर पूछे जाने वाले प्रश्न",
    viewMeaning: "अर्थ देखें",
    allTopics: "सभी विषय",
    coverImageAlt: (title: string, poet: string) =>
      `"${title}" का कवर चित्र, ${poet} द्वारा`,
    poetImageAlt: (poet: string) => `${poet} की प्रोफाइल तस्वीर`,
    relatedPoems: "संबंधित कविताएँ",
    share: "साझा करें",
    moreByPoet: (poet: string) => `${poet} द्वारा और`,
    poemsInCategory: (category: string) => `${category} में कविताएँ`,
  },
  ur: {
    backToPoems: "نظمیں واپس",
    availableLanguages: "دستیاب زبانیں",
    published: "شائع شدہ",
    summary: "خلاصہ",
    didYouKnow: "کیا آپ جانتے ہیں؟",
    faqs: "اکثر پوچھے گئے سوالات",
    viewMeaning: "معنی دیکھیں",
    allTopics: "تمام موضوعات",
    coverImageAlt: (title: string, poet: string) =>
      `"${title}" کے لئے کور تصویر، ${poet} کی طرف سے`,
    poetImageAlt: (poet: string) => `${poet} کی پروفائل تصویر`,
    relatedPoems: "متعلقہ نظمیں",
    share: "شیئر کریں",
    moreByPoet: (poet: string) => `${poet} کی طرف سے مزید`,
    poemsInCategory: (category: string) => `${category} میں نظمیں`,
  },
};

export default function EnhancedPoemDetails({
  poem,
  currentLang,
}: PoemDetailsProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [openFAQs, setOpenFAQs] = useState<number[]>([]);
  const [topicsDialogOpen, setTopicsDialogOpen] = useState(false);
  const [meaningDialogOpen, setMeaningDialogOpen] = useState(false);
  const [selectedCouplet, setSelectedCouplet] = useState<{
    couplet: string;
    meaning: string;
  } | null>(null);
  const [fullViewDialogOpen, setFullViewDialogOpen] = useState(false);
  const { userData, fetchUserData } = useUserStore();
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const { bookmarkPoem } = usePoemStore();

  const t = localizedStrings[currentLang];

  useEffect(() => {
    if (userData?._id && poem) {
      const userId = userData._id.toString();
      setIsBookmarked(
        userData.bookmarks?.some(
          (b) => b.poemId.toString() === poem._id.toString()
        ) ||
          poem.bookmarks?.some(
            (bookmark) => bookmark.userId.toString() === userId
          ) ||
          false
      );
    } else {
      setIsBookmarked(false);
    }
  }, [userData, poem]);

  const poetName = isPoetObject(poem.poet) ? poem.poet.name : "Unknown Poet";
  const poetImage = isPoetObject(poem.poet)
    ? poem.poet.profilePicture?.url ?? "/placeholder.svg?height=64&width=64"
    : "/placeholder.svg?height=64&width=64";
  const poetSlug = isPoetObject(poem.poet) ? poem.poet.slug : "unknown";
  const poetImageAlt = isPoetObject(poem.poet)
    ? poem.poet.profilePicture?.alt ?? t.poetImageAlt(poetName)
    : t.poetImageAlt("Unknown Poet");

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
      const result = await bookmarkPoem(
        poem._id,
        userData._id,
        isBookmarked ? "remove" : "add"
      );
      if (result.success) {
        await fetchUserData();
        toast.success(
          isBookmarked ? "Poem removed from bookmarks" : "Poem bookmarked"
        );
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
        text:
          poem.content[currentLang][0]?.couplet ||
          poem.summary[currentLang] ||
          "",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Poem link copied to clipboard");
    }
  };

  const formatCouplet = useMemo(
    () => (couplet: string) =>
      couplet.split("\n").map((line, index) => (
        <div key={index} className="leading-relaxed">
          {line}
        </div>
      )),
    []
  );

  const toggleFAQ = (index: number) => {
    setOpenFAQs((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const openMeaningDialog = (couplet: string, meaning: string) => {
    setSelectedCouplet({ couplet, meaning });
    setMeaningDialogOpen(true);
  };

  const isUrdu = currentLang === "ur";
  const textDirection = isUrdu ? "rtl" : "ltr";
  const fontClass = isUrdu ? "font-noto-nastaliq" : "font-inter";

  // FAQ Schema for Rich Snippets
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: poem.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question[currentLang] || faq.question.en,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer[currentLang] || faq.answer.en,
      },
    })),
  };

  // Fallback content if currentLang content is missing
  const displayContent =
    poem.content[currentLang].length > 0
      ? poem.content[currentLang]
      : poem.content.en.length > 0
      ? poem.content.en
      : [];
  const contentLang = poem.content[currentLang].length > 0 ? currentLang : "en";
  const contentNotice = poem.content[currentLang].length === 0 &&
    poem.content.en.length > 0 && (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          {t.availableLanguages} not available in {languageNames[currentLang]}.
          Showing {languageNames.en} version.
        </p>
      </div>
    );

  return (
    <article className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* FAQ Schema */}
      {poem.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hover:bg-muted/80"
              aria-label={t.backToPoems}
            >
              <Link href="/poems">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">{t.backToPoems}</span>
              </Link>
            </Button>
            {showTitle && (
              <div className="flex-1 min-w-0 animate-in slide-in-from-left-2 duration-300">
                <h2 className="font-semibold text-lg truncate">
                  {poem.title[currentLang]}
                </h2>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {poetName}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFullViewDialogOpen(true)}
              className="flex items-center gap-2"
              aria-label="View full poem"
            >
              <BookOpen className="h-4 w-4" />
              Full View
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Language Switcher */}
        <section className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm">
          <h2 className="flex items-center gap-2 mb-4">
            <Languages className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t.availableLanguages}</span>
            <Badge variant="secondary" className="text-xs">
              {Object.keys(poem.title).length} languages
            </Badge>
          </h2>
          <div className="flex flex-wrap gap-2">
            {(["en", "hi", "ur"] as const).map((lang) => (
              <Button
                key={lang}
                variant={currentLang === lang ? "default" : "outline"}
                size="sm"
                asChild
                className="transition-all duration-200"
              >
                <Link
                  href={`/poems/${lang}/${poem.slug[lang]}`}
                  hrefLang={lang}
                >
                  <Globe className="h-3 w-3 mr-1" />
                  {languageNames[lang]}
                </Link>
              </Button>
            ))}
          </div>
        </section>

        {/* Poet Section */}
        <section className="flex items-start gap-6 p-6 rounded-xl bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm border">
          <div className="flex-shrink-0 relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 overflow-hidden ring-2 ring-primary/20">
              <Image
                src={poetImage}
                alt={poetImageAlt}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/poets/${poetSlug}`}>
              <h3 className="font-bold text-2xl mb-2 hover:text-primary transition-colors">
                {poetName}
              </h3>
            </Link>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {t.published}{" "}
                  {formatDistanceToNow(new Date(poem.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <Badge
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                <Tag className="h-3 w-3" />
                {poem.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {poem.status}
              </Badge>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="font-medium">
                  {(poem.viewsCount || 0).toLocaleString()} views
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="font-medium">
                  {(poem.bookmarkCount || 0).toLocaleString()} likes
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Poem Title */}
        <section className="text-center space-y-6 py-8">
          <div className="relative">
            <Quote className="absolute -top-4 -left-4 h-8 w-8 text-primary/20 transform -rotate-12" />
            <h1 className="text-3xl md:text-4xl font-bold leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {poem.title[currentLang]}
            </h1>
            <Quote className="absolute -bottom-4 -right-4 h-8 w-8 text-primary/20 transform rotate-12 scale-x-[-1]" />
          </div>
        </section>

        {/* Cover Image */}
        {poem.coverImage?.url && (
          <section className="relative h-72 md:h-96 rounded-2xl overflow-hidden">
            <Image
              src={poem.coverImage.url}
              alt={t.coverImageAlt(poem.title[currentLang], poetName)}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </section>
        )}

        {/* Content Fallback Notice */}
        {contentNotice}

        {/* Poem Content */}
        <section
          className="space-y-6 py-6"
          dir={textDirection}
          lang={contentLang}
        >
          {displayContent.map((item, index) => (
            <article key={index} className="relative">
              <div className="max-w-2xl mx-auto">
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border group hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-3 left-3 text-primary/30 font-mono text-xs">
                    {index + 1}
                  </div>
                  <div className="relative mb-4">
                    <div
                      className={`relative ${
                        isUrdu ? "pr-6" : "pl-6"
                      } ${fontClass}`}
                      dir={textDirection}
                      lang={contentLang}
                    >
                      <div
                        className={`absolute ${
                          isUrdu ? "right-0" : "left-0"
                        } top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/40 rounded-full`}
                      />
                      <div className="text-lg md:text-xl leading-loose text-foreground/90 space-y-2">
                        {formatCouplet(item.couplet)}
                      </div>
                    </div>
                  </div>
                  {item.meaning && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openMeaningDialog(item.couplet, item.meaning!)
                        }
                        className="flex items-center gap-2 text-xs"
                      >
                        <Info className="h-3 w-3" />
                        View Meaning
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Topics */}
        {poem.topics.length > 0 && (
          <section
            className={`flex justify-center gap-2 flex-wrap max-w-full ${fontClass}`}
            dir={textDirection}
          >
            {poem.topics.slice(0, 3).map((topic: string) => (
              <Badge
                key={topic}
                variant="outline"
                className={`px-3 py-1 text-sm hover:bg-primary/10 transition-colors cursor-pointer ${fontClass}`}
                asChild
              >
                <Link
                  href={`/poems/${currentLang}/category/${encodeURIComponent(
                    topic
                  )}`}
                >
                  #{topic}
                </Link>
              </Badge>
            ))}
            {poem.topics.length > 3 && (
              <Dialog
                open={topicsDialogOpen}
                onOpenChange={setTopicsDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 px-3 bg-primary/10 hover:bg-primary/20 text-primary font-medium ${fontClass}`}
                    aria-label={`Show ${poem.topics.length - 3} more topics`}
                  >
                    +{poem.topics.length - 3} more
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle
                      className={`flex items-center gap-2 ${fontClass}`}
                    >
                      <Tag className="h-5 w-5 text-primary" />
                      {t.allTopics}
                    </DialogTitle>
                  </DialogHeader>
                  <div
                    className={`flex flex-wrap gap-2 mt-4 ${fontClass}`}
                    dir={textDirection}
                  >
                    {poem.topics.map((topic: string) => (
                      <Badge
                        key={topic}
                        variant="secondary"
                        className={`text-sm bg-accent/50 hover:bg-accent/70 transition-colors ${fontClass}`}
                        asChild
                      >
                        <Link
                          href={`/poems/${currentLang}/category/${encodeURIComponent(
                            topic
                          )}`}
                        >
                          #{topic}
                        </Link>
                      </Badge>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </section>
        )}

        {/* Summary */}
        {(poem.summary[currentLang] || poem.summary.en) && (
          <section className="p-6 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <h2 className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-primary" />
              {t.summary}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {poem.summary[currentLang] || poem.summary.en}
            </p>
          </section>
        )}

        {/* Did You Know */}
        {(poem.didYouKnow[currentLang] || poem.didYouKnow.en) && (
          <section className="p-6 rounded-xl bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50">
            <h2 className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              {t.didYouKnow}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {poem.didYouKnow[currentLang] || poem.didYouKnow.en}
            </p>
          </section>
        )}

        {/* FAQs */}
        {poem.faqs.length > 0 && (
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 mb-6">
              <HelpCircle className="h-5 w-5 text-primary" />
              {t.faqs}
            </h2>
            <div className="space-y-3">
              {poem.faqs.map((faq, index) => (
                <Collapsible key={index} open={openFAQs.includes(index)}>
                  <CollapsibleTrigger
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors text-left"
                    aria-expanded={openFAQs.includes(index)}
                    aria-controls={`faq-content-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium pr-4">
                        {faq.question[currentLang] || faq.question.en}
                      </h3>
                      {openFAQs.includes(index) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent
                    id={`faq-content-${index}`}
                    className="px-4 pb-4"
                  >
                    <p className="text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
                      {faq.answer[currentLang] || faq.answer.en}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </section>
        )}
        <RecommendedPoems currentPoem={poem} currentLang={currentLang} />
        {/* Sticky Footer */}
        <footer className="sticky bottom-0 z-50 bg-background/95 backdrop-blur-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-around max-w-md mx-auto">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="font-medium">
                  {(poem.viewsCount || 0).toLocaleString()}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 transition-all duration-200 ${
                  isBookmarked
                    ? "text-primary bg-primary/10"
                    : "hover:bg-muted/80"
                }`}
                onClick={handleBookmark}
                disabled={actionLoading}
                aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                {actionLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-primary border-muted" />
                ) : (
                  <Bookmark
                    className={`h-4 w-4 transition-all duration-200 ${
                      isBookmarked ? "fill-current scale-110" : ""
                    }`}
                  />
                )}
                <span className="font-medium">
                  {(poem.bookmarkCount || 0).toLocaleString()}
                </span>
              </Button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/60 hover:shadow-md transition-all duration-300"
                onClick={() => setIsDownloadDialogOpen(true)}
              >
                <Download className="h-4 w-4" />
                <span className="text-sm font-semibold font-inter hidden sm:inline">
                  Download
                </span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 hover:bg-muted/80 transition-colors"
                onClick={handleShare}
                aria-label={t.share}
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">{t.share}</span>
              </Button>
            </div>
          </div>
        </footer>
        {/* Download Dialog */}
        <DownloadCouplet
          poemSlug={poem.slug.en}
          open={isDownloadDialogOpen}
          onOpenChange={setIsDownloadDialogOpen}
        />
        {/* Meaning Dialog */}
        <Dialog open={meaningDialogOpen} onOpenChange={setMeaningDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5 text-primary" />
                {t.viewMeaning}
              </DialogTitle>
            </DialogHeader>
            {selectedCouplet && (
              <div className="space-y-6">
                <div className="relative">
                  <div
                    className={`relative ${
                      isUrdu ? "pr-6" : "pl-6"
                    } ${fontClass}`}
                    dir={textDirection}
                    lang={contentLang}
                  >
                    <div
                      className={`absolute ${
                        isUrdu ? "right-0" : "left-0"
                      } top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/40 rounded-full`}
                    />
                    <div className="text-lg leading-loose text-foreground/90 space-y-2">
                      {formatCouplet(selectedCouplet.couplet)}
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedCouplet.meaning}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Full View Dialog */}
        <Dialog open={fullViewDialogOpen} onOpenChange={setFullViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {poem.title[currentLang]}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <div className="h-12 w-12 rounded-full overflow-hidden">
                  <Image
                    src={poetImage}
                    alt={poetImageAlt}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{poetName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(poem.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {displayContent.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-card/50">
                    <div className="relative">
                      <div
                        className={`relative ${
                          isUrdu ? "pr-6" : "pl-6"
                        } ${fontClass}`}
                        dir={textDirection}
                        lang={contentLang}
                      >
                        <div
                          className={`absolute ${
                            isUrdu ? "right-0" : "left-0"
                          } top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/40 rounded-full`}
                        />
                        <div className="text-base leading-loose text-foreground/90 space-y-1">
                          {formatCouplet(item.couplet)}
                        </div>
                      </div>
                    </div>
                    {item.meaning && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-start gap-2">
                          <Info className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground italic leading-relaxed">
                            {item.meaning}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <style jsx>{`
          .poetry-text {
            line-height: 1.8;
            letter-spacing: 0.02em;
          }
          .font-noto-nastaliq {
            font-family: var(--font-noto-nastaliq), "Noto Nastaliq Urdu",
              sans-serif;
          }
          .font-inter {
            font-family: var(--font-inter), "Inter", sans-serif;
          }
        `}</style>
      </div>
    </article>
  );
}
