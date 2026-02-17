"use client";

import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatViews, formatDuration, formatTimeAgo } from "@/lib/format";
import type { Video } from "@/lib/types";

interface VideoCardProps {
  video: Video;
  layout?: "grid" | "horizontal" | "compact";
}

// BUG FIX: A fallback placeholder for when a thumbnail is missing/empty,
// preventing Next.js <Image> from crashing with an empty `src` prop.
const THUMBNAIL_FALLBACK = "/placeholder-thumbnail.jpg";

export function VideoCard({ video, layout = "grid" }: VideoCardProps) {
  const owner = typeof video.owner === "object" ? video.owner : null;
  // BUG FIX: thumbnail could be an empty string from the API — coerce to fallback
  const thumbnailSrc = video.thumbnail || THUMBNAIL_FALLBACK;

  if (layout === "horizontal") {
    return (
      <Link
        href={`/watch/${video._id}`}
        className="group flex gap-4 rounded-xl p-2 transition-colors hover:bg-accent/50"
      >
        <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg sm:w-60">
          <Image
            src={thumbnailSrc}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 160px, 240px"
          />
          <span className="absolute bottom-1.5 right-1.5 rounded bg-background/90 px-1.5 py-0.5 text-xs font-medium text-foreground">
            {formatDuration(video.duration)}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-1 py-0.5">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
            {video.title}
          </h3>
          {owner && (
            <p className="text-xs text-muted-foreground hover:text-foreground">
              {owner.fullName}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatViews(video.views)} views &middot;{" "}
            {formatTimeAgo(video.createdAt)}
          </p>
        </div>
      </Link>
    );
  }

  if (layout === "compact") {
    return (
      <Link
        href={`/watch/${video._id}`}
        className="group flex gap-3 rounded-lg p-1.5 transition-colors hover:bg-accent/50"
      >
        <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md">
          <Image
            src={thumbnailSrc}
            alt={video.title}
            fill
            className="object-cover"
            sizes="112px"
          />
          <span className="absolute bottom-1 right-1 rounded bg-background/90 px-1 py-0.5 text-[10px] font-medium text-foreground">
            {formatDuration(video.duration)}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
            {video.title}
          </h3>
          {owner && (
            <p className="text-[11px] text-muted-foreground">{owner.fullName}</p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {formatViews(video.views)} views
          </p>
        </div>
      </Link>
    );
  }

  // Default grid layout
  return (
    <Link href={`/watch/${video._id}`} className="group flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
        <Image
          src={thumbnailSrc}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <span className="absolute bottom-2 right-2 rounded-md bg-background/90 px-1.5 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
          {formatDuration(video.duration)}
        </span>
      </div>

      <div className="flex gap-3">
        {owner && (
          // BUG FIX: e.stopPropagation() is needed here because the outer <Link>
          // wraps the whole card — without it the channel link click event bubbles
          // up and also navigates to the watch page.
          <Link
            href={`/channel/${owner.username}`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
            aria-label={`Visit ${owner.fullName}'s channel`}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={owner.avatar} alt={owner.fullName} />
              <AvatarFallback className="bg-accent text-xs text-foreground">
                {owner.fullName?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
            {video.title}
          </h3>
          {owner && (
            <Link
              href={`/channel/${owner.username}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {owner.fullName}
            </Link>
          )}
          <p className="text-xs text-muted-foreground">
            {formatViews(video.views)} views &middot;{" "}
            {formatTimeAgo(video.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
