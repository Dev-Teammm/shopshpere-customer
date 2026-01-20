"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CreditCard,
  Package,
  User,
  FileText,
  Check,
  X,
  Truck,
  Phone,
  Mail,
  QrCode,
  Download,
  CheckCircle,
  RotateCcw,
  Info,
  AlertCircle,
  ExternalLink,
  Navigation,
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
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  OrderService,
  OrderDetailsResponse,
  OrderItemResponse,
} from "@/lib/orderService";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import QRCode from "qrcode";
import { DeliveryNotesDialog } from "@/components/orders/DeliveryNotesDialog";
import { ShopOrderGroup } from "@/components/orders/ShopOrderGroup";
import OrderTimeline from "@/components/OrderTimeline";
import { orderActivitiesService } from "@/lib/services/orderActivitiesService";

export default function AccountOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [showOrderNotes, setShowOrderNotes] = useState(false);
  const [timelineActivities, setTimelineActivities] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const generateQRCode = async (pickupToken: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(pickupToken, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    }
  };

  const downloadQRCode = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code downloaded successfully");
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use getOrderById to get the rich CustomerOrderTrackingDTO same as the guest page
        const orderData = await OrderService.getOrderById(orderId);
        setOrder(orderData);

        // Generate QR code if pickup token exists
        if (orderData.pickupToken) {
          await generateQRCode(orderData.pickupToken);
        }

        // Fetch timeline activities
        await fetchTimelineActivities();
      } catch (err: any) {
        console.error("Error fetching order:", err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          setError("unauthorized");
        } else if (err.response?.status === 404) {
          setError("not_found");
        } else {
          setError("Failed to load order details. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchTimelineActivities = async () => {
      setLoadingTimeline(true);
      try {
        const data = await orderActivitiesService.getOrderActivities(orderId);
        setTimelineActivities(data.activities || []);
      } catch (error) {
        console.error("Error fetching timeline:", error);
        // Don't show error toast - timeline is optional
        setTimelineActivities([]);
      } finally {
        setLoadingTimeline(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

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
    if (order?.shippingAddress?.latitude && order?.shippingAddress?.longitude) {
      const url = `https://www.google.com/maps?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`;
      window.open(url, "_blank");
    }
  };

  const getDirections = () => {
    if (order?.shippingAddress?.latitude && order?.shippingAddress?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`;
      window.open(url, "_blank");
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch ((status || "").toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "PROCESSING":
        return "bg-purple-100 text-purple-800";
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "READY_FOR_DELIVERY":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const allItems: OrderItemResponse[] =
    order?.shopOrders?.flatMap((so) => so.items) || [];

  // Return eligibility logic
  const hasEligibleItems =
    allItems.some((item) => item.returnEligible) || false;
  const isDelivered = order?.overallStatus?.toLowerCase() === "delivered";
  const isProcessing = order?.overallStatus?.toLowerCase() === "processing";
  const canRequestReturn = (isDelivered || isProcessing) && hasEligibleItems;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading order details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error === "unauthorized") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-6">
              <X className="h-16 w-16 text-red-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-6">
                  You need to be logged in to view order details.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/account/orders">Back to Orders</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error === "not_found") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-6">
              <X className="h-16 w-16 text-red-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
                <p className="text-muted-foreground mb-6">
                  The order you're looking for doesn't exist or you don't have
                  permission to view it.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/account/orders">Back to Orders</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/account">My Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-6">
              <X className="h-16 w-16 text-red-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Error Loading Order</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
              </div>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" asChild className="mb-4">
            <Link href="/account/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Order #{order.orderCode || order.orderNumber}
              </h1>
              <p className="text-muted-foreground">
                Placed on{" "}
                {order.orderDate
                  ? new Date(order.orderDate).toLocaleDateString()
                  : order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : "N/A"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={getStatusColor(order.overallStatus || order.status)}
              >
                {(order.overallStatus || order.status || "").replace(/_/g, " ")}
              </Badge>
              {(() => {
                const returnRequest = order.shopOrders
                  ?.flatMap((so) => so.returnRequests || [])
                  .find((r) => r);
                if (returnRequest) {
                  return (
                    <Badge
                      variant="outline"
                      className={
                        returnRequest.status === "APPROVED"
                          ? "text-green-600 border-green-300 bg-green-50"
                          : returnRequest.status === "DENIED"
                            ? "text-red-600 border-red-300 bg-red-50"
                            : "text-orange-600 border-orange-300 bg-orange-50"
                      }
                    >
                      Return: {returnRequest.status}
                    </Badge>
                  );
                }
                return null;
              })()}
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
            {order.pickupToken && qrCodeDataUrl && (
              <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-xl overflow-hidden mb-6">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="p-8 space-y-4 flex-1">
                      <div className="bg-white/20 w-fit p-1.5 rounded-lg backdrop-blur-sm">
                        <QrCode className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">
                          Ready for Pickup?
                        </h2>
                        <p className="text-blue-100 mt-1 font-medium italic">
                          Present this QR code to the delivery agent to verify
                          your shipment.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                          <code className="font-mono text-lg font-black tracking-widest">
                            {order.pickupToken}
                          </code>
                        </div>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="rounded-full h-10 w-10 shadow-lg hover:scale-110 transition-transform"
                          onClick={() =>
                            downloadQRCode(
                              qrCodeDataUrl,
                              `pickup-token-${order.orderCode}.png`,
                            )
                          }
                        >
                          <Download className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-white p-6 md:p-8 flex items-center justify-center">
                      <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-slate-50">
                        <img
                          src={qrCodeDataUrl}
                          alt="Pickup Token QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {order.shopOrders && order.shopOrders.length > 0 ? (
              order.shopOrders.map((shopOrder) => (
                <ShopOrderGroup
                  key={shopOrder.shopOrderId}
                  shopOrder={shopOrder}
                />
              ))
            ) : (
              <Card className="border-dashed border-2 bg-slate-50/50">
                <CardContent className="py-20 text-center text-slate-400">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">
                    No shipment details found.
                  </p>
                  <p className="text-sm">
                    Please check back later as we prepare your items.
                  </p>
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
                  {formatCurrency(order.subtotal || 0)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Total Shipping:</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(
                    order.totalShipping || order.shipping || 0,
                  )}
                </span>
              </div>

              {((order.totalDiscount ?? 0) > 0 ||
                (order.discount ?? 0) > 0) && (
                <div className="flex justify-between text-green-600 italic">
                  <span>Total Discount:</span>
                  <span className="font-medium">
                    -
                    {formatCurrency(
                      order.totalDiscount || order.discount || 0,
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-600">Tax:</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(order.tax || 0)}
                </span>
              </div>

              <Separator className="bg-slate-200" />
              <div className="flex justify-between font-bold text-xl text-slate-900">
                <span>Grand Total:</span>
                <span>
                  {formatCurrency(order.grandTotal || order.total || 0)}
                </span>
              </div>
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
              {order.customerInfo && (
                <>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customerInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customerInfo.email}</span>
                  </div>
                  {order.customerInfo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{order.customerInfo.phone}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>

                {/* Google Maps Integration */}
                {order.shippingAddress.latitude &&
                  order.shippingAddress.longitude && (
                    <div className="space-y-3">
                      <div className="relative w-full h-48 rounded-md overflow-hidden border">
                        <iframe
                          src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}&zoom=18&maptype=satellite`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Coordinates: {order.shippingAddress.latitude},{" "}
                        {order.shippingAddress.longitude}
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
          {(order.paymentInfo || order.paymentMethod) && (
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
                    {order.paymentInfo?.paymentMethod || order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <Badge
                    variant={
                      (order.paymentInfo?.paymentStatus || order.paymentStatus) ===
                        "COMPLETED" ||
                      (order.paymentInfo?.paymentStatus || order.paymentStatus) ===
                        "SUCCESS"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {order.paymentInfo?.paymentStatus || order.paymentStatus}
                  </Badge>
                </div>
                {order.paymentInfo && order.paymentInfo.pointsUsed > 0 && (
                  <div className="flex justify-between text-sm py-1.5 px-2 bg-blue-50/50 rounded-md border border-blue-100/50">
                    <span className="text-blue-600 flex items-center gap-1 italic">
                      <Info className="h-3 w-3" />
                      Points Applied:
                    </span>
                    <span className="font-bold text-blue-700">
                      -{formatCurrency(order.paymentInfo.pointsValue)}
                      <span className="text-[10px] ml-1 opacity-70 italic">
                        ({order.paymentInfo.pointsUsed} pts)
                      </span>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delivery Notes Dialog */}
      {order && (
        <DeliveryNotesDialog
          open={showOrderNotes}
          onOpenChange={setShowOrderNotes}
          orderId={order.orderId}
          title="Order Delivery Notes"
        />
      )}
    </div>
  );
}
