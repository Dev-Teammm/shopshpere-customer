"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  X,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ReturnService, ReturnRequest } from "@/lib/services/returnService";

interface AppealFormData {
  reason: string;
  description: string;
  mediaFiles: File[];
}

export default function AppealPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AppealFormData>({
    reason: "",
    description: "",
    mediaFiles: [],
  });

  const returnId = searchParams.get("returnRequestId");
  const trackingToken = searchParams.get("token");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      setIsAuthenticated(!!token);
      setIsGuest(!token);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    const fetchReturnInfo = async () => {
      if (!returnId) {
        setError("No return ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Pass the tracking token to the service if available
        const returnData = await ReturnService.getReturnById(
          Number(returnId),
          trackingToken || undefined,
        );

        setReturnRequest(returnData);
        if (returnData.status !== "DENIED") {
          setError("Appeals can only be submitted for denied return requests");
        } else if (returnData.returnAppeal) {
          setError(
            "An appeal has already been submitted for this return request",
          );
        }
      } catch (err: any) {
        console.error("Error fetching return info:", err);
        setError(err.message || "Failed to fetch return information");
      } finally {
        setLoading(false);
      }
    };

    if (authChecked) {
      fetchReturnInfo();
    }
  }, [returnId, authChecked]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Reset input
    e.target.value = "";

    // Check total file limit
    if (formData.mediaFiles.length + files.length > 5) {
      toast.error(
        `You can only upload up to 5 files. Currently you have ${formData.mediaFiles.length} file(s).`,
      );
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate each file
    for (const file of files) {
      try {
        // Check file type
        if (
          !file.type.startsWith("image/") &&
          !file.type.startsWith("video/")
        ) {
          errors.push(`"${file.name}" is not a valid image or video file`);
          continue;
        }

        // Check file size
        const maxSize = file.type.startsWith("image/")
          ? 10 * 1024 * 1024
          : 50 * 1024 * 1024; // 10MB for images, 50MB for videos
        if (file.size > maxSize) {
          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
          const maxSizeMB = file.type.startsWith("image/") ? "10MB" : "50MB";
          errors.push(
            `"${file.name}" is too large (${sizeMB}MB). Maximum size is ${maxSizeMB}`,
          );
          continue;
        }

        // Validate video duration
        if (file.type.startsWith("video/")) {
          const duration = await getVideoDuration(file);
          if (duration > 15) {
            errors.push(
              `"${file.name}" is too long (${duration.toFixed(1)}s). Maximum duration is 15 seconds`,
            );
            continue;
          }
        }

        // If all validations pass, add to valid files
        validFiles.push(file);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        errors.push(`"${file.name}" could not be processed. Please try again.`);
      }
    }

    // Add valid files
    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        mediaFiles: [...prev.mediaFiles, ...validFiles],
      }));
      toast.success(`${validFiles.length} file(s) added successfully`);
    }

    // Show errors if any
    if (errors.length > 0) {
      const errorMessage =
        errors.length === 1
          ? errors[0]
          : `${errors.length} files could not be added:\n${errors.join("\n")}`;
      toast.error(errorMessage, { duration: 8000 });
    }
  };

  // Helper function to get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        reject(new Error("Failed to load video metadata"));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFormData((prev) => {
      const fileToRemove = prev.mediaFiles[index];
      if (fileToRemove) {
        URL.revokeObjectURL(URL.createObjectURL(fileToRemove));
      }

      return {
        ...prev,
        mediaFiles: prev.mediaFiles.filter((_, i) => i !== index),
      };
    });
  };

  useEffect(() => {
    return () => {
      formData.mediaFiles.forEach((file) => {
        URL.revokeObjectURL(URL.createObjectURL(file));
      });
    };
  }, [formData.mediaFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      toast.error("Please provide a reason for your appeal");
      return;
    }

    if (formData.mediaFiles.length === 0) {
      toast.error(
        "At least one image or video is required for appeal submission",
      );
      return;
    }

    try {
      setSubmitting(true);

      // Create FormData for file upload
      const appealFormData = new FormData();
      appealFormData.append("returnRequestId", returnId!);
      appealFormData.append("reason", formData.reason);
      appealFormData.append("description", formData.description);

      formData.mediaFiles.forEach((file, index) => {
        appealFormData.append("mediaFiles", file);
      });

      let response;
      if (isAuthenticated) {
        // Authenticated user appeal
        response = await ReturnService.submitAppeal(appealFormData);
      } else if (trackingToken) {
        // Guest user with tracking token
        appealFormData.append("trackingToken", trackingToken);
        response = await ReturnService.submitTokenizedAppeal(appealFormData);
      } else {
        throw new Error(
          "Missing authentication information for appeal submission",
        );
      }

      toast.success("Appeal submitted successfully!");

      // Navigate back with appropriate parameters
      const baseUrl = `/returns/info?returnId=${returnId}`;
      const tokenParam = trackingToken ? `&token=${trackingToken}` : "";
      const orderParam = returnRequest?.orderNumber
        ? `&orderNumber=${returnRequest.orderNumber}`
        : "";

      router.push(`${baseUrl}${tokenParam}${orderParam}`);
    } catch (err: any) {
      console.error("Error submitting appeal:", err);

      // Enhanced error handling
      if (err.message?.includes("Appeal already exists")) {
        toast.error(
          "An appeal has already been submitted for this return request",
        );
      } else if (err.message?.includes("Appeal period has expired")) {
        toast.error("The appeal period for this return has expired");
      } else if (err.message?.includes("Only denied return requests")) {
        toast.error("Appeals can only be submitted for denied return requests");
      } else if (err.message?.includes("Invalid or expired tracking token")) {
        toast.error(
          "Your access token has expired. Please request a new tracking link.",
        );
      } else {
        toast.error(err.message || "Failed to submit appeal");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked || loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {!authChecked
                  ? "Initializing..."
                  : "Loading return information..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-center">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/track-order" className="hover:text-foreground">
            Track Order
          </Link>
          <span>/</span>
          <Link
            href={`/returns/info?returnId=${returnId}${trackingToken ? `&token=${trackingToken}` : ""}`}
            className="hover:text-foreground"
          >
            Return Information
          </Link>
          <span>/</span>
          <span className="text-foreground">Submit Appeal</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Return Info
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Submit Appeal</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground">
                Return Request #{returnRequest?.id} • Order #
                {returnRequest?.orderNumber}
              </p>
              {/* Access Type Badge */}
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isAuthenticated
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {isAuthenticated ? "Authenticated" : "Guest Access"}
              </span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Appeal Information
            </CardTitle>
            <CardDescription>
              Please provide detailed information about why you believe the
              return denial should be reconsidered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Reason */}
              <div className="space-y-2">
                <label htmlFor="reason" className="text-sm font-medium">
                  Appeal Reason *
                </label>
                <Input
                  id="reason"
                  placeholder="Brief reason for your appeal (e.g., Item was actually defective)"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Detailed Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Provide additional details about your appeal. Explain why you believe the original decision should be reconsidered."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <label className="text-sm font-medium">
                  Supporting Evidence *
                </label>
                <p className="text-sm text-muted-foreground">
                  Upload images or videos that support your appeal. At least one
                  file is required.
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Upload Evidence</p>
                    <p className="text-xs text-muted-foreground">
                      Images up to 10MB, videos up to 50MB and 15 seconds (Max 5
                      files total)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                    >
                      Select Files
                    </Button>
                  </div>
                </div>

                {formData.mediaFiles.length > 0 && (
                  <div className="space-y-4">
                    <label className="text-sm font-medium">
                      Uploaded Files ({formData.mediaFiles.length}/5)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.mediaFiles.map((file, index) => (
                        <div
                          key={index}
                          className="relative border rounded-md p-3 bg-gray-50"
                        >
                          {/* Preview */}
                          <div className="mb-3">
                            {file.type.startsWith("image/") ? (
                              <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : file.type.startsWith("video/") ? (
                              <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                                <video
                                  src={URL.createObjectURL(file)}
                                  className="w-full h-full object-cover"
                                  controls
                                  preload="metadata"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center">
                                <Paperclip className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* File Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                                {file.type.split("/")[0]}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Important Notice */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Appeals are reviewed by our senior
                  customer service team within 3-5 business days. Please ensure
                  all information is accurate and complete as you can only
                  submit one appeal per return request.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || formData.mediaFiles.length === 0}
                  className="flex-1"
                >
                  {submitting ? "Submitting..." : "Submit Appeal"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
