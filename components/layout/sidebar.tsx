"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  Users,
  History,
  ThumbsUp,
  Settings,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSidebar } from "@/components/layout/sidebar-provider";
import { useAuth } from "@/components/auth/auth-provider";

const mainNavItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: TrendingUp, label: "Trending", href: "/search?sort=views" },
  { icon: Users, label: "Subscriptions", href: "/subscriptions" },
];

const libraryItems = [
  { icon: History, label: "History", href: "/history" },
  { icon: ThumbsUp, label: "Liked Videos", href: "/liked-videos" },
];

const creatorItems = [
  { icon: Upload, label: "Upload", href: "/upload" },
];

interface SidebarNavProps {
  isCollapsed?: boolean;
  onNavigate?: () => void;
}

function SidebarNav({ isCollapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const NavItem = ({
    item,
  }: {
    item: { icon: React.ElementType; label: string; href: string };
  }) => {
    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href.split("?")[0]);

    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          isCollapsed && "justify-center px-0"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
        {!isCollapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex flex-col gap-1 px-2 py-2">
      <div className="flex flex-col gap-0.5">
        {mainNavItems.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </div>

      {isAuthenticated && (
        <>
          <Separator className="my-2 bg-border" />
          {!isCollapsed && (
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Library
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {libraryItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>

          <Separator className="my-2 bg-border" />
          {!isCollapsed && (
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Creator
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {creatorItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </>
      )}

      <Separator className="my-2 bg-border" />
      <NavItem
        item={{ icon: Settings, label: "Settings", href: "/settings" }}
      />
    </div>
  );
}

export function Sidebar() {
  const { isExpanded, isMobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] border-r border-border bg-background md:block sidebar-transition",
          isExpanded ? "w-56" : "w-16"
        )}
      >
        <ScrollArea className="h-full">
          <SidebarNav isCollapsed={!isExpanded} />
        </ScrollArea>
      </aside>

      {/* Mobile sidebar (sheet) */}
      <Sheet open={isMobileOpen} onOpenChange={closeMobile}>
        <SheetContent
          side="left"
          className="w-64 border-border bg-background p-0"
        >
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <Link
              href="/"
              className="flex items-center gap-1.5"
              onClick={closeMobile}
            >
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
              <span className="text-lg font-bold tracking-tight text-foreground">
                VideoTube
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMobile}
              className="text-foreground"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <SidebarNav onNavigate={closeMobile} />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
