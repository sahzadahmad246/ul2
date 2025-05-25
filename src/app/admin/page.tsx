"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePoemStore } from "@/store/poemStore";
import { useAdminStore } from "@/store/adminStore";
import {
  BookOpen,
  Users,
  Eye,
  TrendingUp,
  Activity,
  Target,
} from "lucide-react";

export default function AdminDashboard() {
  const { poems, fetchPoems } = usePoemStore();
  const { users, fetchUsers } = useAdminStore();

  useEffect(() => {
    fetchPoems(1, true);
    fetchUsers(true);
  }, [fetchPoems, fetchUsers]);

  const totalPoems = poems.length;
  const totalUsers = users.length;
  const totalViews = poems.reduce(
    (sum, poem) => sum + (poem.viewsCount || 0),
    0
  );
  const totalLikes = poems.reduce(
    (sum, poem) => sum + (poem.likes?.length || 0),
    0
  );
  const publishedPoems = poems.filter(
    (poem) => poem.status === "published"
  ).length;
  const draftPoems = poems.filter((poem) => poem.status === "draft").length;
  const totalEngagement =
    totalLikes +
    poems.reduce((sum, poem) => sum + (poem.bookmarkCount || 0), 0);

  const stats = [
    {
      title: "Total Poems",
      value: totalPoems.toLocaleString(),
      icon: BookOpen,
      description: `${publishedPoems} published, ${draftPoems} drafts`,
      trend: "+12%",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Total Users",
      value: totalUsers.toLocaleString(),
      icon: Users,
      description: "Registered users",
      trend: "+8%",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Total Views",
      value: totalViews.toLocaleString(),
      icon: Eye,
      description: "Poem views",
      trend: "+23%",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Engagement",
      value: totalEngagement.toLocaleString(),
      icon: TrendingUp,
      description: "Likes + Bookmarks",
      trend: "+15%",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  const recentPoems = poems.slice(0, 5);
  const recentUsers = users.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the admin dashboard. Here is an overview of your poetry
          platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <span className="text-xs text-green-600 font-medium">
                  {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Poems */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recent Poems
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPoems.map((poem) => (
                <div
                  key={poem.slug.en}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {poem.title.en}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {typeof poem.poet === "object" && "name" in poem.poet
                          ? poem.poet.name
                          : "Unknown Poet"}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {poem.viewsCount || 0} views
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {poem.viewsCount || 0}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {(poem.likes?.length || 0) + (poem.bookmarkCount || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user._id?.toString()}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {user.role}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {user.poemCount || 0} poems
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {user.followerCount || 0}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {user.poemCount || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium">Manage Poems</h3>
              <p className="text-sm text-muted-foreground">
                Add, edit, or delete poems
              </p>
            </div>
            <div className="p-4 rounded-lg border text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium">Manage Users</h3>
              <p className="text-sm text-muted-foreground">
                View and manage user accounts
              </p>
            </div>
            <div className="p-4 rounded-lg border text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-medium">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                View detailed analytics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
