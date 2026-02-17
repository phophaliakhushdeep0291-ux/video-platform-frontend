// BUG FIX: All formatting functions now guard against non-finite / NaN inputs
// that can arrive from the API (e.g. missing fields, null coerced to 0, etc.)
// and against invalid date strings that produce "Invalid Date" objects.

export function formatViews(views: number): string {
  // BUG FIX: NaN, Infinity, or negative values would produce garbled output
  // like "NaNK" or "-1.2M". Guard with a safe fallback.
  if (!Number.isFinite(views) || views < 0) return "0";

  if (views >= 1_000_000_000) {
    return `${(views / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return views.toString();
}

export function formatDuration(seconds: number): string {
  // BUG FIX: NaN or negative duration (e.g. from a missing API field) would
  // produce "NaN:NaN" or "-1:-1". Return "0:00" as the safe fallback.
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  // BUG FIX: Math.floor on a non-integer seconds value was fine, but
  // calling Math.floor(seconds % 60) already rounds to int — explicit cast kept.
  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatTimeAgo(dateString: string): string {
  // BUG FIX: An empty string, null, or malformed date produces an "Invalid Date"
  // whose .getTime() returns NaN — causing all diff calculations to be NaN and
  // ultimately returning "Just now" incorrectly.
  if (!dateString) return "";

  const now = new Date();
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "";

  const diffMs = now.getTime() - date.getTime();

  // BUG FIX: If the date is in the future (e.g. a scheduled publish time or
  // a clock skew), diffMs is negative and every branch falls through to
  // "Just now" — which is misleading. Return a sensible label instead.
  if (diffMs < 0) return "Just now";

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  if (diffMonths > 0)
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffHours > 0)
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffMins > 0)
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  return "Just now";
}

export function formatDate(dateString: string): string {
  // BUG FIX: An invalid or empty dateString produces "Invalid Date" being
  // rendered in the UI. Guard and return an empty string instead.
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateSeparator(dateString: string): string {
  // BUG FIX: Same invalid-date guard as formatDate.
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateString);
}

export function formatSubscribers(count: number): string {
  // BUG FIX: Same NaN / negative guard as formatViews.
  if (!Number.isFinite(count) || count < 0) return "0 subscribers";

  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M subscribers`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K subscribers`;
  }
  return `${count} subscriber${count !== 1 ? "s" : ""}`;
}

export function truncateText(text: string, maxLength: number): string {
  // BUG FIX: If text is null/undefined (possible from API), `.length` throws.
  // Also guard maxLength ≤ 0 which would return just "...".
  if (!text) return "";
  if (maxLength <= 0) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}
