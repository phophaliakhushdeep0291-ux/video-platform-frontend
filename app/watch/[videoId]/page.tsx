"use client";

import { use, useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  UserPlus,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/main-layout";
import { VideoCard } from "@/components/video/video-card";
import { CommentSection } from "@/components/video/comment-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth/auth-provider";
import { formatViews, formatTimeAgo, formatDate } from "@/lib/format";
import { API_ROUTES } from "@/lib/constants";
import api, { ApiError } from "@/lib/api";

import type { Video, User, PaginatedResponse } from "@/lib/types";

interface VideoDetail extends Video {
  owner: User;
  likesCount: number;
  isLiked: boolean;
}

const videoFetcher = async (url: string) => {
  try {
    const res = await api.get<VideoDetail>(url);
    return res.data;
  } catch {
    return null;
  }
};

const suggestedFetcher = async (url: string) => {
  try {
    const res = await api.get<PaginatedResponse<Video>>(url);
    return res.data;
  } catch {
    return null;
  }
};

export default function WatchPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const videoCacheKey = API_ROUTES.VIDEO_BY_ID(videoId);
  const { data: video, isLoading: videoLoading } = useSWR(
    videoCacheKey,
    videoFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const { data: suggested, isLoading: suggestedLoading } = useSWR(
    `${API_ROUTES.VIDEOS}?limit=10&sortBy=views&sortType=desc`,
    suggestedFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const [descExpanded, setDescExpanded] = useState(false);

  // BUG FIX: Track in-flight requests to prevent double-clicks from firing twice
  const likeInFlight = useRef(false);
  const subInFlight = useRef(false);

  const handleToggleLike = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to like videos");
      return;
    }
    if (likeInFlight.current) return;
    likeInFlight.current = true;
    try {
      await api.post(API_ROUTES.TOGGLE_VIDEO_LIKE(videoId));
      globalMutate(videoCacheKey);
    } catch {
      toast.error("Failed to update like");
    } finally {
      likeInFlight.current = false;
    }
  }, [isAuthenticated, videoId, videoCacheKey]);

  const handleSubscribe = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to subscribe");
      return;
    }
    // BUG FIX: guard against missing owner before attempting request
    if (!video?.owner?._id) return;
    if (subInFlight.current) return;
    subInFlight.current = true;
    try {
      await api.post(API_ROUTES.TOGGLE_SUBSCRIPTION(video.owner._id));
      globalMutate(videoCacheKey);
      toast.success(video.owner.isSubscribed ? "Unsubscribed" : "Subscribed!");
    } catch {
      toast.error("Failed to update subscription");
    } finally {
      subInFlight.current = false;
    }
  }, [isAuthenticated, video, videoCacheKey]);

  const handleShare = useCallback(() => {
    // BUG FIX: navigator.clipboard requires HTTPS; fall back gracefully
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success("Link copied to clipboard");
      }).catch(() => {
        toast.error("Could not copy link");
      });
    } else {
      toast.error("Clipboard not available in this browser");
    }
  }, []);

  const suggestedVideos =
    suggested?.docs?.filter((v) => v._id !== videoId) ?? [];

  if (videoLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-4">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-7 w-3/4" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          <div className="w-full space-y-3 lg:w-96">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="aspect-video w-40 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!video) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Video not found</p>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="border-border text-foreground"
          >
            Go Home
          </Button>
        </div>
      </MainLayout>
    );
  }

  const owner = video.owner;

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main content */}
        <div className="flex-1 space-y-4">
          {/* Video player */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-secondary">
            <video
              src={video.videoFile}
              poster={video.thumbnail}
              controls
              autoPlay
              className="h-full w-full"
              aria-label={video.title}
            />
          </div>

          {/* Title */}
          <h1 className="text-pretty text-xl font-bold leading-snug text-foreground">
            {video.title}
          </h1>

          {/* Channel info + actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/channel/${owner.username}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={owner.avatar} alt={owner.fullName} />
                  <AvatarFallback className="bg-accent text-foreground">
                    {/* BUG FIX: safe-chain optional chaining already present; kept */}
                    {owner.fullName?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link
                  href={`/channel/${owner.username}`}
                  className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                >
                  {owner.fullName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatViews(owner.subscribersCount ?? 0)} subscribers
                </p>
              </div>
              <Button
                onClick={handleSubscribe}
                size="sm"
                className={cn(
                  "ml-2 rounded-full",
                  owner.isSubscribed
                    ? "bg-accent text-foreground hover:bg-accent/80"
                    : "bg-foreground text-background hover:bg-foreground/90"
                )}
              >
                {owner.isSubscribed ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Subscribed
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-1 h-3.5 w-3.5" />
                    Subscribe
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-full bg-secondary">
                <button
                  onClick={handleToggleLike}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
                    video.isLiked
                      ? "text-primary"
                      : "text-foreground hover:bg-accent"
                  )}
                  aria-label={video.isLiked ? "Unlike video" : "Like video"}
                >
                  <ThumbsUp
                    className={cn("h-4 w-4", video.isLiked && "fill-current")}
                  />
                  {formatViews(video.likesCount ?? 0)}
                </button>
                <Separator orientation="vertical" className="h-6 bg-border" />
                {/* BUG FIX: dislike button had no aria-label */}
                <button
                  className="px-4 py-2 text-foreground transition-colors hover:bg-accent"
                  aria-label="Dislike video"
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="rounded-full text-foreground"
                onClick={handleShare}
              >
                <Share2 className="mr-1.5 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl bg-secondary p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span>{formatViews(video.views)} views</span>
              <span>&middot;</span>
              <span>{formatDate(video.createdAt)}</span>
            </div>
            <div className="mt-2">
              <p
                className={cn(
                  "whitespace-pre-wrap text-sm leading-relaxed text-foreground",
                  !descExpanded && "line-clamp-3"
                )}
              >
                {video.description || "No description provided."}
              </p>
              {/* BUG FIX: description length check was on raw string which is fine,
                  but guarding against null/undefined first */}
              {video.description && video.description.length > 150 && (
                <button
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {descExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          </div>

          {/* Comments */}
          <CommentSection videoId={videoId} />
        </div>

        {/* Suggested videos sidebar */}
        <div className="w-full space-y-3 lg:w-96">
          <h3 className="text-sm font-semibold text-foreground">
            Suggested videos
          </h3>
          {suggestedLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="aspect-video w-40 shrink-0 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedVideos.length > 0 ? (
            suggestedVideos.map((v) => (
              <VideoCard key={v._id} video={v} layout="compact" />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No suggestions available.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
