// /poems/page.js
"use client";

import PoemList from "@/components/poems/PoemList";

export default function PoemsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Poems</h1>
      <PoemList />
    </div>
  );
}