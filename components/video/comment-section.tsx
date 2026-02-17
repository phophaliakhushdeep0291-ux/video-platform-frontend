"use client";

import { useState, useCallback, useRef } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { ThumbsUp, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth/auth-provider";
import { formatTimeAgo } from "@/lib/format";
import { API_ROUTES } from "@/lib/constants";
import api, { ApiError } from "@/lib/api";
import type { Comment, PaginatedResponse } from "@/lib/types";

interface CommentSectionProps {
  videoId: string;
}

const commentsFetcher = async (url: string) => {
  try {
    const res = await api.get<PaginatedResponse<Comment>>(url);
    return res.data;
  } catch {
    return null;
  }
};

export function CommentSection({ videoId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInput, setShowInput] = useState(false);

  // BUG FIX: Track in-flight like requests per comment ID to prevent double-fires
  const likeInFlight = useRef<Set<string>>(new Set());

  const cacheKey = `/comments/${videoId}?page=1&limit=20`;
  const { data, isLoading } = useSWR(cacheKey, commentsFetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const comments = data?.docs ?? [];
  const totalComments = data?.totalDocs ?? 0;

  const handleSubmitComment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim()) return;
      if (!isAuthenticated) {
        toast.error("Please sign in to comment");
        return;
      }

      setIsSubmitting(true);
      try {
        await api.post(API_ROUTES.VIDEO_COMMENTS(videoId), {
          content: newComment.trim(),
        });
        setNewComment("");
        setShowInput(false);
        toast.success("Comment added");
        globalMutate(cacheKey);
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error("Failed to add comment");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [newComment, isAuthenticated, videoId, cacheKey]
  );

  const handleToggleLike = useCallback(
    async (commentId: string) => {
      if (!isAuthenticated) {
        toast.error("Please sign in to like comments");
        return;
      }
      // BUG FIX: Guard against double-clicking the like button on a comment
      if (likeInFlight.current.has(commentId)) return;
      likeInFlight.current.add(commentId);
      try {
        await api.post(API_ROUTES.TOGGLE_COMMENT_LIKE(commentId));
        globalMutate(cacheKey);
      } catch {
        toast.error("Failed to update like");
      } finally {
        likeInFlight.current.delete(commentId);
      }
    },
    [isAuthenticated, cacheKey]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">
          {/* BUG FIX: Show "Comments" without a count while loading to avoid
              displaying "0 Comments" before data arrives */}
          {isLoading ? "Comments" : `${totalComments} Comments`}
        </h3>
      </div>

      {/* Add comment */}
      {isAuthenticated && (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.avatar} alt={user?.fullName ?? ""} />
            <AvatarFallback className="bg-accent text-xs text-foreground">
              {user?.fullName?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            {!showInput ? (
              <button
                onClick={() => setShowInput(true)}
                className="w-full border-b border-border pb-1 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Add a comment...
              </button>
            ) : (
              <form onSubmit={handleSubmitComment} className="space-y-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px] resize-none border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
                  autoFocus
                  maxLength={1000}
                />
                <div className="flex items-center justify-between">
                  {/* BUG FIX: Added character count so users know they're near limit */}
                  <span className="text-xs text-muted-foreground">
                    {newComment.length}/1000
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowInput(false);
                        setNewComment("");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!newComment.trim() || isSubmitting}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Comment"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Separator className="bg-border" />

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage
                  src={comment.owner?.avatar}
                  alt={comment.owner?.fullName ?? ""}
                />
                <AvatarFallback className="bg-accent text-xs text-foreground">
                  {comment.owner?.fullName?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    @{comment.owner?.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  {comment.content}
                </p>
                {/* BUG FIX: like button was missing aria-label */}
                <button
                  onClick={() => handleToggleLike(comment._id)}
                  className={cn(
                    "flex items-center gap-1 text-xs transition-colors",
                    comment.isLiked
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={
                    comment.isLiked ? "Unlike comment" : "Like comment"
                  }
                  aria-pressed={comment.isLiked}
                >
                  <ThumbsUp
                    className={cn(
                      "h-3.5 w-3.5",
                      comment.isLiked && "fill-current"
                    )}
                  />
                  {(comment.likesCount ?? 0) > 0 && (
                    <span>{comment.likesCount}</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
