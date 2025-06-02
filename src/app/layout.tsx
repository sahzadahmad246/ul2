// src/app/layout.tsx
import type React from "react";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";
import ConditionalNavigation from "@/components/navigation/conditional-navigation";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";

// Configure Inter font for Latin text
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Configure Noto Nastaliq Urdu font for Urdu text
const notoNastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-noto-nastaliq",
});

export const metadata: Metadata = {
  title: "Poetry Site",
  description: "A beautiful poetry site with a collection of poems, ghazals, and nazms",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoNastaliq.variable}`}>
        <ClientProviders>
          <Suspense>
            <ConditionalNavigation>{children}</ConditionalNavigation>
            <Toaster richColors />
          </Suspense>
        </ClientProviders>
      </body>
    </html>
  );
}