"use client";

import useSWR from "swr";
import { MainLayout } from "@/components/layout/main-layout";
import { VideoGrid } from "@/components/video/video-grid";
import api from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type { Video, PaginatedResponse } from "@/lib/types";

const videosFetcher = async (url: string) => {
  try {
    const res = await api.get<PaginatedResponse<Video>>(url);
    return res.data;
  } catch {
    return null;
  }
};

export default function HomePage() {
  const { data, isLoading } = useSWR(
    `${API_ROUTES.VIDEOS}?sortBy=createdAt&sortType=desc&limit=20`,
    videosFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Home</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Latest videos from the community
        </p>
      </div>

      <VideoGrid
        videos={data?.docs ?? []}
        isLoading={isLoading}
        emptyMessage="No videos yet. Be the first to upload!"
      />
    </MainLayout>
  );
}
