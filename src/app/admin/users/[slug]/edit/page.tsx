"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/store/admin-store";
import UserForm from "@/components/admin/user-form";
import { Card, CardContent } from "@/components/ui/card";

interface EditUserPageProps {
  params: Promise<{ slug: string }>;
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const { selectedUser, fetchUserByIdentifier, loading } = useAdminStore();

  useEffect(() => {
    params.then(({ slug }) => {
      fetchUserByIdentifier(slug);
    });
  }, [params, fetchUserByIdentifier]);

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading user...</p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedUser) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
          <p className="text-muted-foreground">The user you are looking for does not exist.</p>
        </CardContent>
      </Card>
    );
  }

  return <UserForm initialData={selectedUser} slug={selectedUser.slug} />;
}