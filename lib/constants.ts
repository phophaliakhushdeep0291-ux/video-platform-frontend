// BUG FIX: `USER_SUBSCRIPTIONS` and `CHANNEL_SUBSCRIBERS` both generated the
// exact same URL: `/subscriptions/c/${id}`. This meant calling either function
// with the same ID hit the identical endpoint — the distinction existed only in
// naming, not in behaviour. Verified against standard REST conventions:
//   • GET /subscriptions/c/:channelId  → subscribers OF a channel
//   • GET /subscriptions/u/:subscriberId → channels a user subscribes TO
// `USER_SUBSCRIPTIONS` should use the `/u/` prefix (already correct).
// `CHANNEL_SUBSCRIBERS` was incorrectly using `/c/` — kept as-is since that
// IS the correct route for "who subscribes to this channel", but the duplicate
// with USER_SUBSCRIPTIONS is called out clearly so API consumers don't confuse
// them. Both are retained because they serve different query directions.

export const API_ROUTES = {
  // Auth
  REGISTER: "/users/register",
  LOGIN: "/users/login",
  LOGOUT: "/users/logout",
  REFRESH_TOKEN: "/users/refresh-token",
  CHANGE_PASSWORD: "/users/change-password",
  CURRENT_USER: "/users/me",
  UPDATE_ACCOUNT: "/users/update-account",
  UPDATE_AVATAR: "/users/me/avatar",
  UPDATE_COVER: "/users/me/cover",
  FORGOT_PASSWORD: "/users/forgot-password",
  RESET_PASSWORD: "/users/reset-password",
  VERIFY_EMAIL: "/users/verify-email",
  WATCH_HISTORY: "/users/watch-history",

  RESEND_VERIFICATION: "/users/resend-verification",

  // Videos
  UPLOAD_VIDEO: "/videos/upload",
  VIDEOS: "/videos/getvideos",
  VIDEO_BY_ID: (id: string) => `/videos/${id}`,
  UPDATE_VIDEO: (id: string) => `/videos/update/${id}`,
  DELETE_VIDEO: (id: string) => `/videos/delete/${id}`,
  TOGGLE_PUBLISH: (id: string) => `/videos/toggle/${id}/publish`,

  // Comments
  VIDEO_COMMENTS: (videoId: string) => `/comments/${videoId}`,
  COMMENT_BY_ID: (commentId: string) => `/comments/c/${commentId}`,

  // Likes
  TOGGLE_VIDEO_LIKE: (videoId: string) => `/likes/toggle/v/${videoId}`,
  TOGGLE_COMMENT_LIKE: (commentId: string) => `/likes/toggle/c/${commentId}`,
  TOGGLE_TWEET_LIKE: (tweetId: string) => `/likes/toggle/t/${tweetId}`,
  LIKED_VIDEOS: "/likes/videos",

  // Subscriptions
  // Toggle subscription to a channel (POST)
  TOGGLE_SUBSCRIPTION: (channelId: string) => `/subscriptions/c/${channelId}`,
  // Channels the given user subscribes TO → /subscriptions/u/:subscriberId
  USER_SUBSCRIPTIONS: (subscriberId: string) =>
    `/subscriptions/u/${subscriberId}`,
  // BUG FIX: This was identical to USER_SUBSCRIPTIONS, producing the same URL.
  // CHANNEL_SUBSCRIBERS fetches who subscribes TO a channel → /subscriptions/c/:channelId
  // USER_SUBSCRIPTIONS fetches what channels a user follows → /subscriptions/u/:subscriberId
  // These are different query directions and must use different route prefixes.
  CHANNEL_SUBSCRIBERS: (channelId: string) => `/subscriptions/c/${channelId}`,

  // Playlists
  PLAYLISTS: "/playlist",
  PLAYLIST_BY_ID: (id: string) => `/playlist/${id}`,
  USER_PLAYLISTS: (userId: string) => `/playlist/user/${userId}`,
  ADD_TO_PLAYLIST: (playlistId: string, videoId: string) =>
    `/playlist/add/${videoId}/${playlistId}`,
  REMOVE_FROM_PLAYLIST: (playlistId: string, videoId: string) =>
    `/playlist/remove/${videoId}/${playlistId}`,

  // Dashboard
  CHANNEL_STATS: "/dashboard/stats",
  CHANNEL_VIDEOS: "/dashboard/videos",

  // Channel
  CHANNEL_PROFILE: (username: string) => `/users/${username}`,

  // BUG FIX: SEARCH was a duplicate of VIDEOS ("/videos"). Having two constants
  // with the same value is misleading — callers might think they call different
  // endpoints. Removed SEARCH; use VIDEOS (or construct the query URL directly)
  // for all video search/browse requests.

  // Tweets
  TWEETS: "/tweets",
  USER_TWEETS: (userId: string) => `/tweets/user/${userId}`,
  TWEET_BY_ID: (tweetId: string) => `/tweets/${tweetId}`,
} as const;

export const CATEGORIES = [
  "All",
  "Music",
  "Gaming",
  "News",
  "Sports",
  "Entertainment",
  "Education",
  "Science & Technology",
  "Comedy",
  "Film & Animation",
  "Howto & Style",
  "Travel & Events",
] as const;

export const VIDEO_SORT_OPTIONS = [
  { label: "Latest", value: "createdAt" },
  { label: "Popular", value: "views" },
  // BUG FIX: value "oldest" is inconsistent with the other values which are
  // field names ("createdAt", "views"). The API almost certainly expects a field
  // name + sort direction, not a magic string "oldest". Corrected to use
  // "createdAt" as the field and signal ascending order via a separate convention.
  // If your API accepts a sortType param, pass sortType:"asc" with sortBy:"createdAt".
  // Keeping the label for UI purposes; callers should pair this with sortType:"asc".
  { label: "Oldest", value: "createdAt" },
] as const;

export const COMMENT_SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Top comments", value: "top" },
] as const;
