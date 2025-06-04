"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePoemStore } from "@/store/poem-store";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  Download,
  BookOpen,
  Feather,
  Eye,
  Settings,
  ArrowLeft,
  ArrowRight,
  Star,
  Moon,
} from "lucide-react";

interface DownloadCoupletProps {
  poemSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DownloadCouplet({
  poemSlug,
  open,
  onOpenChange,
}: DownloadCoupletProps) {
  const { poem, fetchPoemByIdOrSlug, loading, error } = usePoemStore();
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi" | "ur">("en");
  const [selectedCoupletIndex, setSelectedCoupletIndex] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"customize" | "preview">("customize");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !poem) {
      fetchPoemByIdOrSlug(poemSlug).catch((err) => {
        console.error("[DownloadCouplet] Failed to fetch poem:", err);
      });
    }
  }, [open, poemSlug, fetchPoemByIdOrSlug, poem]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (open) {
      setActiveTab("customize");
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setSelectedImage(reader.result as string);
      reader.onerror = () => toast.error("Failed to read the image file");
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
    }
  };

  const drawImageOnCanvas = async () => {
    if (!canvasRef.current || !poem) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = 1080;
    canvas.height = 1080;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      if (selectedImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = selectedImage;
        });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        drawDefaultBackground(ctx, canvas.width, canvas.height);
      }

      const couplet = poem.content[selectedLanguage][selectedCoupletIndex]?.couplet || "";
      drawText(ctx, couplet, canvas.width, canvas.height);
      return canvas.toDataURL("image/png", 1.0);
    } catch (error) {
      console.error("Error drawing on canvas:", error);
      throw error;
    }
  };

  const drawDefaultBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.5, "#16213e");
    gradient.addColorStop(1, "#0f0f23");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    drawStars(ctx, width, height);
    drawMoon(ctx, width, height);
    drawOrnamentalCorners(ctx, width, height);
  };

  const drawStars = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    const starPositions = [
      { x: width * 0.1, y: height * 0.15, size: 3 },
      { x: width * 0.2, y: height * 0.25, size: 2 },
      { x: width * 0.85, y: height * 0.1, size: 4 },
      { x: width * 0.9, y: height * 0.3, size: 2 },
      { x: width * 0.15, y: height * 0.8, size: 3 },
      { x: width * 0.8, y: height * 0.85, size: 2 },
    ];
    starPositions.forEach((star) => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawMoon = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const moonX = width * 0.8;
    const moonY = height * 0.2;
    const moonRadius = 40;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawOrnamentalCorners = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    const cornerSize = 60;
    ctx.beginPath();
    ctx.moveTo(30, 30 + cornerSize);
    ctx.lineTo(30, 30);
    ctx.lineTo(30 + cornerSize, 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width - 30 - cornerSize, 30);
    ctx.lineTo(width - 30, 30);
    ctx.lineTo(width - 30, 30 + cornerSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(30, height - 30 - cornerSize);
    ctx.lineTo(30, height - 30);
    ctx.lineTo(30 + cornerSize, height - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width - 30 - cornerSize, height - 30);
    ctx.lineTo(width - 30, height - 30);
    ctx.lineTo(width - 30, height - 30 - cornerSize);
    ctx.stroke();
  };

  const drawText = (ctx: CanvasRenderingContext2D, text: string, width: number, height: number) => {
    const isUrdu = selectedLanguage === "ur";
    ctx.font = isUrdu ? 'bold 48px "Noto Nastaliq Urdu", serif' : 'bold 42px "Inter", sans-serif';
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    const lines = text.split("\n");
    const lineHeight = isUrdu ? 80 : 70;
    const totalHeight = lines.length * lineHeight;
    const startY = (height - totalHeight) / 2 + lineHeight / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line.trim(), width / 2, startY + index * lineHeight);
    });
  };

  const handleDownload = async () => {
    if (!poem) {
      toast.error("Cannot download: Missing poem data");
      return;
    }
    setIsDownloading(true);
    try {
      const dataUrl = await drawImageOnCanvas();
      if (!dataUrl) throw new Error("Failed to generate image");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${poem.title[selectedLanguage]}-couplet-${selectedCoupletIndex + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Image downloaded successfully");
    } catch {
      toast.error("Failed to download image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderPreview = () => {
    const couplet = poem?.content[selectedLanguage][selectedCoupletIndex]?.couplet || "Select a couplet";
    const isUrdu = selectedLanguage === "ur";
    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="relative w-full max-w-[250px] aspect-square mx-auto rounded-md shadow-md border border-white/20">
          <div
            className="absolute inset-0"
            style={{
              background: selectedImage
                ? `url(${selectedImage}) center/cover`
                : `radial-gradient(circle at center, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)`,
            }}
          />
          {selectedImage && <div className="absolute inset-0 bg-black/70" />}
          {!selectedImage && (
            <>
              <div className="absolute top-2 left-2">
                <Star className="h-2 w-2 text-white/60" />
              </div>
              <div className="absolute top-4 right-2">
                <Star className="h-3 w-3 text-white/70" />
              </div>
              <div className="absolute bottom-2 left-3">
                <Star className="h-2 w-2 text-white/50" />
              </div>
              <div className="absolute top-3 right-6">
                <Moon className="h-6 w-6 text-white/80" />
              </div>
              <div className="absolute top-1 left-1 w-4 h-4 border-l-2 border-t-2 border-white/30" />
              <div className="absolute top-1 right-1 w-4 h-4 border-r-2 border-t-2 border-white/30" />
              <div className="absolute bottom-1 left-1 w-4 h-4 border-l-2 border-b-2 border-white/30" />
              <div className="absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-white/30" />
            </>
          )}
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <p
              className={`text-white text-center font-bold ${isUrdu ? "font-noto-nastaliq text-[10px]" : "font-inter text-[9px]"}`}
              style={{
                textShadow: "0 2px 6px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.9)",
                direction: isUrdu ? "rtl" : "ltr",
                whiteSpace: "pre-wrap",
              }}
            >
              {couplet}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">Final image: 1080x1080 pixels</p>
      </div>
    );
  };

  const renderCustomizationSection = () => {
    // Function to truncate couplet text for display, shorter on mobile
    const truncateCouplet = (couplet: string) => {
      const maxLength = window.innerWidth < 640 ? 20 : 50; // Shorter truncation for mobile
      if (couplet.length <= maxLength) return couplet;
      return couplet.substring(0, maxLength - 3) + "...";
    };

    return (
      <div className="space-y-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm">Customize Poetry Image</h3>
            </div>
            <div className="flex flex-row gap-4">
              <div className="space-y-1 flex-1">
                <Label htmlFor="language" className="text-xs font-semibold flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-primary" /> Language
                </Label>
                <Select
                  value={selectedLanguage}
                  onValueChange={(value: "en" | "hi" | "ur") => {
                    setSelectedLanguage(value);
                    setSelectedCoupletIndex(0);
                  }}
                >
                  <SelectTrigger id="language" className="bg-background/80 border-primary/30 h-8 text-xs">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="ur">Urdu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 flex-1">
                <Label htmlFor="couplet" className="text-xs font-semibold flex items-center gap-1">
                  <Feather className="h-3 w-3 text-primary" /> Couplet
                </Label>
                <Select
                  value={selectedCoupletIndex.toString()}
                  onValueChange={(value) => setSelectedCoupletIndex(Number.parseInt(value))}
                >
                  <SelectTrigger id="couplet" className="bg-background/80 border-primary/30 h-8 text-xs">
                    <SelectValue placeholder="Select couplet" />
                  </SelectTrigger>
                  <SelectContent>
                    {poem?.content[selectedLanguage].map((item, index) => (
                      <SelectItem
                        key={index}
                        value={index.toString()}
                        className="text-xs overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        {truncateCouplet(item.couplet)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Upload className="h-3 w-3 text-primary" /> Background Image (Optional)
              </Label>
              <Input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                id="image-upload"
              />
              <Button
                variant="outline"
                className="w-full h-16 border-dashed border-primary/40 hover:border-primary/60 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-1">
                  <Upload className="h-6 w-6 text-primary" />
                  <span>{selectedImage ? "Change Background" : "Upload Background Image"}</span>
                </div>
              </Button>
              {selectedImage && (
                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded border border-green-200">
                  <span className="text-xs text-green-700 dark:text-green-300">✓ Custom background uploaded</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-xs"
                  >
                    Remove
                  </Button>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">Leave empty for starry night background</p>
            </div>
          </CardContent>
        </Card>
        <Button
          onClick={handleDownload}
          disabled={isDownloading || !poem?.content[selectedLanguage][selectedCoupletIndex]}
          className="w-full h-10 text-xs font-bold bg-primary hover:bg-primary/90"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" /> Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" /> Download Image
            </>
          )}
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-[50%] max-h-[90vh] overflow-y-auto overflow-x-hidden p-4">
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading poem...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!poem) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-[50%] max-h-[90vh] overflow-y-auto overflow-x-hidden p-4">
          <div className="flex justify-center items-center h-full">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Poem not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[50%] max-h-[90vh] overflow-y-auto overflow-x-hidden p-4">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-primary" />
            Download Poetry Image
          </DialogTitle>
        </DialogHeader>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "customize" | "preview")}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full h-8">
            <TabsTrigger value="customize" className="flex items-center gap-1 text-xs">
              <Settings className="h-3 w-3" /> Customize
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1 text-xs">
              <Eye className="h-3 w-3" /> Preview
            </TabsTrigger>
          </TabsList>
          <TabsContent value="customize" className="mt-2">
            {renderCustomizationSection()}
            <div className="flex justify-end mt-2">
              <Button onClick={() => setActiveTab("preview")} variant="outline" className="h-8 text-xs">
                Preview <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="preview" className="mt-2">
            {renderPreview()}
            <Button
              onClick={handleDownload}
              disabled={isDownloading || !poem?.content[selectedLanguage][selectedCoupletIndex]}
              className="w-full h-10 text-xs font-bold bg-primary hover:bg-primary/90 mt-2"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" /> Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" /> Download Image
                </>
              )}
            </Button>
            <div className="flex justify-start mt-2">
              <Button onClick={() => setActiveTab("customize")} variant="outline" className="h-8 text-xs">
                <ArrowLeft className="h-3 w-3 mr-1" /> Back to Customize
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        <canvas ref={canvasRef} style={{ display: "none" }} width={1080} height={1080} />
      </DialogContent>
    </Dialog>
  );
}