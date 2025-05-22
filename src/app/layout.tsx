// src/app/layout.tsx
import type React from "react";
import { Inter } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";
import Navigation from "@/components/nav/navigation";
import { Toaster } from "sonner"; // Add this import
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Poetry Site",
  description: "A beautiful poetry site with a collection of poems, ghazals, and nazms",
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
          <Navigation>{children}</Navigation>
          <Toaster richColors /> {/* Add Toaster for notifications */}
        </ClientProviders>
      </body>
    </html>
  );
}