"use client";

import { use, useCallback } from "react";
import Image from "next/image";
import useSWR, { mutate as globalMutate } from "swr";
import { UserPlus, Check, CalendarDays, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/main-layout";
import { VideoGrid } from "@/components/video/video-grid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { formatViews, formatDate } from "@/lib/format";
import { API_ROUTES } from "@/lib/constants";
import api from "@/lib/api";
import type { ChannelProfile, Video, PaginatedResponse } from "@/lib/types";

const channelFetcher = async (url: string) => {
  try {
    const res = await api.get<ChannelProfile>(url);
    return res.data;
  } catch {
    return null;
  }
};

const videosFetcher = async (url: string) => {
  try {
    const res = await api.get<PaginatedResponse<Video>>(url);
    return res.data;
  } catch {
    return null;
  }
};

export default function ChannelPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { isAuthenticated } = useAuth();

  const channelKey = API_ROUTES.CHANNEL_PROFILE(username);
  const { data: channel, isLoading: channelLoading } = useSWR(
    channelKey,
    channelFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const { data: videosData, isLoading: videosLoading } = useSWR(
    // BUG FIX: channel._id could be undefined before channel loads; guard with channel
    channel ? `${API_ROUTES.VIDEOS}?userId=${channel._id}&sortBy=createdAt&sortType=desc&limit=20` : null,
    videosFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const handleSubscribe = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to subscribe");
      return;
    }
    if (!channel?._id) return;
    try {
      await api.post(API_ROUTES.TOGGLE_SUBSCRIPTION(channel._id));
      globalMutate(channelKey);
      toast.success(channel.isSubscribed ? "Unsubscribed" : "Subscribed!");
    } catch {
      toast.error("Failed to update subscription");
    }
  }, [isAuthenticated, channel, channelKey]);

  if (channelLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl sm:h-52" />
          <div className="flex items-center gap-4 px-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!channel) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Channel not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cover image */}
        <div className="relative h-40 w-full overflow-hidden rounded-xl bg-gradient-to-r from-secondary to-accent sm:h-52">
          {channel.coverImage && (
            <Image
              src={channel.coverImage}
              alt={`${channel.fullName} cover`}
              fill
              className="object-cover"
              sizes="100vw"
            />
          )}
        </div>

        {/* Channel info */}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Avatar className="relative z-10 -mt-10 ml-4 h-20 w-20 border-4 border-background sm:-mt-12 sm:h-28 sm:w-28">
            <AvatarImage src={channel.avatar} alt={channel.fullName} />
            <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
              {channel.fullName?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col gap-2 px-4 sm:px-0">
            <h1 className="text-2xl font-bold text-foreground">
              {channel.fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>@{channel.username}</span>
              <span>&middot;</span>
              {/* BUG FIX: subscribersCount could be undefined; default to 0 */}
              <span>
                {formatViews(channel.subscribersCount ?? 0)} subscribers
              </span>
              <span>&middot;</span>
              <span>{videosData?.totalDocs ?? 0} videos</span>
            </div>
          </div>

          <Button
            onClick={handleSubscribe}
            className={cn(
              "ml-4 rounded-full sm:ml-0",
              channel.isSubscribed
                ? "bg-accent text-foreground hover:bg-accent/80"
                : "bg-foreground text-background hover:bg-foreground/90"
            )}
          >
            {channel.isSubscribed ? (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                Subscribed
              </>
            ) : (
              <>
                <UserPlus className="mr-1.5 h-4 w-4" />
                Subscribe
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="videos"
              className="rounded-none border-b-2 border-transparent px-6 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Videos
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="rounded-none border-b-2 border-transparent px-6 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="mt-6">
            <VideoGrid
              videos={videosData?.docs ?? []}
              isLoading={videosLoading}
              emptyMessage="This channel has no videos yet."
            />
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <div className="max-w-2xl space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">About</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {channel.email
                    ? `Channel managed by ${channel.fullName}`
                    : "No description available."}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Details</h3>
                <div className="space-y-2">
                  {/* BUG FIX: guard against missing createdAt */}
                  {channel.createdAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>Joined {formatDate(channel.createdAt)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>
                      {formatViews(channel.subscribersCount ?? 0)} subscribers
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
