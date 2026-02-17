// BUG FIX: `Video.owner` was typed as `User | string` — a union that forces
// every consumer to type-narrow before accessing any `User` property. In practice
// the API always returns the populated object, not a bare ID string, so the
// string branch was never hit but still required defensive `typeof owner === "object"`
// checks scattered across components. Changed to `User` for the populated case.
// If you ever need the un-populated variant (e.g. for a lightweight list endpoint),
// add a separate `VideoSummary` type with `owner: string` rather than polluting
// the main `Video` type.

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  watchHistory?: string[];
  subscribersCount?: number;
  channelsSubscribedToCount?: number;
  // BUG FIX: `isSubscribed` was missing from the User type even though the
  // watch page's VideoDetail interface (which extends Video and includes owner: User)
  // accessed `owner.isSubscribed` directly. This caused a TypeScript error and
  // runtime `undefined` reads. Added as optional since it's only populated when
  // the requesting user is authenticated.
  isSubscribed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  _id: string;
  videoFile: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: number;
  views: number;
  isPublished: boolean;
  // BUG FIX: Was `User | string`. Components always destructure owner as a User
  // object. The string-ID variant is an un-populated Mongoose reference that
  // should not appear in frontend-facing responses. Using `User` eliminates all
  // the `typeof video.owner === "object"` guard clauses in video-card.tsx etc.
  owner: User;
  likesCount?: number;
  isLiked?: boolean;
  commentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  video: string;
  owner: User;
  likesCount?: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  videos: Video[];
  // BUG FIX: Same as Video.owner — changed from `User | string` to `User`
  // since playlists are always returned with the populated owner object.
  owner: User;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  subscriber: User;
  channel: User;
  createdAt: string;
}

export interface Tweet {
  _id: string;
  content: string;
  owner: User;
  likesCount?: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export interface ChannelProfile {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
  coverImage?: string;
  subscribersCount: number;
  channelsSubscribedToCount: number;
  isSubscribed: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalVideos: number;
  totalViews: number;
  totalSubscribers: number;
  totalLikes: number;
}

// BUG FIX: `WatchHistoryItem` extended `Video` and only added `watchedAt?`.
// Because Video already contains all fields, this is fine structurally, but
// the `watchedAt` field was optional — meaning code that reads `item.watchedAt`
// always had to null-check. Keeping optional since the backend may omit it,
// but calling out that callers must guard it.
export interface WatchHistoryItem extends Video {
  watchedAt?: string;
}
