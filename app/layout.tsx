import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SidebarProvider } from "@/components/layout/sidebar-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "VideoTube - Watch, Upload & Share Videos",
    template: "%s | VideoTube",
  },
  description:
    "VideoTube is a modern video streaming platform where you can watch, upload, and share videos with the world.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <SidebarProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                classNames: {
                  toast: "bg-card border-border text-foreground",
                  description: "text-muted-foreground",
                },
              }}
            />
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
