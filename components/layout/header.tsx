"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Upload,
  Bell,
  User,
  LogOut,
  Settings,
  History,
  ThumbsUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/layout/sidebar-provider";
import { useAuth } from "@/components/auth/auth-provider";

export function Header() {
  const { toggle } = useSidebar();
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // BUG FIX: `debouncedQuery` was imported and computed via `useDebounce(searchQuery, 300)`
  // but was never actually used anywhere in the component. This was dead code
  // (and an unnecessary import/hook call on every keystroke). Removed entirely.
  // If instant search-as-you-type is desired in the future, it can be re-added
  // along with an actual usage site.

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      if (!trimmed) return;
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      // BUG FIX: search query was not cleared after navigating, so reopening
      // the mobile search overlay still showed the old query.
      setSearchQuery("");
      setIsSearchOpen(false);
    },
    [searchQuery, router]
  );

  const handleCloseMobileSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="text-foreground hover:bg-accent"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/" className="flex items-center gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 text-primary-foreground"
              aria-hidden="true"
            >
              <path d="M8 5.14v14l11-7-11-7z" fill="currentColor" />
            </svg>
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-foreground sm:inline-block">
            VideoTube
          </span>
        </Link>
      </div>

      {/* Desktop search */}
      <form
        onSubmit={handleSearch}
        className="mx-auto hidden w-full max-w-xl items-center md:flex"
        role="search"
      >
        <div className="relative flex w-full">
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-l-full border border-border bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            aria-label="Search videos"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-[52px] top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            className="rounded-l-none rounded-r-full border border-l-0 border-border bg-accent px-5 hover:bg-accent/80"
            aria-label="Search"
          >
            <Search className="h-4 w-4 text-foreground" />
          </Button>
        </div>
      </form>

      {/* Mobile search toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto text-foreground md:hidden"
        onClick={() => setIsSearchOpen((v) => !v)}
        aria-label="Toggle search"
        aria-expanded={isSearchOpen}
      >
        <Search className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-1 md:ml-0">
        {isAuthenticated ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="hidden text-foreground hover:bg-accent sm:flex"
              onClick={() => router.push("/upload")}
              aria-label="Upload video"
            >
              <Upload className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden text-foreground hover:bg-accent sm:flex"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                  aria-label="User menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.avatar}
                      alt={user?.fullName ?? "User avatar"}
                    />
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                      {user?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 border-border bg-card"
                align="end"
              >
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user?.avatar}
                      alt={user?.fullName ?? "User avatar"}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-foreground">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{user?.username}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={() => router.push(`/channel/${user?.username}`)}
                  className="cursor-pointer text-foreground focus:bg-accent focus:text-foreground"
                >
                  <User className="mr-2 h-4 w-4" />
                  Your Channel
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/upload")}
                  className="cursor-pointer text-foreground focus:bg-accent focus:text-foreground sm:hidden"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/history")}
                  className="cursor-pointer text-foreground focus:bg-accent focus:text-foreground"
                >
                  <History className="mr-2 h-4 w-4" />
                  History
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/liked-videos")}
                  className="cursor-pointer text-foreground focus:bg-accent focus:text-foreground"
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Liked Videos
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/settings")}
                  className="cursor-pointer text-foreground focus:bg-accent focus:text-foreground"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:bg-accent focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/login")}
            className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <User className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>

      {/* Mobile search overlay */}
      {isSearchOpen && (
        <div className="absolute inset-0 z-50 flex items-center gap-2 bg-background px-4 md:hidden">
          {/* BUG FIX: The mobile search form was missing a submit button —
              users on mobile had no way to trigger the search other than pressing
              Enter on a hardware keyboard (not available on most touch devices).
              Added an explicit Search submit button. */}
          <form
            onSubmit={handleSearch}
            className="flex flex-1 items-center gap-2"
            role="search"
          >
            <input
              type="search"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 flex-1 rounded-full border border-border bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              autoFocus
              aria-label="Search videos"
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="Submit search"
              className="text-foreground hover:bg-accent"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCloseMobileSearch}
              aria-label="Close search"
            >
              <X className="h-5 w-5 text-foreground" />
            </Button>
          </form>
        </div>
      )}
    </header>
  );
}
