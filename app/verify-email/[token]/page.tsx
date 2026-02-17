"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import api, { ApiError } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";

export default function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    // BUG FIX: if no token in params, skip the request and show error immediately
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Please check your email.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get(`${API_ROUTES.VERIFY_EMAIL}/${token}`);
        setStatus("success");
        setMessage(response.message || "Email verified successfully!");
      } catch (error) {
        setStatus("error");
        // BUG FIX: ApiError has a message property, plain Error does too;
        // check ApiError first since it carries the server message.
        if (error instanceof ApiError) {
          setMessage(error.message);
        } else if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage("Verification failed. The link may have expired.");
        }
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Verifying your email...
              </h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your email address.
              </p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Email verified!
              </h2>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/login")}
            >
              Go to Sign In
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Verification failed
              </h2>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push("/register")}
              >
                Create New Account
              </Button>
              <Button
                variant="outline"
                className="w-full border-border text-foreground"
                onClick={() => router.push("/login")}
              >
                Go to Sign In
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
