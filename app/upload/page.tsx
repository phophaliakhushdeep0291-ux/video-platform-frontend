"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Upload,
  X,
  Film,
  ImagePlus,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";
import { API_ROUTES } from "@/lib/constants";
import { ApiError } from "@/lib/api";

type UploadStep = "select" | "details" | "uploading" | "success";

export default function UploadPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // BUG FIX: store object URLs so we can revoke them to prevent memory leaks
  const videoObjectUrlRef = useRef<string | null>(null);

  const [step, setStep] = useState<UploadStep>("select");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("true");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // BUG FIX: Clean up object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
      }
    };
  }, []);

  const setVideoWithUrl = useCallback((file: File) => {
    // Revoke old URL before creating a new one
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    videoObjectUrlRef.current = url;
    setVideoPreview(url);
  }, []);

  const handleVideoSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 500 * 1024 * 1024) {
        toast.error("Video must be under 500MB");
        return;
      }
      setVideoFile(file);
      setVideoWithUrl(file);
      setStep("details");
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    },
    [title, setVideoWithUrl]
  );

  const handleThumbnailSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setThumbnail(file);
      const reader = new FileReader();
      reader.onload = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith("video/")) return;
      if (file.size > 500 * 1024 * 1024) {
        toast.error("Video must be under 500MB");
        return;
      }
      setVideoFile(file);
      setVideoWithUrl(file);
      setStep("details");
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    },
    [title, setVideoWithUrl]
  );

  const resetForm = useCallback(() => {
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }
    setVideoFile(null);
    setVideoPreview(null);
    setThumbnail(null);
    setThumbnailPreview(null);
    setTitle("");
    setDescription("");
    setUploadProgress(0);
    setUploadedVideoId(null);
    setStep("select");
  }, []);

  const handleUpload = useCallback(async () => {
    if (!videoFile || !title.trim()) {
      toast.error("Please provide a title and video file");
      return;
    }
    if (!thumbnail) {
      toast.error("Please provide a thumbnail image");
      return;
    }

    setStep("uploading");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("videoFile", videoFile);
    formData.append("thumbnail", thumbnail);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("isPublished", visibility);

    // BUG FIX: keep a reference to the interval so it can always be cleared,
    // even if an error occurs before clearInterval is reached in the try block.
    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return 90;
          }
          return Math.min(prev + Math.random() * 15, 90);
        });
      }, 500);

      const response = await fetch(`http://localhost:8000/api/v1${API_ROUTES.UPLOAD_VIDEO}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (progressInterval) clearInterval(progressInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new ApiError(
          errData?.message || "Upload failed",
          response.status
        );
      }

      const data = await response.json();
      setUploadProgress(100);
      setUploadedVideoId(data.data?._id ?? null);
      setStep("success");
      toast.success("Video uploaded successfully!");
    } catch (error) {
      // BUG FIX: always clear the interval in the catch block too
      if (progressInterval) clearInterval(progressInterval);
      setStep("details");
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Upload failed. Please try again.");
      }
    }
  }, [videoFile, thumbnail, title, description, visibility]);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Upload video</h1>
          <p className="text-sm text-muted-foreground">
            Share your content with the world
          </p>
        </div>

        {/* Step: Select file */}
        {step === "select" && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex min-h-[350px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-secondary/50 p-8 transition-colors hover:border-primary/50"
            onClick={() => videoInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload video file"
            onKeyDown={(e) =>
              e.key === "Enter" && videoInputRef.current?.click()
            }
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-base font-medium text-foreground">
                Drag and drop video files to upload
              </p>
              <p className="text-sm text-muted-foreground">
                Or click to select a file (max 500MB)
              </p>
            </div>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Select File
            </Button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Step: Fill details */}
        {step === "details" && (
          <div className="space-y-6">
            {/* Video preview */}
            {videoPreview && (
              <div className="relative overflow-hidden rounded-xl bg-secondary">
                <div className="flex items-center gap-3 border-b border-border p-3">
                  <Film className="h-5 w-5 text-primary" />
                  <div className="flex-1 truncate text-sm text-foreground">
                    {videoFile?.name}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      resetForm();
                    }}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    aria-label="Remove video"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <video
                  src={videoPreview}
                  className="aspect-video w-full"
                  controls
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Add a title that describes your video"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
                  maxLength={100}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {title.length}/100
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Tell viewers about your video"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] resize-none border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary"
                  maxLength={5000}
                />
              </div>

              {/* Thumbnail */}
              <div className="space-y-2">
                <Label className="text-foreground">
                  Thumbnail <span className="text-destructive">*</span>
                </Label>
                <div
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="group flex h-40 w-72 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-secondary/50 transition-colors hover:border-primary/50"
                  role="button"
                  tabIndex={0}
                  aria-label="Upload thumbnail"
                  onKeyDown={(e) =>
                    e.key === "Enter" && thumbnailInputRef.current?.click()
                  }
                >
                  {thumbnailPreview ? (
                    <Image
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      width={288}
                      height={160}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImagePlus className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Upload thumbnail
                      </span>
                    </div>
                  )}
                </div>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                />
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <Label className="text-foreground">Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="w-48 border-border bg-secondary text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem
                      value="true"
                      className="text-foreground focus:bg-accent focus:text-foreground"
                    >
                      Public
                    </SelectItem>
                    <SelectItem
                      value="false"
                      className="text-foreground focus:bg-accent focus:text-foreground"
                    >
                      Private
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!title.trim() || !thumbnail}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Uploading */}
        {step === "uploading" && (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-6 rounded-xl bg-secondary/50 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="w-full max-w-sm space-y-3 text-center">
              <p className="text-base font-medium text-foreground">
                Uploading your video...
              </p>
              <Progress
                value={uploadProgress}
                className="h-2 bg-accent [&>div]:bg-primary"
              />
              <p className="text-sm text-muted-foreground">
                {Math.round(uploadProgress)}% complete
              </p>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-6 rounded-xl bg-secondary/50 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Upload complete!
              </h2>
              <p className="text-sm text-muted-foreground">
                Your video has been uploaded and is being processed.
              </p>
            </div>
            <div className="flex gap-3">
              {uploadedVideoId && (
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => router.push(`/watch/${uploadedVideoId}`)}
                >
                  View Video
                </Button>
              )}
              <Button
                variant="outline"
                className="border-border text-foreground"
                onClick={resetForm}
              >
                Upload Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
