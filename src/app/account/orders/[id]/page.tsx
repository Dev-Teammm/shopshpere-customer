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
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800">
            <Package className="h-6 w-6 text-blue-600" />
            Consolidated Shipments
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
