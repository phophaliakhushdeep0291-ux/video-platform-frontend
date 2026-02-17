"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ThumbsUp } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { VideoGrid } from "@/components/video/video-grid";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import api from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type { Video } from "@/lib/types";

const fetcher = async (url: string) => {
  try {
    const res = await api.get<Video[]>(url);
    return res.data;
  } catch {
    return null;
  }
};

export default function LikedVideosPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // BUG FIX: The original showed an "unauthenticated" screen but never actually
  // redirected to /login. Users had to manually navigate away. Added redirect.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const { data, isLoading } = useSWR(
    isAuthenticated ? API_ROUTES.LIKED_VIDEOS : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // Show loading spinner while auth resolves to prevent content flash
  if (authLoading || !isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent">
            <ThumbsUp className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Liked Videos</h1>
          <p className="max-w-md text-muted-foreground">
            Sign in to see the videos you have liked.
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Sign In
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Liked Videos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {!isLoading ? `${data?.length ?? 0} videos liked` : "Loading..."}
        </p>
      </div>

      <VideoGrid
        videos={data ?? []}
        isLoading={isLoading}
        emptyMessage="You haven't liked any videos yet."
      />
    </MainLayout>
  );
}
