import { Eye, Heart, Bookmark, MessageCircle } from "lucide-react"

interface PoemStatsProps {
  viewsCount: number
  likesCount?: number
  bookmarkCount: number
  commentsCount?: number
  className?: string
}

export default function PoemStats({
  viewsCount,
  likesCount = 0,
  bookmarkCount,
  commentsCount = 0,
  className = "",
}: PoemStatsProps) {
  const stats = [
    { icon: Eye, count: viewsCount, label: "views" },
    { icon: Heart, count: likesCount, label: "likes" },
    { icon: Bookmark, count: bookmarkCount, label: "bookmarks" },
    { icon: MessageCircle, count: commentsCount, label: "comments" },
  ]

  return (
    <div className={`flex items-center gap-4 text-xs text-muted-foreground ${className}`}>
      {stats.map(({ icon: Icon, count, label }) => (
        <div key={label} className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          <span>{count.toLocaleString()}</span>
          <span className="hidden sm:inline">{label}</span>
        </div>
      ))}
    </div>
  )
}
