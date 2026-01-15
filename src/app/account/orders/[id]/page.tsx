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
        const orderData = await OrderService.getOrderDetails(orderId);
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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
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
                {(order.overallStatus || order.status).replace(/_/g, " ")}
              </Badge>
              {order.returnRequest && (
                <Badge
                  variant="outline"
                  className={
                    order.returnRequest.status === "APPROVED"
                      ? "text-green-600 border-green-300 bg-green-50"
                      : order.returnRequest.status === "DENIED"
                      ? "text-red-600 border-red-300 bg-red-50"
                      : "text-orange-600 border-orange-300 bg-orange-50"
                  }
                >
                  Return: {order.returnRequest.status}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Shop Grouped Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Pick-up QR Code (Premium feature for logged in users) */}
            {order.pickupToken && qrCodeDataUrl && (
              <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-xl overflow-hidden">
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
                              `pickup-token-${order.orderCode}.png`
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
                  <div className="bg-black/20 px-8 py-3 flex items-center gap-2 group cursor-help transition-colors hover:bg-black/30">
                    <Info className="h-4 w-4 text-blue-200" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100">
                      Security Note: Keep this code private until you meet your
                      deliverer.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800 uppercase tracking-widest text-sm">
              <Package className="h-5 w-5 text-blue-600" />
              Items by Fulfillment Vendor
            </h2>
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

            {/* Customer info and address in two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Recipient
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.customerInfo && (
                    <>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-medium">
                          Name
                        </span>
                        <span className="font-bold text-slate-900">
                          {order.customerInfo.name}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-medium">
                          Email Address
                        </span>
                        <span className="font-bold text-slate-900">
                          {order.customerInfo.email}
                        </span>
                      </div>
                      {order.customerInfo.phone && (
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400 font-medium">
                            Phone Number
                          </span>
                          <span className="font-bold text-slate-900">
                            {order.customerInfo.phone}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Destination
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.shippingAddress && (
                    <div className="text-sm space-y-1">
                      <p className="font-bold text-slate-900 leading-tight">
                        {order.shippingAddress.street}
                      </p>
                      <p className="text-slate-600 font-medium">
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}
                      </p>
                      <p className="text-slate-600 font-medium">
                        {order.shippingAddress.country}
                      </p>
                    </div>
                  )}

                  {order.shippingAddress?.latitude &&
                    order.shippingAddress?.longitude && (
                      <div className="pt-2">
                        <div className="flex gap-2">
                          <Button
                            onClick={openInGoogleMaps}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-[10px] font-bold uppercase tracking-tighter"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Maps
                          </Button>
                          <Button
                            onClick={getDirections}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-[10px] font-bold uppercase tracking-tighter"
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            Directions
                          </Button>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>

            {/* Interactive Map (Premium) */}
            {order.shippingAddress?.latitude &&
              order.shippingAddress?.longitude && (
                <Card className="border-slate-200 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="relative w-full h-[300px] bg-slate-100">
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}&zoom=18&maptype=satellite`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg border border-white/20 shadow-lg">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Navigation className="h-3 w-3 text-blue-500" />
                        Precise Location Pin
                      </p>
                    </div>
                  </div>
                </Card>
              )}
          </div>

          <div className="space-y-6">
            {/* Order Summary Card */}
            <Card className="bg-slate-50 border-slate-200 sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-500" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">
                      Items Subtotal
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(order.subtotal || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">
                      Total Shipping
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(
                        order.totalShipping || order.shipping || 0
                      )}
                    </span>
                  </div>

                  {((order.totalDiscount ?? 0) > 0 ||
                    (order.discount ?? 0) > 0) && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span className="font-medium italic">Total Discount</span>
                      <span className="font-semibold">
                        -
                        {formatCurrency(
                          order.totalDiscount || order.discount || 0
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm border-b border-slate-200 pb-3">
                    <span className="text-slate-500 font-medium">Tax</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(order.tax || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-2">
                    <span className="font-black text-slate-900 uppercase tracking-tight">
                      Grand Total
                    </span>
                    <span className="text-2xl font-black text-blue-600">
                      {formatCurrency(order.grandTotal || order.total || 0)}
                    </span>
                  </div>
                </div>

                {/* Additional Payment/Points Info */}
                {(order.paymentInfo || order.paymentMethod) && (
                  <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                      <span>Payment Details</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-white uppercase"
                      >
                        {order.paymentInfo?.paymentStatus ||
                          order.paymentStatus ||
                          "N/A"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                      <CreditCard className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold flex-1">
                        {order.paymentInfo?.paymentMethod ||
                          order.paymentMethod ||
                          "N/A"}
                      </span>
                    </div>

                    {order.paymentInfo && order.paymentInfo.pointsUsed > 0 && (
                      <div className="bg-blue-600 rounded-xl p-4 text-white shadow-md space-y-1 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                          <CheckCircle className="h-20 w-20" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">
                          Loyalty Points Applied
                        </p>
                        <div className="flex justify-between items-baseline">
                          <span className="text-lg font-black">
                            -{formatCurrency(order.paymentInfo.pointsValue)}
                          </span>
                          <span className="text-xs font-bold bg-blue-500 px-2 py-0.5 rounded-full">
                            {order.paymentInfo.pointsUsed} pts
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
