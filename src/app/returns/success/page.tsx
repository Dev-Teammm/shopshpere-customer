"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Package,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  Home,
} from "lucide-react";
import { ReturnService, ReturnRequest } from "@/lib/services/returnService";
import { toast } from "sonner";

export default function ReturnSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const token = searchParams.get("token");

  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (requestId) {
      loadReturnRequest();
    } else {
      setLoading(false);
    }
  }, [requestId, token]);

  const loadReturnRequest = async () => {
    if (!requestId) return;

    try {
      // Use getReturnById instead of getReturnRequestDetails and pass token
      const request = await ReturnService.getReturnById(
        Number(requestId),
        token || undefined,
      );
      setReturnRequest(request);
    } catch (error) {
      console.error("Failed to load return request:", error);
      toast.error("Failed to load return request details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return <Badge variant="secondary">Pending Review</Badge>;
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-600">
            Approved
          </Badge>
        );
      case "DENIED":
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading return request details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Return Request Submitted!
        </h1>
        <p className="text-gray-600">
          Your return request has been successfully submitted and is now under
          review.
        </p>
      </div>

      {/* Return Request Details */}
      {returnRequest && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Return Request Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Request ID</p>
                <p className="font-semibold">#{returnRequest.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="mt-1">
                  {getStatusBadge(returnRequest.status)}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted Date</p>
                <p className="font-semibold">
                  {new Date(returnRequest.submittedAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-semibold">#{returnRequest.orderNumber}</p>
              </div>
            </div>

            {returnRequest.reason && (
              <div>
                <p className="text-sm text-gray-500">General Reason</p>
                <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">
                  {returnRequest.reason}
                </p>
              </div>
            )}

            <Separator />

            {/* Return Items */}
            <div>
              <h3 className="font-semibold mb-3">
                Items to Return ({returnRequest.returnItems.length})
              </h3>
              <div className="space-y-3">
                {returnRequest.returnItems.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">
                          Item{" "}
                          {item.productName
                            ? `- ${item.productName}`
                            : `#${index + 1}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.returnQuantity}
                        </p>
                      </div>
                    </div>
                    {item.itemReason && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Reason:</p>
                        <p className="text-sm">{item.itemReason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Media Files */}
            {returnRequest.returnMedia &&
              returnRequest.returnMedia.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">
                      Attached Files ({returnRequest.returnMedia.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {returnRequest.returnMedia.map((media) => (
                        <div key={media.id} className="border rounded-md p-2">
                          <div className="aspect-square bg-gray-100 rounded mb-2 overflow-hidden">
                            {media.fileType.startsWith("image/") ? (
                              <img
                                src={media.fileUrl}
                                alt="Return media"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {media.fileType}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
          </CardContent>
        </Card>
      )}

      {/* What Happens Next */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            What Happens Next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">1</span>
              </div>
              <div>
                <p className="font-medium">Review Process</p>
                <p className="text-sm text-gray-600">
                  Our team will review your return request within 1-2 business
                  days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">2</span>
              </div>
              <div>
                <p className="font-medium">Decision Notification</p>
                <p className="text-sm text-gray-600">
                  You'll receive an email notification once your request is
                  approved or if we need more information.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">3</span>
              </div>
              <div>
                <p className="font-medium">Return Instructions</p>
                <p className="text-sm text-gray-600">
                  If approved, we'll provide instructions on how to return your
                  items.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              Keep your items in their original condition until you receive
              return instructions.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              You can track the status of your return request in your account
              dashboard.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              Refunds will be processed to your original payment method once
              items are received and inspected.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              If you have questions, contact our customer support team.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={() => {
            if (token && returnRequest) {
              router.push(
                `/returns/info?returnId=${returnRequest.id}&token=${token}`,
              );
            } else {
              router.push("/orders");
            }
          }}
          className="flex items-center gap-2"
        >
          <Package className="h-4 w-4" />
          {token ? "View Return Status" : "View My Orders"}
        </Button>
        <Button
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Continue Shopping
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
