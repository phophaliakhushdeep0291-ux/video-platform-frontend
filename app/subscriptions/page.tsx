"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Users } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import api from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type { User } from "@/lib/types";

interface SubscribedChannel {
  _id: string;
  channel: User;
}

const channelFetcher = async (url: string) => {
  try {
    const res = await api.get<SubscribedChannel[]>(url);
    return res.data;
  } catch {
    return null;
  }
};

export default function SubscriptionsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // BUG FIX: Same pattern as liked-videos - never actually redirected to login.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: channels, isLoading } = useSWR(
    // BUG FIX: user._id could be undefined if user hasn't loaded yet; guard it.
    isAuthenticated && user?._id
      ? API_ROUTES.USER_SUBSCRIPTIONS(user._id)
      : null,
    channelFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  if (authLoading || !isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
          <p className="max-w-md text-muted-foreground">
            Sign in to see updates from your favorite channels.
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
        <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Channels you follow</p>
      </div>

      {/* Subscribed channels list */}
      {isLoading ? (
        <div className="hide-scrollbar mb-8 flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-2">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ) : channels && channels.length > 0 ? (
        <div className="hide-scrollbar mb-8 flex gap-6 overflow-x-auto pb-4">
          {channels.map((sub) => (
            <Link
              key={sub._id}
              href={`/channel/${sub.channel.username}`}
              className="group flex shrink-0 flex-col items-center gap-2"
            >
              <Avatar className="h-16 w-16 ring-2 ring-transparent transition-all group-hover:ring-primary">
                <AvatarImage
                  src={sub.channel.avatar}
                  alt={sub.channel.fullName}
                />
                <AvatarFallback className="bg-accent text-foreground">
                  {sub.channel.fullName?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[80px] truncate text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                {sub.channel.fullName}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            You haven&apos;t subscribed to any channels yet.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="border-border text-foreground"
          >
            Explore Videos
          </Button>
        </div>
      )}
    </MainLayout>
  );
}
