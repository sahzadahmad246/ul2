// src/app/components/PoemForm.tsx
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePoemStore } from "@/store/poem-store";
import { usePoetStore } from "@/store/poet-store";
import { useUserStore } from "@/store/user-store";
import type { IPoem } from "@/types/poemTypes";
import { Types } from "mongoose";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Trash2, Upload, FileText, Globe, Settings } from "lucide-react";

type Category = "poem" | "ghazal" | "sher" | "nazm" | "rubai" | "marsiya" | "qataa" | "other";
type Status = "draft" | "published";
type ContentLang = "en" | "hi" | "ur";

interface PoemFormProps {
  initialData?: IPoem;
  slug?: string;
}

// Define the type for the result returned by createPoem/updatePoem
interface PoemStoreResult {
  success: boolean;
  message?: string;
  errors?: { message: string }[];
}

const languageNames = {
  en: "English",
  hi: "हिंदी",
  ur: "اردو",
};

export default function PoemForm({ initialData, slug }: PoemFormProps) {
  const router = useRouter();
  const { createPoem, updatePoem, loading } = usePoemStore();
  const { poets, fetchPoetByIdentifier, loading: poetsLoading } = usePoetStore();
  const { userData } = useUserStore();
  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    title: initialData?.title || { en: "", hi: "", ur: "" },
    content: initialData?.content || {
      en: [{ couplet: "", meaning: "" }],
      hi: [{ couplet: "", meaning: "" }],
      ur: [{ couplet: "", meaning: "" }],
    },
    coverImage: null as File | null,
    topics: initialData?.topics || [],
    category: (initialData?.category || "poem") as Category,
    status: (initialData?.status || "published") as Status,
   poet:
  initialData?.poet
    ? typeof initialData.poet === "object" && "_id" in initialData.poet
      ? initialData.poet._id.toString()
      : (initialData.poet as Types.ObjectId).toString()
    : "",
    summary: {
      en: initialData?.summary?.en || "",
      hi: initialData?.summary?.hi || "",
      ur: initialData?.summary?.ur || "",
    },
    didYouKnow: {
      en: initialData?.didYouKnow?.en || "",
      hi: initialData?.didYouKnow?.hi || "",
      ur: initialData?.didYouKnow?.ur || "",
    },
    faqs: initialData?.faqs?.length
      ? initialData.faqs.map((faq) => ({
          question: {
            en: faq.question.en || "",
            hi: faq.question.hi || "",
            ur: faq.question.ur || "",
          },
          answer: {
            en: faq.answer.en || "",
            hi: faq.answer.hi || "",
            ur: faq.answer.ur || "",
          },
        }))
      : [{ question: { en: "", hi: "", ur: "" }, answer: { en: "", hi: "", ur: "" } }],
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [topicsInput, setTopicsInput] = useState<string>(formData.topics.join(", "));

  useEffect(() => {
    if (userData?.role === "admin") {
      fetchPoetByIdentifier(userData.slug);
    }
  }, [userData?.role, userData?.slug,  fetchPoetByIdentifier]);

  if (!userData?.role || (userData.role !== "admin" && userData.role !== "poet")) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to {isEdit ? "edit" : "create"} poems.</p>
        </CardContent>
      </Card>
    );
  }

  const handleContentChange = (lang: ContentLang, index: number, field: "couplet" | "meaning", value: string) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: prev.content[lang].map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      },
    }));
  };

  const addCouplet = (lang: ContentLang) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: [...prev.content[lang], { couplet: "", meaning: "" }],
      },
    }));
  };

  const removeCouplet = (lang: ContentLang, index: number) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: prev.content[lang].filter((_, i) => i !== index),
      },
    }));
  };

  const handleFaqChange = (index: number, field: "question" | "answer", lang: ContentLang, value: string) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => (i === index ? { ...faq, [field]: { ...faq[field], [lang]: value } } : faq)),
    }));
  };

  const addFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: { en: "", hi: "", ur: "" }, answer: { en: "", hi: "", ur: "" } }],
    }));
  };

  const removeFaq = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const handleTopicsChange = (value: string) => {
    setTopicsInput(value);
    const topics = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      topics,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validation
    const newErrors: string[] = [];
    if (!formData.title.en.trim() || !formData.title.hi.trim() || !formData.title.ur.trim()) {
      newErrors.push("All title fields are required");
    }
    if (!formData.content.en.length || !formData.content.hi.length || !formData.content.ur.length) {
      newErrors.push("At least one couplet is required for each language");
    }
    formData.faqs.forEach((faq, index) => {
      if (
        (!faq.question.en && !faq.question.hi && !faq.question.ur) ||
        (!faq.answer.en && !faq.answer.hi && !faq.answer.ur)
      ) {
        newErrors.push(`FAQ ${index + 1} must have at least one language for both question and answer`);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const data = new FormData();
    data.append("title[en]", formData.title.en);
    data.append("title[hi]", formData.title.hi);
    data.append("title[ur]", formData.title.ur);
    data.append("content", JSON.stringify(formData.content));
    if (formData.coverImage) data.append("coverImage", formData.coverImage);
    if (formData.topics.length) data.append("topics", JSON.stringify(formData.topics));
    data.append("category", formData.category);
    data.append("status", formData.status);
    data.append("summary[en]", formData.summary.en || "");
    data.append("summary[hi]", formData.summary.hi || "");
    data.append("summary[ur]", formData.summary.ur || "");
    data.append("didYouKnow[en]", formData.didYouKnow.en || "");
    data.append("didYouKnow[hi]", formData.didYouKnow.hi || "");
    data.append("didYouKnow[ur]", formData.didYouKnow.ur || "");
    data.append("faqs", JSON.stringify(formData.faqs));
    if (userData.role === "admin") {
      data.append("poet", formData.poet);
    }

    const result: PoemStoreResult = isEdit ? await updatePoem(slug!, data) : await createPoem(data);

    if (result.success) {
      router.push("/admin/poems");
    } else {
      setErrors([result.message || "An error occurred", ...(result.errors?.map((e) => e.message) || [])]);
    }
  };

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <FileText className="h-6 w-6" />
              {isEdit ? "Edit Poem" : "Create New Poem"}
            </CardTitle>
            <p className="text-muted-foreground">Share your poetry with the world in multiple languages</p>
          </CardHeader>

          <CardContent className="p-6">
            {errors.length > 0 && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {errors.map((err, i) => (
                    <p key={i} className="text-sm">
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="content" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="media" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Media
                  </TabsTrigger>
                  <TabsTrigger value="additional" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Extra
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 mt-6">
                  <div className="grid gap-6">
                    {(["en", "hi", "ur"] as const).map((lang) => (
                      <div key={lang} className="space-y-2">
                        <Label htmlFor={`title-${lang}`} className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Title ({languageNames[lang]})
                        </Label>
                        <Input
                          id={`title-${lang}`}
                          value={formData.title[lang]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              title: { ...formData.title, [lang]: e.target.value },
                            })
                          }
                          required
                          placeholder={`Enter title in ${languageNames[lang]}`}
                          className="text-lg"
                        />
                      </div>
                    ))}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value: Category) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {["poem", "ghazal", "sher", "nazm", "rubai", "marsiya", "qataa", "other"].map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value: Status) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {userData.role === "admin" && (
                      <div className="space-y-2">
                        <Label htmlFor="poet">Poet</Label>
                        <Select
                          value={formData.poet}
                          onValueChange={(value) => setFormData({ ...formData, poet: value })}
                          disabled={poetsLoading}
                        >
                          <SelectTrigger id="poet">
                            <SelectValue placeholder="Select poet" />
                          </SelectTrigger>
                          <SelectContent>
                            {poets.map((poet) => (
                              <SelectItem key={poet._id} value={poet._id}>
                                {poet.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="content" className="mt-6">
                  <Tabs defaultValue="en" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      {(["en", "hi", "ur"] as const).map((lang) => (
                        <TabsTrigger key={lang} value={lang}>
                          {languageNames[lang]}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {(["en", "hi", "ur"] as const).map((lang) => (
                      <TabsContent key={lang} value={lang} className="space-y-4 mt-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{languageNames[lang]} Content</h3>
                          <Button type="button" variant="outline" size="sm" onClick={() => addCouplet(lang)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Couplet
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {formData.content[lang].map((item, index) => (
                            <Card key={index} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Couplet {index + 1}</Label>
                                  {formData.content[lang].length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeCouplet(lang, index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                <Textarea
                                  placeholder="Enter your couplet here..."
                                  value={item.couplet}
                                  onChange={(e) => handleContentChange(lang, index, "couplet", e.target.value)}
                                  required
                                  rows={3}
                                  className="resize-none"
                                />
                                <Textarea
                                  placeholder="Enter meaning or explanation (optional)"
                                  value={item.meaning || ""}
                                  onChange={(e) => handleContentChange(lang, index, "meaning", e.target.value)}
                                  rows={2}
                                  className="resize-none"
                                />
                              </div>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </TabsContent>

                <TabsContent value="media" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="coverImage" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Cover Image
                    </Label>
                    <Input
                      id="coverImage"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => setFormData({ ...formData, coverImage: e.target.files?.[0] || null })}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    <p className="text-xs text-muted-foreground">Upload a JPEG or PNG image (max 5MB)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topics">Topics</Label>
                    <Input
                      id="topics"
                      value={topicsInput}
                      onChange={(e) => handleTopicsChange(e.target.value)}
                      placeholder="e.g., love, nature, life, philosophy"
                    />
                    <p className="text-xs text-muted-foreground">Separate topics with commas (max 10 topics)</p>
                    {formData.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.topics.map((topic, index) => (
                          <Badge key={index} variant="secondary">
                            #{topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="space-y-6 mt-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Summary</h3>
                      <div className="space-y-4">
                        {(["en", "hi", "ur"] as const).map((lang) => (
                          <div key={lang} className="space-y-2">
                            <Label htmlFor={`summary-${lang}`}>Summary ({languageNames[lang]})</Label>
                            <Textarea
                              id={`summary-${lang}`}
                              value={formData.summary[lang] || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  summary: { ...formData.summary, [lang]: e.target.value },
                                })
                              }
                              rows={3}
                              placeholder={`Enter summary in ${languageNames[lang]}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Did You Know</h3>
                      <div className="space-y-4">
                        {(["en", "hi", "ur"] as const).map((lang) => (
                          <div key={lang} className="space-y-2">
                            <Label htmlFor={`didYouKnow-${lang}`}>Did You Know ({languageNames[lang]})</Label>
                            <Textarea
                              id={`didYouKnow-${lang}`}
                              value={formData.didYouKnow[lang] || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  didYouKnow: { ...formData.didYouKnow, [lang]: e.target.value },
                                })
                              }
                              rows={3}
                              placeholder={`Enter interesting facts in ${languageNames[lang]}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">FAQs</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add FAQ
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {formData.faqs.map((faq, index) => (
                          <Card key={index} className="p-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">FAQ {index + 1}</Label>
                                {formData.faqs.length > 1 && (
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFaq(index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              {(["en", "hi", "ur"] as const).map((lang) => (
                                <div key={lang} className="space-y-2">
                                  <Input
                                    placeholder={`Question (${languageNames[lang]})`}
                                    value={faq.question[lang] || ""}
                                    onChange={(e) => handleFaqChange(index, "question", lang, e.target.value)}
                                  />
                                  <Textarea
                                    placeholder={`Answer (${languageNames[lang]})`}
                                    value={faq.answer[lang] || ""}
                                    onChange={(e) => handleFaqChange(index, "answer", lang, e.target.value)}
                                    rows={2}
                                  />
                                </div>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || (userData.role === "admin" && poetsLoading)}
                  className="flex-1"
                >
                  {loading ? "Saving..." : isEdit ? "Update Poem" : "Create Poem"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}