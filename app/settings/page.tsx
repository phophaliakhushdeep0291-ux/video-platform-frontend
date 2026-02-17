"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Camera, Save } from "lucide-react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, ApiError } from "@/components/auth/auth-provider";
import api from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);

  // BUG FIX: Calling router.push during render is not allowed.
  // Must redirect in useEffect.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // BUG FIX: profileData was initialised with user values at component creation,
  // but user is often null on first render (auth still loading).
  // Sync profileData whenever user becomes available.
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await api.patch(API_ROUTES.UPDATE_ACCOUNT, profileData);
      await refreshUser();
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to update profile"
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    // BUG FIX: also validate that oldPassword is not empty
    if (!passwordData.oldPassword) {
      toast.error("Please enter your current password");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await api.post(API_ROUTES.CHANGE_PASSWORD, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to change password"
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;
    setIsUpdatingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      await api.patch(API_ROUTES.UPDATE_AVATAR, formData);
      await refreshUser();
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to update avatar"
      );
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const uploadCover = async () => {
    if (!coverFile) return;
    setIsUpdatingCover(true);
    try {
      const formData = new FormData();
      formData.append("coverImage", coverFile);
      await api.patch(API_ROUTES.UPDATE_COVER, formData);
      await refreshUser();
      setCoverFile(null);
      setCoverPreview(null);
      toast.success("Cover image updated");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to update cover"
      );
    } finally {
      setIsUpdatingCover(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-accent data-[state=active]:text-foreground"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="images"
              className="data-[state=active]:bg-accent data-[state=active]:text-foreground"
            >
              Images
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="data-[state=active]:bg-accent data-[state=active]:text-foreground"
            >
              Password
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Account Details
              </h2>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, fullName: e.target.value })
                    }
                    className="border-border bg-secondary text-foreground focus:border-primary"
                    disabled={isUpdatingProfile}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settingsEmail" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="settingsEmail"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="border-border bg-secondary text-foreground focus:border-primary"
                    disabled={isUpdatingProfile}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Username</Label>
                  <Input
                    value={user?.username ?? ""}
                    disabled
                    className="border-border bg-muted text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Username cannot be changed
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            {/* Avatar */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Profile Picture
              </h2>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={avatarPreview ?? user?.avatar}
                      alt="Avatar"
                    />
                    <AvatarFallback className="bg-accent text-2xl text-foreground">
                      {user?.fullName?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                    aria-label="Change avatar"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    Upload a new profile picture. JPG, PNG or GIF.
                  </p>
                  {avatarFile && (
                    <Button
                      onClick={uploadAvatar}
                      disabled={isUpdatingAvatar}
                      size="sm"
                      className="w-fit bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isUpdatingAvatar && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Upload Avatar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Cover Image
              </h2>
              <div
                className="group relative aspect-[4/1] w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-secondary"
                onClick={() => coverInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Change cover image"
                onKeyDown={(e) => {
                  if (e.key === "Enter") coverInputRef.current?.click();
                }}
              >
                {coverPreview ?? user?.coverImage ? (
                  <Image
                    src={coverPreview ?? user?.coverImage ?? ""}
                    alt="Cover image"
                    fill
                    className="object-cover"
                    unoptimized={!!coverPreview}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-8 w-8 text-foreground" />
                </div>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              {coverFile && (
                <Button
                  onClick={uploadCover}
                  disabled={isUpdatingCover}
                  size="sm"
                  className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isUpdatingCover && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Upload Cover
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Change Password
              </h2>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword" className="text-foreground">
                    Current Password
                  </Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        oldPassword: e.target.value,
                      })
                    }
                    className="border-border bg-secondary text-foreground focus:border-primary"
                    disabled={isUpdatingPassword}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-foreground">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="border-border bg-secondary text-foreground focus:border-primary"
                    disabled={isUpdatingPassword}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="border-border bg-secondary text-foreground focus:border-primary"
                    disabled={isUpdatingPassword}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <Separator className="bg-border" />
                <Button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
