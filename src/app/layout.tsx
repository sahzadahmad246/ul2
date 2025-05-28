// src/app/layout.tsx
import type React from "react";
import { Inter } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";
import ConditionalNavigation from "@/components/navigation/conditional-navigation";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
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