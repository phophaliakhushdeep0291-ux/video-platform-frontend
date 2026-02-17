"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/main-layout";
import { VideoGrid } from "@/components/video/video-grid";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type { Video, PaginatedResponse } from "@/lib/types";

const fetcher = async (url: string) => {
  try {
    const res = await api.get<PaginatedResponse<Video>>(url);
    return res.data;
  } catch {
    return null;
  }
};

const sortOptions = [
  { label: "Relevance", value: "score" },
  { label: "Upload date", value: "createdAt" },
  { label: "View count", value: "views" },
  { label: "Duration", value: "duration" },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const sortParam = searchParams.get("sort") ?? "score";

  const [sortBy, setSortBy] = useState(sortParam);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // BUG FIX: When the URL query param changes (user types new search), the page
  // state stayed at whatever it was, resulting in fetching page 3 of new results.
  // Reset page whenever the search query changes.
  useEffect(() => {
    setPage(1);
    setSortBy(sortParam);
  }, [query, sortParam]);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "20",
    sortBy,
    sortType: "desc",
    ...(query ? { query } : {}),
  });

  const { data, isLoading } = useSWR(
    `${API_ROUTES.VIDEOS}?${queryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {query ? `Results for "${query}"` : "Browse Videos"}
            </h1>
            {data && (
              <p className="mt-1 text-sm text-muted-foreground">
                {data.totalDocs ?? 0} video{(data.totalDocs ?? 0) !== 1 ? "s" : ""}{" "}
                found
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="gap-2 border-border text-foreground"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2 rounded-lg border border-border bg-card p-4">
            <span className="text-sm font-medium text-foreground">Sort by:</span>
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSortBy(option.value);
                  setPage(1);
                }}
                className={cn(
                  "text-xs",
                  sortBy === option.value
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <VideoGrid
        videos={data?.docs ?? []}
        isLoading={isLoading}
        emptyMessage={
          query
            ? `No videos found for "${query}". Try different keywords.`
            : "No videos available."
        }
      />

      {data && data.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!data.hasPrevPage}
            onClick={() => setPage((p) => p - 1)}
            className="border-border text-foreground"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            className="border-border text-foreground"
          >
            Next
          </Button>
        </div>
      )}
    </MainLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="flex min-h-[60vh] items-center justify-center">
            <Search className="h-8 w-8 animate-pulse text-muted-foreground" />
          </div>
        </MainLayout>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
