"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/components/layout/sidebar-provider";

interface MainLayoutProps {
  children: ReactNode;
  hideSidebar?: boolean;
  fullWidth?: boolean;
}

export function MainLayout({
  children,
  hideSidebar = false,
  fullWidth = false,
}: MainLayoutProps) {
  const { isExpanded } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {!hideSidebar && <Sidebar />}
      <main
        className={cn(
          "pt-14 sidebar-transition",
          !hideSidebar && "md:pl-16",
          !hideSidebar && isExpanded && "md:pl-56",
          fullWidth ? "px-0" : "px-4 py-6 lg:px-8"
        )}
      >
        {children}
      </main>
    </div>
  );
}
