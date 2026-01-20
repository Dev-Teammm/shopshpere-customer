"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Calendar,
  CreditCard,
  User,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  MessageSquare,
  Paperclip,
  Download,
  Eye,
  RotateCcw,
  DollarSign,
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
import { toast } from "sonner";
import {
  ReturnService,
  ReturnRequest,
  ReturnStatus,
  AppealStatus,
  MediaAttachment,
} from "@/lib/services/returnService";

export default function ReturnInfoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderNumber = searchParams.get("orderNumber");
  const returnId = searchParams.get("returnId");
  const token = searchParams.get("token");

  useEffect(() => {
    const fetchReturnInfo = async () => {
      if (!orderNumber && !returnId) {
        setError("No order number or return ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let returnData: ReturnRequest | null = null;

        if (returnId) {
          returnData = await ReturnService.getReturnById(
            Number(returnId),
            token || undefined,
          );
        } else if (orderNumber) {
          returnData = await ReturnService.getReturnByOrderNumber(
            orderNumber,
            token || undefined,
          );
        }

        if (!returnData) {
          setError("No return request found for this order");
        } else {
          setReturnRequest(returnData);
        }
      } catch (err: any) {
        console.error("Error fetching return info:", err);
        setError(err.message || "Failed to fetch return information");
        toast.error(err.message || "Failed to fetch return information");
      } finally {
        setLoading(false);
      }
    };

    fetchReturnInfo();
  }, [orderNumber, returnId, token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: ReturnStatus | AppealStatus) => {
    switch (status) {
      case ReturnStatus.PENDING:
      case AppealStatus.PENDING:
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case ReturnStatus.APPROVED:
      case AppealStatus.APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case ReturnStatus.DENIED:
      case AppealStatus.DENIED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      case ReturnStatus.PROCESSING:
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      case ReturnStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case ReturnStatus.CANCELLED:
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                Loading return information...
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
        <div className="max-w-4xl mx-auto">
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

  if (!returnRequest) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              No Return Request Found
            </h2>
            <p className="text-muted-foreground mb-6">
              There is no return request associated with this order.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button asChild>
                <Link href={`/returns/request?orderNumber=${orderNumber}`}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Request Return
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
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
          <span className="text-foreground">Return Information</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Return Request Information</h1>
            <p className="text-muted-foreground">
              Order #{returnRequest.orderNumber} • Return #{returnRequest.id}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/track-order`}>
                <Package className="h-4 w-4 mr-2" />
                Track Another Order
              </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Return Request Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Return Request #{returnRequest.id}
                  </CardTitle>
                  <CardDescription>
                    Submitted on {formatDate(returnRequest.submittedAt)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(returnRequest.status)}
                  <Badge
                    className={ReturnService.getStatusColor(
                      returnRequest.status,
                    )}
                  >
                    {returnRequest.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Customer:</strong> {returnRequest.customerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Email:</strong> {returnRequest.customerEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Submitted:</strong>{" "}
                      {formatDate(returnRequest.submittedAt)}
                    </span>
                  </div>
                  {returnRequest.processedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Processed:</strong>{" "}
                        {formatDate(returnRequest.processedAt)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {returnRequest.refundAmount && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Refund Amount:</strong>{" "}
                        {ReturnService.formatCurrency(
                          returnRequest.refundAmount,
                        )}
                      </span>
                    </div>
                  )}
                  {returnRequest.refundMethod && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Refund Method:</strong>{" "}
                        {returnRequest.refundMethod}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Return Reason
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Reason:
                  </span>
                  <p className="mt-1">{returnRequest.reason}</p>
                </div>
                {returnRequest.description && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Description:
                    </span>
                    <p className="mt-1 text-sm">{returnRequest.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Decision Notes */}
          {returnRequest.decisionNotes && (
            <Card
              className={
                returnRequest.status === ReturnStatus.APPROVED
                  ? "border-green-200 bg-green-50"
                  : returnRequest.status === ReturnStatus.DENIED
                    ? "border-red-200 bg-red-50"
                    : ""
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Decision Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{returnRequest.decisionNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Return Media Attachments */}
          {returnRequest.returnMedia &&
            Array.isArray(returnRequest.returnMedia) &&
            returnRequest.returnMedia.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Attachments ({returnRequest.returnMedia.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {returnRequest.returnMedia.map(
                      (media: MediaAttachment, index: number) => (
                        <div key={index} className="border rounded-md p-4">
                          {media.image && (
                            <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-3">
                              <img
                                src={media.fileUrl}
                                alt={`Return attachment ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {media.video && (
                            <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-3">
                              <video
                                src={media.fileUrl}
                                controls
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {media.fileType} File
                              </span>
                              <Badge variant="outline">
                                {media.fileExtension?.toUpperCase()}
                              </Badge>
                            </div>
                            {media.fileSize && (
                              <p className="text-xs text-muted-foreground">
                                Size:{" "}
                                {(media.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <a
                                  href={media.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </a>
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <a href={media.fileUrl} download>
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Return Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items to Return ({returnRequest.returnItems?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {returnRequest.returnItems &&
                returnRequest.returnItems.length > 0 ? (
                  returnRequest.returnItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 border rounded-md"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.productName}</h4>
                        {item.variantName && (
                          <p className="text-sm text-gray-600">
                            Variant: {item.variantName}
                          </p>
                        )}
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.returnQuantity}
                            {item.unitPrice &&
                              ` • Unit Price: ${ReturnService.formatCurrency(
                                item.unitPrice,
                              )}`}
                          </p>
                          {item.totalPrice && (
                            <p className="text-sm font-medium">
                              Total:{" "}
                              {ReturnService.formatCurrency(item.totalPrice)}
                            </p>
                          )}
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <p className="text-xs text-muted-foreground">
                              Return Reason:
                            </p>
                            <p className="text-sm">{item.itemReason}</p>
                            {item.condition && (
                              <>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Condition:
                                </p>
                                <p className="text-sm">{item.condition}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No items found for this return request.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Return Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Return Process Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">
                      Return Request Submitted
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(returnRequest.submittedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      returnRequest.status !== ReturnStatus.PENDING
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium">Under Review</p>
                    <p className="text-xs text-muted-foreground">
                      {returnRequest.status !== ReturnStatus.PENDING
                        ? "Completed"
                        : "In progress"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      returnRequest.status == ReturnStatus.PENDING
                        ? "bg-gray-500"
                        : returnRequest.status == ReturnStatus.APPROVED
                          ? "bg-green-500"
                          : "bg-red-500"
                    }`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium">Decision Made</p>
                    <p className="text-xs text-muted-foreground">
                      {returnRequest.status}
                    </p>
                  </div>
                </div>

                {(returnRequest.status === ReturnStatus.APPROVED ||
                  returnRequest.status === ReturnStatus.PROCESSING ||
                  returnRequest.status === ReturnStatus.COMPLETED) && (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          returnRequest.status === ReturnStatus.COMPLETED
                            ? "bg-green-500"
                            : returnRequest.status === ReturnStatus.PROCESSING
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }`}
                      ></div>
                      <div>
                        <p className="text-sm font-medium">Processing Return</p>
                        <p className="text-xs text-muted-foreground">
                          {returnRequest.status === ReturnStatus.COMPLETED
                            ? "Completed"
                            : returnRequest.status === ReturnStatus.PROCESSING
                              ? "In progress"
                              : "Ready to process"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          returnRequest.status === ReturnStatus.COMPLETED
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                      <div>
                        <p className="text-sm font-medium">Refund Processed</p>
                        <p className="text-xs text-muted-foreground">
                          {returnRequest.status === ReturnStatus.COMPLETED
                            ? "Completed"
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Appeal Information */}
          {returnRequest.returnAppeal && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <MessageSquare className="h-5 w-5" />
                    Appeal Information
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(returnRequest.returnAppeal.status)}
                    <Badge
                      className={ReturnService.getStatusColor(
                        returnRequest.returnAppeal.status,
                      )}
                    >
                      {returnRequest.returnAppeal.status}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Submitted on{" "}
                  {formatDate(returnRequest.returnAppeal.submittedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-blue-700">
                      Appeal Reason:
                    </span>
                    <p className="mt-1 text-sm text-blue-800">
                      {returnRequest.returnAppeal.reason}
                    </p>
                  </div>
                  {returnRequest.returnAppeal.description && (
                    <div>
                      <span className="text-sm font-medium text-blue-700">
                        Description:
                      </span>
                      <p className="mt-1 text-sm text-blue-800">
                        {returnRequest.returnAppeal.description}
                      </p>
                    </div>
                  )}
                  {returnRequest.returnAppeal.decisionNotes && (
                    <div className="p-3 bg-white rounded border">
                      <span className="text-sm font-medium text-gray-700">
                        Appeal Decision:
                      </span>
                      <p className="mt-1 text-sm">
                        {returnRequest.returnAppeal.decisionNotes}
                      </p>
                      {returnRequest.returnAppeal.processedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Processed on{" "}
                          {formatDate(returnRequest.returnAppeal.processedAt)}
                        </p>
                      )}
                    </div>
                  )}
                  {returnRequest.returnAppeal.mediaAttachments &&
                    Array.isArray(
                      returnRequest.returnAppeal.mediaAttachments,
                    ) &&
                    returnRequest.returnAppeal.mediaAttachments.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-blue-700">
                          Attachments:
                        </span>
                        <div className="mt-2 space-y-2">
                          {returnRequest.returnAppeal.mediaAttachments.map(
                            (attachment: MediaAttachment, index: number) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 bg-white rounded border"
                              >
                                <Paperclip className="h-4 w-4 text-blue-600" />
                                <span className="text-sm flex-1">
                                  {attachment.fileName}
                                </span>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" asChild>
                                    <a
                                      href={attachment.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </a>
                                  </Button>
                                  <Button size="sm" variant="outline" asChild>
                                    <a
                                      href={attachment.fileUrl}
                                      download={attachment.fileName}
                                    >
                                      <Download className="h-3 w-3" />
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Order
                </Button>

                <Button variant="outline" asChild>
                  <Link
                    href={`/track-order`}
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Track Another Order
                  </Link>
                </Button>

                {returnRequest.status === ReturnStatus.DENIED &&
                  !returnRequest.returnAppeal && (
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link
                        href={`/returns/appeal?returnRequestId=${returnRequest.id}${token ? `&token=${token}` : ""}`}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Submit Appeal
                      </Link>
                    </Button>
                  )}

                {returnRequest.status === ReturnStatus.PENDING && (
                  <Button variant="outline" asChild>
                    <Link href="/returns" className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      All Returns
                    </Link>
                  </Button>
                )}

                <Button variant="outline" asChild>
                  <Link href="/" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
