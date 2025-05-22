'use client'

import Image from 'next/image'

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Social Media Feed/Timeline */}
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
            {/* Post Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted overflow-hidden">
                <Image
                  src={`/placeholder.svg?height=40&width=40&text=P${i}`}
                  alt={`Poet ${i}`}
                  width={40}
                  height={40}
                />
              </div>
              <div>
                <h3 className="font-medium text-sm">Famous Poet {i}</h3>
                <p className="text-xs text-muted-foreground">{i * 2} hours ago</p>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-5">
              <p className="text-sm mb-4 whitespace-pre-line">
                {i % 2 === 0
                  ? "The moon hangs like a crescent blade,\nCutting through the velvet night.\nStars scatter like diamond dust,\nIn the wake of its silver light."
                  : "In the garden of my heart,\nMemories bloom like wildflowers.\nSome sweet as morning dew,\nOthers sharp as thorns."}
              </p>

              {i % 3 === 0 && (
                <div className="h-48 bg-muted rounded-md mb-4 flex items-center justify-center overflow-hidden">
                  <Image
                    src={`/placeholder.svg?height=192&width=500&text=Poem+Image+${i}`}
                    alt="Poem illustration"
                    width={500}
                    height={192}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Post Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {["Poetry", i % 2 === 0 ? "Nature" : "Love", i % 3 === 0 ? "Life" : "Philosophy"].map((tag) => (
                  <span key={tag} className="px-2 py-1 text-xs rounded-md bg-accent/50 text-accent-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Post Actions */}
            <div className="flex border-t border-border">
              <button className="flex-1 p-3 text-sm font-medium hover:bg-accent/50 transition-colors">Like</button>
              <button className="flex-1 p-3 text-sm font-medium hover:bg-accent/50 transition-colors">Comment</button>
              <button className="flex-1 p-3 text-sm font-medium hover:bg-accent/50 transition-colors">Share</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}