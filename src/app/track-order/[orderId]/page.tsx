"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  Calendar,
  CreditCard,
  User,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle,
  RotateCcw,
  ExternalLink,
  Navigation,
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
import {
  OrderService,
  OrderDetailsResponse,
  OrderItemResponse,
} from "@/lib/orderService";
import { ReturnService } from "@/lib/services/returnService";
import { DeliveryNotesDialog } from "@/components/orders/DeliveryNotesDialog";
import { ShopOrderGroup } from "@/components/orders/ShopOrderGroup";
import OrderTimeline from "@/components/OrderTimeline";
import { orderActivitiesService } from "@/lib/services/orderActivitiesService";

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = params.orderId as string;
  const token = searchParams.get("token");

  const [orderDetails, setOrderDetails] = useState<OrderDetailsResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasReturnRequest, setHasReturnRequest] = useState<boolean>(false);
  const [checkingReturn, setCheckingReturn] = useState<boolean>(false);
  const [showOrderNotes, setShowOrderNotes] = useState(false);
  const [showGroupNotes, setShowGroupNotes] = useState(false);
  const [timelineActivities, setTimelineActivities] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(
        "No access token provided. Please use the link from your email.",
      );
      setIsLoading(false);
      return;
    }

    if (!orderId) {
      setError("No order ID provided.");
      setIsLoading(false);
      return;
    }

    fetchOrderDetails();
  }, [orderId, token]);

  const fetchOrderDetails = async () => {
    if (!token || !orderId) return;

    setIsLoading(true);
    setError(null);

    try {
      const orderDetails = await OrderService.getOrderByTokenAndId(
        token,
        parseInt(orderId),
      );
      setOrderDetails(orderDetails);

      // Check for return request
      if (orderDetails.orderNumber) {
        await checkForReturnRequest(orderDetails.orderNumber);
      }

      // Fetch timeline activities
      await fetchTimelineActivities();

      toast.success("Order details loaded successfully!");
    } catch (err: any) {
      console.error("Error fetching order details:", err);
      setError(err.message || "Failed to load order details");
      toast.error(err.message || "Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimelineActivities = async () => {
    if (!token || !orderId) return;

    setLoadingTimeline(true);
    try {
      const data = await orderActivitiesService.getOrderActivitiesWithToken(
        orderId,
        token,
      );
      setTimelineActivities(data.activities || []);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      // Don't show error toast - timeline is optional
      setTimelineActivities([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const checkForReturnRequest = async (orderNumber: string) => {
    try {
      setCheckingReturn(true);
      const returnRequest =
        await ReturnService.getReturnByOrderNumber(orderNumber);
      setHasReturnRequest(!!returnRequest);
    } catch (error) {
      // No return request found or error - that's okay
      setHasReturnRequest(false);
    } finally {
      setCheckingReturn(false);
    }
  };

  const handleBackToOrders = () => {
    router.push(`/track-order?token=${encodeURIComponent(token || "")}`);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getDaysRemainingBadge = (item: any) => {
    if (!item.returnEligible) {
      return (
        <Badge variant="destructive" className="ml-2">
          Return Expired
        </Badge>
      );
    }

    if (item.daysRemainingForReturn <= 3) {
      return (
        <Badge variant="destructive" className="ml-2">
          {item.daysRemainingForReturn} days left
        </Badge>
      );
    } else if (item.daysRemainingForReturn <= 7) {
      return (
        <Badge variant="secondary" className="ml-2">
          {item.daysRemainingForReturn} days left
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="ml-2">
          {item.daysRemainingForReturn} days left
        </Badge>
      );
    }
  };

  const openInGoogleMaps = () => {
    if (
      orderDetails?.shippingAddress?.latitude &&
      orderDetails?.shippingAddress?.longitude
    ) {
      const url = `https://www.google.com/maps?q=${orderDetails.shippingAddress.latitude},${orderDetails.shippingAddress.longitude}`;
      window.open(url, "_blank");
    }
  };

  const getDirections = () => {
    if (
      orderDetails?.shippingAddress?.latitude &&
      orderDetails?.shippingAddress?.longitude
    ) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${orderDetails.shippingAddress.latitude},${orderDetails.shippingAddress.longitude}`;
      window.open(url, "_blank");
    }
  };

  const allItems: OrderItemResponse[] =
    orderDetails?.shopOrders?.flatMap((so) => so.items) || [];

  const hasEligibleItems =
    allItems.some((item) => item.returnEligible) || false;
  const isDelivered =
    orderDetails?.overallStatus?.toLowerCase() === "delivered";
  const isProcessing =
    orderDetails?.overallStatus?.toLowerCase() === "processing";
  const canRequestReturn = (isDelivered || isProcessing) && hasEligibleItems;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-muted-foreground">
              Loading order details...
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
          <Button onClick={handleBackToOrders} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Order not found.</AlertDescription>
          </Alert>
          <Button onClick={handleBackToOrders} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={handleBackToOrders}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Order #{orderDetails.orderCode || orderDetails.orderNumber}
              </h1>
              <p className="text-muted-foreground">
                Placed on{" "}
                {orderDetails.orderDate
                  ? new Date(orderDetails.orderDate).toLocaleDateString()
                  : orderDetails.createdAt
                    ? new Date(orderDetails.createdAt).toLocaleDateString()
                    : "N/A"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={getStatusColor(
                  orderDetails.overallStatus || orderDetails.status || "",
                )}
              >
                {orderDetails.overallStatus || orderDetails.status}
              </Badge>
              {hasReturnRequest && (
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-300"
                >
                  Return Active
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        {loadingTimeline ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Order Timeline
            </h2>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-muted-foreground">
                Loading timeline...
              </span>
            </div>
          </div>
        ) : (
          <OrderTimeline activities={timelineActivities} />
        )}

        <div className="space-y-6">
          {/* Shop Grouped Orders */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Package className="h-6 w-6 text-blue-600" />
              Order Items by Shop
            </h2>
            {orderDetails.shopOrders && orderDetails.shopOrders.length > 0 ? (
              orderDetails.shopOrders.map((shopOrder) => (
                <ShopOrderGroup
                  key={shopOrder.shopOrderId}
                  shopOrder={shopOrder}
                  isGuest={true}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No items found in this order.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Items Subtotal:</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(orderDetails.subtotal || 0)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Total Shipping:</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(
                    orderDetails.totalShipping || orderDetails.shipping || 0,
                  )}
                </span>
              </div>

              {(orderDetails.totalDiscount ?? 0) > 0 && (
                <div className="flex justify-between text-green-600 italic">
                  <span>Total Discount:</span>
                  <span className="font-medium">
                    -
                    {formatCurrency(
                      orderDetails.totalDiscount || orderDetails.discount || 0,
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-600">Tax:</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(orderDetails.tax || 0)}
                </span>
              </div>

              <Separator className="bg-slate-200" />
              <div className="flex justify-between font-bold text-xl text-slate-900">
                <span>Grand Total:</span>
                <span>
                  {formatCurrency(
                    orderDetails.grandTotal || orderDetails.total || 0,
                  )}
                </span>
              </div>

              {/* Payment Info */}
              {orderDetails.paymentInfo && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5" />
                      Payment Method:
                    </span>
                    <span className="font-medium uppercase">
                      {orderDetails.paymentInfo.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Payment Status:</span>
                    <Badge
                      variant={
                        orderDetails.paymentInfo.paymentStatus ===
                          "COMPLETED" ||
                        orderDetails.paymentInfo.paymentStatus === "SUCCESS"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {orderDetails.paymentInfo.paymentStatus}
                    </Badge>
                  </div>
                  {orderDetails.paymentInfo.pointsUsed > 0 && (
                    <div className="flex justify-between text-sm py-1.5 px-2 bg-blue-50/50 rounded-md border border-blue-100/50">
                      <span className="text-blue-600 flex items-center gap-1 italic">
                        <Info className="h-3 w-3" />
                        Points Applied:
                      </span>
                      <span className="font-bold text-blue-700">
                        -{formatCurrency(orderDetails.paymentInfo.pointsValue)}
                        <span className="text-[10px] ml-1 opacity-70 italic">
                          ({orderDetails.paymentInfo.pointsUsed} pts)
                        </span>
                      </span>
                    </div>
                  )}
                  {orderDetails.paymentInfo.transactionRef && (
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>
                        Ref: {orderDetails.paymentInfo.transactionRef}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orderDetails.customerInfo && (
                <>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{orderDetails.customerInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{orderDetails.customerInfo.email}</span>
                  </div>
                  {orderDetails.customerInfo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{orderDetails.customerInfo.phone}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {orderDetails.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <p>{orderDetails.shippingAddress.street}</p>
                  <p>
                    {orderDetails.shippingAddress.city},{" "}
                    {orderDetails.shippingAddress.state}
                  </p>
                  <p>{orderDetails.shippingAddress.country}</p>
                </div>

                {/* Google Maps Integration */}
                {orderDetails.shippingAddress.latitude &&
                  orderDetails.shippingAddress.longitude && (
                    <div className="space-y-3">
                      <div className="relative w-full h-48 rounded-md overflow-hidden border">
                        <iframe
                          src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${orderDetails.shippingAddress.latitude},${orderDetails.shippingAddress.longitude}&zoom=18&maptype=satellite`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Coordinates: {orderDetails.shippingAddress.latitude},{" "}
                        {orderDetails.shippingAddress.longitude}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={openInGoogleMaps}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open in Maps
                        </Button>
                        <Button
                          onClick={getDirections}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Get Directions
                        </Button>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          {orderDetails.paymentMethod && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="capitalize">
                    {orderDetails.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <Badge
                    variant={
                      orderDetails.paymentStatus === "COMPLETED"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {orderDetails.paymentStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delivery Notes Dialogs */}
      {orderDetails && (
        <>
          <DeliveryNotesDialog
            open={showOrderNotes}
            onOpenChange={setShowOrderNotes}
            orderId={parseInt(orderId)}
            title="Order Delivery Notes"
          />
        </>
      )}
    </div>
  );
}
