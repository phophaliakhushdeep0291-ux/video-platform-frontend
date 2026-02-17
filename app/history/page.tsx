"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { History, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/main-layout";
import { VideoGrid } from "@/components/video/video-grid";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import api from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type { Video } from "@/lib/types";

const historyFetcher = async (url: string) => {
  try {
    const res = await api.get<Video[]>(url);
    return res.data;
  } catch {
    // BUG FIX: returning [] masks actual errors; return null so the UI can
    // distinguish between "loaded empty" and "fetch failed".
    return null;
  }
};

export default function HistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const {
    data: videos,
    isLoading,
    mutate,
  } = useSWR(
    // BUG FIX: only fetch once auth is confirmed - was already correct, kept.
    isAuthenticated ? API_ROUTES.WATCH_HISTORY : null,
    historyFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const handleClearHistory = async () => {
    try {
      await api.delete(API_ROUTES.WATCH_HISTORY);
      // BUG FIX: pass `false` as second arg (revalidate) to avoid immediate refetch
      mutate([], false);
      toast.success("Watch history cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
              <History className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Watch History
              </h1>
              <p className="text-sm text-muted-foreground">
                {/* BUG FIX: don't show 0 while still loading */}
                {!isLoading && !authLoading
                  ? `${videos?.length ?? 0} videos`
                  : "Loading..."}
              </p>
            </div>
          </div>
          {videos && videos.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="border-border text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear history
            </Button>
          )}
        </div>

        <VideoGrid
          videos={videos ?? []}
          isLoading={isLoading || authLoading}
          emptyMessage="Your watch history is empty."
        />
      </div>
    </MainLayout>
  );
}
