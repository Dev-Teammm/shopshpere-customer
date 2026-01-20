"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Image as ImageIcon,
  Video,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ReturnService, ReturnRequest } from "@/lib/services/returnService";

export default function OrderReturnRequestsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = params.orderId as string;
  const trackingToken = searchParams.get("token");
  const orderNumber = searchParams.get("orderNumber");
  const customerId = searchParams.get("customerId");
  const isShopOrder = searchParams.get("isShopOrder") === "true";

  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isGuestMode = !!trackingToken && !!orderNumber;

  useEffect(() => {
    fetchReturnRequests();
  }, [orderId, trackingToken, orderNumber, customerId, isShopOrder]);

  const fetchReturnRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let requests: ReturnRequest[];

      if (isGuestMode) {
        // Guest user - use tracking token
        if (!orderNumber || !trackingToken) {
          throw new Error("Order number and tracking token are required");
        }
        requests = await ReturnService.getReturnRequestsByOrderNumberAndToken(
          orderNumber,
          trackingToken
        );
      } else {
        // Authenticated user
        if (!customerId) {
          // If no customerId in params, try to get from localStorage (though usually passed or context)
          // For now fail if missing as per existing logic, or rely on service to handle auth
          if (typeof window !== "undefined") {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
              const user = JSON.parse(storedUser);
              if (user && user.id) {
                // We can proceed if we have user ID
              } else {
                throw new Error("Customer ID is required");
              }
            } else {
              throw new Error("Customer ID is required");
            }
          }
        }

        if (isShopOrder) {
          requests = await ReturnService.getReturnRequestsByShopOrderId(
            parseInt(orderId),
            customerId || JSON.parse(localStorage.getItem("user") || "{}").id
          );
        } else {
          requests = await ReturnService.getReturnRequestsByOrderId(
            parseInt(orderId),
            customerId || JSON.parse(localStorage.getItem("user") || "{}").id
          );
        }
      }

      setReturnRequests(requests);

      if (requests.length === 0) {
        toast.info("No return requests found for this order");
      } else {
        toast.success(`Loaded ${requests.length} return request(s)`);
      }
    } catch (err: any) {
      console.error("Error fetching return requests:", err);
      const errorMessage = err.message || "Failed to load return requests";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (isGuestMode) {
      router.push(`/track-order/${orderId}?token=${trackingToken}`);
    } else {
      router.push(`/account/orders/${orderId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-300";
      case "DENIED":
        return "bg-red-100 text-red-800 border-red-300";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "DENIED":
        return <XCircle className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-muted-foreground">
              Loading return requests...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button onClick={handleBack} variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RotateCcw className="h-8 w-8" />
            Return Requests
          </h1>
          <p className="text-muted-foreground mt-2">
            {isGuestMode ? `Order #${orderNumber}` : `Order #${orderId}`}
          </p>
        </div>

        {/* Return Requests List */}
        {returnRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Return Requests
                </h3>
                <p className="text-muted-foreground mb-4">
                  You haven't submitted any return requests for this order yet.
                </p>
                <Button
                  onClick={() => {
                    if (isGuestMode) {
                      router.push(
                        `/returns/request?orderId=${orderId}&token=${trackingToken}`
                      );
                    } else {
                      router.push(`/returns/request?orderId=${orderId}`);
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Request Return
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {returnRequests.map((request, index) => (
              <Card key={request.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Return Request #{index + 1}
                        <Badge
                          className={`${getStatusColor(request.status)} border`}
                        >
                          <span className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            {request.status}
                          </span>
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Submitted: {formatDate(request.submittedAt)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  {/* Return Reason */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Return Reason
                    </h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {request.reason}
                    </p>
                  </div>

                  {/* Return Items */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Items ({request.returnItems.length})
                    </h4>
                    <div className="space-y-2">
                      {request.returnItems.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between p-3 bg-muted rounded-md"
                        >
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            {item.variantName && (
                              <p className="text-sm text-muted-foreground">
                                {item.variantName}
                              </p>
                            )}
                            {item.itemReason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Reason: {item.itemReason}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">
                            Qty: {item.returnQuantity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expected Refund */}
                  {request.expectedRefund && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Expected Refund
                      </h4>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              Payment Method
                            </span>
                            <Badge variant="outline" className="font-mono">
                              {request.expectedRefund.paymentMethod}
                            </Badge>
                          </div>

                          {request.expectedRefund.monetaryRefund > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">
                                Card Refund
                              </span>
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                $
                                {(
                                  request.expectedRefund.monetaryRefund || 0
                                ).toFixed(2)}
                              </span>
                            </div>
                          )}

                          {request.expectedRefund.pointsRefund > 0 && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">
                                  Points Refund
                                </span>
                                <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                  {request.expectedRefund.pointsRefund} pts
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">
                                  Points Value
                                </span>
                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                  $
                                  {(
                                    request.expectedRefund.pointsRefundValue ||
                                    0
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </>
                          )}

                          <Separator />

                          <div className="flex items-center justify-between">
                            <span className="font-semibold">
                              Total Refund Value
                            </span>
                            <span className="text-xl font-bold text-green-600 dark:text-green-400">
                              $
                              {(
                                request.expectedRefund.totalRefundValue || 0
                              ).toFixed(2)}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground italic pt-2 border-t">
                            {request.expectedRefund.refundDescription}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Media Attachments */}
                  {request.returnMedia && request.returnMedia.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Media Attachments ({request.returnMedia.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {request.returnMedia.map((media) => (
                          <div key={media.id} className="relative group">
                            {media.fileType === "IMAGE" ? (
                              <img
                                src={media.fileUrl}
                                alt="Return media"
                                className="w-full h-32 object-cover rounded-md border"
                              />
                            ) : (
                              <div className="w-full h-32 bg-muted rounded-md border flex items-center justify-center">
                                <Video className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <a
                              href={media.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center text-white text-sm"
                            >
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Decision */}
                  {request.decisionNotes && (
                    <div>
                      <Separator className="mb-4" />
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Decision
                      </h4>
                      <div className="bg-muted p-4 rounded-md space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Date:</span>{" "}
                          {formatDate(request.decisionAt)}
                        </p>
                        {request.decisionNotes && (
                          <p className="text-sm">
                            <span className="font-medium">Notes:</span>{" "}
                            {request.decisionNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Appeal Section */}
                  {request.returnAppeal && (
                    <div>
                      <Separator className="mb-4" />
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Appeal Status
                      </h4>
                      <Card>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status</span>
                            <Badge
                              className={getStatusColor(
                                request.returnAppeal.status
                              )}
                            >
                              {request.returnAppeal.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Appeal Reason</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {request.returnAppeal.reason}
                            </p>
                          </div>
                          {request.returnAppeal.description && (
                            <div>
                              <p className="text-sm font-medium">Description</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {request.returnAppeal.description}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">Submitted At</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(request.returnAppeal.submittedAt)}
                            </p>
                          </div>
                          {request.returnAppeal.decisionAt && (
                            <>
                              <div>
                                <p className="text-sm font-medium">
                                  Decision Date
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {formatDate(request.returnAppeal.decisionAt)}
                                </p>
                              </div>
                              {request.returnAppeal.decisionNotes && (
                                <div>
                                  <p className="text-sm font-medium">
                                    Decision Notes
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {request.returnAppeal.decisionNotes}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {request.canBeAppealed &&
                    request.status === "DENIED" &&
                    !request.returnAppeal && (
                      <div>
                        <Separator className="mb-4" />
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Your return request was denied. You can submit an
                            appeal if you believe this decision was made in
                            error.
                          </AlertDescription>
                        </Alert>
                        <Button
                          onClick={() => {
                            router.push(
                              `/returns/appeal?returnRequestId=${request.id}`
                            );
                          }}
                          className="w-full mt-4"
                          variant="outline"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Submit Appeal
                        </Button>
                      </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
