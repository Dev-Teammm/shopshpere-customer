"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, XCircle, Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  OrderService,
  OrderDetailsResponse,
  OrderItemResponse,
  SimpleProduct,
} from "@/lib/orderService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import QRCode from "qrcode";
import { format } from "date-fns";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [selectedQRCode, setSelectedQRCode] = useState<{
    url: string;
    shopName: string;
    token: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pointsUsed, setPointsUsed] = useState<number | null>(null);
  const [pointsValue, setPointsValue] = useState<number | null>(null);
  const [isPointsPayment, setIsPointsPayment] = useState(false);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  const downloadQRCode = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateGroupedQRCode = async (
    token: string,
    shopName: string,
    orderDate: string
  ): Promise<string> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Generate the base QR code
    const qrDataUrl = await QRCode.toDataURL(token, {
      width: 400,
      margin: 2,
    });

    return new Promise((resolve) => {
      const qrImg = new Image();
      qrImg.onload = () => {
        // Set canvas size (QR code + header space)
        canvas.width = 450;
        canvas.height = 550;

        // Draw background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Shop Name
        ctx.fillStyle = "#000000";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(shopName, canvas.width / 2, 50);

        // Draw Order Date
        ctx.font = "16px Arial";
        ctx.fillStyle = "#666666";
        const dateStr = new Date(orderDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        ctx.fillText(dateStr, canvas.width / 2, 80);

        // Draw QR Code
        ctx.drawImage(qrImg, 25, 100, 400, 400);

        // Draw Token Text (footer)
        ctx.font = "bold 14px monospace";
        ctx.fillStyle = "#333333";
        ctx.fillText(`TOKEN: ${token}`, canvas.width / 2, 520);

        resolve(canvas.toDataURL("image/png"));
      };
      qrImg.src = qrDataUrl;
    });
  };

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const orderId = searchParams.get("orderId");
    const orderNumber = searchParams.get("orderNumber");

    console.log(
      "Payment success page loaded with session ID:",
      sessionId,
      "orderId:",
      orderId,
      "orderNumber:",
      orderNumber
    );

    if (sessionId) {
      // Handle Stripe payment verification
      verifyPayment(sessionId);
    } else if (orderNumber) {
      // Handle points-based payment - fetch order by orderNumber (preferred)
      fetchOrderDetailsByNumber(orderNumber);
    } else if (orderId) {
      // Fallback: Handle points-based payment - fetch order by orderId
      fetchOrderDetails(orderId);
    } else {
      setError("No session ID, order ID, or order number found");
      setVerifying(false);
      return;
    }
  }, [searchParams]);

  const fetchOrderDetailsByNumber = async (orderNumber: string) => {
    try {
      console.log("Fetching order details for orderNumber:", orderNumber);
      const orderDetails = await OrderService.getOrderDetailsByNumber(
        orderNumber
      );
      console.log("Order details result:", orderDetails);

      if (orderDetails) {
        // Set order details directly
        setOrderDetails(orderDetails);
        setIsPointsPayment(true);

        // Extract points information from URL parameters
        const pointsUsedParam = searchParams.get("pointsUsed");
        const pointsValueParam = searchParams.get("pointsValue");

        if (pointsUsedParam) {
          setPointsUsed(parseInt(pointsUsedParam));
        }
        if (pointsValueParam) {
          setPointsValue(parseFloat(pointsValueParam));
        }

        // Create a mock verification result for points-based payment
        setVerificationResult({
          status: "paid",
          amount: Math.round((orderDetails.total || 0) * 100), // Convert to cents
          currency: "usd",
          customerEmail: orderDetails.customerInfo?.email || "N/A",
          receiptUrl: null,
          paymentIntentId: `points_payment_${orderNumber}`,
          updated: true,
          order: orderDetails,
          paymentMethod: pointsUsedParam
            ? parseFloat(pointsValueParam || "0") >= (orderDetails.total || 0)
              ? "points"
              : "hybrid"
            : "unknown",
        });

        // Clear cart after successful payment
        try {
          localStorage.removeItem("cart");
          localStorage.removeItem("cartItems");
          console.log("Successfully cleared cart from localStorage");
        } catch (error) {
          console.error("Error clearing cart from localStorage:", error);
        }

        // Generate QR codes for each shop order
        if (orderDetails.shopOrders && orderDetails.shopOrders.length > 0) {
          const newQrCodes: Record<string, string> = {};
          for (const shopOrder of orderDetails.shopOrders) {
            if (shopOrder.pickupToken) {
              const qrDataUrl = await generateGroupedQRCode(
                shopOrder.pickupToken,
                shopOrder.shopName,
                orderDetails.createdAt || orderDetails.orderDate
              );
              newQrCodes[shopOrder.id || shopOrder.shopOrderId] = qrDataUrl;
            }
          }
          setQrCodes(newQrCodes);
        } else if (orderDetails.pickupToken) {
          const qrDataUrl = await generateGroupedQRCode(
            orderDetails.pickupToken,
            "Your Shop",
            orderDetails.createdAt || orderDetails.orderDate
          );
          setQrCodes({ main: qrDataUrl });
        }
      } else {
        throw new Error("Order not found");
      }
    } catch (err) {
      console.error("Order fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch order details"
      );
    } finally {
      setVerifying(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      console.log("Fetching order details for orderId:", orderId);
      const orderDetails = await OrderService.getOrderById(orderId);
      console.log("Order details result:", orderDetails);

      if (orderDetails) {
        // Set order details directly
        setOrderDetails(orderDetails);
        setIsPointsPayment(true);

        // Extract points information from URL parameters or transaction data
        const pointsUsedParam = searchParams.get("pointsUsed");
        const pointsValueParam = searchParams.get("pointsValue");

        // Use transaction data if available, otherwise use URL params
        const transactionPointsUsed = orderDetails.transaction?.pointsUsed || 0;
        const transactionPointsValue =
          orderDetails.transaction?.pointsValue || 0;

        setPointsUsed(
          pointsUsedParam ? parseInt(pointsUsedParam) : transactionPointsUsed
        );
        setPointsValue(
          pointsValueParam
            ? parseFloat(pointsValueParam)
            : transactionPointsValue
        );

        // Create a verification result with transaction information
        setVerificationResult({
          status:
            orderDetails.transaction?.status === "COMPLETED"
              ? "paid"
              : "pending",
          amount: orderDetails.transaction?.orderAmount
            ? Math.round(orderDetails.transaction.orderAmount * 100)
            : Math.round((orderDetails.total || 0) * 100),
          currency: "$",
          customerEmail: orderDetails.customerInfo?.email || "N/A",
          receiptUrl: orderDetails.transaction?.receiptUrl || null,
          paymentIntentId:
            orderDetails.transaction?.stripePaymentIntentId ||
            `order_payment_${orderId}`,
          updated: true,
          order: orderDetails,
          paymentMethod:
            orderDetails.transaction?.paymentMethod?.toLowerCase() || "unknown",
        });

        // Clear cart after successful payment
        try {
          localStorage.removeItem("cart");
          localStorage.removeItem("cartItems");
          console.log("Successfully cleared cart from localStorage");
        } catch (error) {
          console.error("Error clearing cart from localStorage:", error);
        }

        // Generate QR codes for each shop order
        if (orderDetails.shopOrders && orderDetails.shopOrders.length > 0) {
          const newQrCodes: Record<string, string> = {};
          for (const shopOrder of orderDetails.shopOrders) {
            if (shopOrder.pickupToken) {
              const qrDataUrl = await generateGroupedQRCode(
                shopOrder.pickupToken,
                shopOrder.shopName,
                orderDetails.createdAt || orderDetails.orderDate
              );
              newQrCodes[shopOrder.id || shopOrder.shopOrderId] = qrDataUrl;
            }
          }
          setQrCodes(newQrCodes);
        } else if (orderDetails.pickupToken) {
          const qrDataUrl = await generateGroupedQRCode(
            orderDetails.pickupToken,
            "Your Shop",
            orderDetails.createdAt || orderDetails.orderDate
          );
          setQrCodes({ main: qrDataUrl });
        }
      } else {
        throw new Error("Order not found");
      }
    } catch (err) {
      console.error("Order fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch order details"
      );
    } finally {
      setVerifying(false);
    }
  };

  const verifyPayment = async (sessionId: string) => {
    try {
      console.log("Starting payment verification for session:", sessionId);
      const result = await OrderService.verifyCheckoutSession(sessionId);
      console.log("Verification result:", result);

      if (result && result.status) {
        setVerificationResult(result);

        // Clear cart after successful payment
        try {
          // Clear localStorage cart for guest users
          localStorage.removeItem("cart");
          localStorage.removeItem("cartItems");
          console.log("Successfully cleared guest cart from localStorage");
        } catch (error) {
          console.error("Error clearing cart from localStorage:", error);
        }

        // Use order details directly from verification result
        if (result.order) {
          setOrderDetails(result.order);

          // Generate QR codes for each shop order
          if (result.order.shopOrders && result.order.shopOrders.length > 0) {
            const newQrCodes: Record<string, string> = {};
            for (const shopOrder of result.order.shopOrders) {
              if (shopOrder.pickupToken) {
                const qrDataUrl = await generateGroupedQRCode(
                  shopOrder.pickupToken,
                  shopOrder.shopName,
                  result.order.createdAt
                );
                newQrCodes[shopOrder.id || shopOrder.shopOrderId] = qrDataUrl;
              }
            }
            setQrCodes(newQrCodes);
          } else if (result.order.pickupToken) {
            const qrDataUrl = await generateGroupedQRCode(
              result.order.pickupToken,
              "Your Shop",
              result.order.createdAt
            );
            setQrCodes({ main: qrDataUrl });
          }
        }
      } else {
        throw new Error("Invalid verification result");
      }
    } catch (err) {
      console.error("Payment verification error:", err);
      setError(err instanceof Error ? err.message : "Failed to verify payment");
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Verifying Payment...</h1>
        <p className="text-muted-foreground">
          Please wait while we confirm your payment.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-red-600">
          Payment Verification Failed
        </h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4 text-green-600">
            {isPointsPayment
              ? "Order Placed Successfully!"
              : "Payment Successful!"}
          </h1>
          <p className="text-xl text-muted-foreground">
            {isPointsPayment
              ? `Thank you for your order! ${
                  pointsUsed
                    ? `You used ${pointsUsed.toLocaleString()} points`
                    : "Payment processed"
                } and we will process your order shortly.`
              : "Thank you for your order. We've received your payment and will process your order shortly."}
          </p>

          {/* Email notification message */}
          {orderDetails?.customerInfo?.email && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 text-blue-800">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="font-medium">Order confirmation sent!</span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                A detailed order confirmation and receipt have been sent to{" "}
                <strong>{orderDetails.customerInfo.email}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Professional Invoice Layout */}
        {orderDetails && (
          <div className="bg-white border-2 border-gray-200 rounded-md shadow-lg mb-8 print:shadow-none print:border-gray-400">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">INVOICE</h2>
                  <p className="text-blue-100">ShopSphere E-Commerce</p>
                  <p className="text-blue-100 text-sm">
                    Order Confirmation & Receipt
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-md p-3">
                      <p className="text-sm text-blue-100">Invoice #</p>
                      <p className="font-mono font-bold text-lg">
                        {orderDetails.orderNumber}
                      </p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors print:hidden"
                    >
                      Print Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Invoice Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                    Bill To
                  </h3>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {orderDetails.customerInfo?.firstName}{" "}
                      {orderDetails.customerInfo?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {orderDetails.customerInfo?.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      {orderDetails.customerInfo?.phoneNumber}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                    Ship To
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>{orderDetails.shippingAddress?.street}</p>
                    {orderDetails.shippingAddress?.roadName && (
                      <p>{orderDetails.shippingAddress.roadName}</p>
                    )}
                    <p>
                      {orderDetails.shippingAddress?.city},{" "}
                      {orderDetails.shippingAddress?.state}
                    </p>
                    <p>{orderDetails.shippingAddress?.country}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                    Order Details
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span>
                        {new Date(orderDetails.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="capitalize font-medium text-green-600">
                        {orderDetails.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment:</span>
                      <span className="capitalize">
                        {verificationResult?.paymentMethod || "Card"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shop-based Item Grouping */}
              <div className="space-y-12 mb-8">
                {orderDetails.shopOrders &&
                orderDetails.shopOrders.length > 0 ? (
                  orderDetails.shopOrders.map(
                    (shopOrder: any, shopIndex: number) => (
                      <div
                        key={shopOrder.id || shopIndex}
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                        style={{ animationDelay: `${shopIndex * 100}ms` }}
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-2 border-b-2 border-gray-100">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                              <span className="bg-primary/10 text-primary p-1.5 rounded-md">
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                  />
                                </svg>
                              </span>
                              {shopOrder.shopName}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Shop Order:{" "}
                              <span className="font-mono text-xs">
                                {shopOrder.shopOrderCode}
                              </span>
                            </p>
                          </div>
                          <div className="mt-2 md:mt-0 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wider border border-green-100">
                            {shopOrder.status}
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50/50">
                                <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">
                                  Product Details
                                </th>
                                <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm w-24">
                                  Qty
                                </th>
                                <th className="text-right py-4 px-4 font-semibold text-gray-700 text-sm w-32">
                                  Price
                                </th>
                                <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm w-48">
                                  Pickup QR Code
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {shopOrder.items?.map(
                                (item: any, itemIndex: number) => {
                                  const isVariant =
                                    item.variant && item.variant.name;
                                  const displayName = isVariant
                                    ? item.variant?.name
                                    : item.product?.name;
                                  const displayImage = isVariant
                                    ? item.variant?.images?.[0]
                                    : item.product?.images?.[0];
                                  const qrUrl =
                                    qrCodes[
                                      shopOrder.id || shopOrder.shopOrderId
                                    ];

                                  return (
                                    <tr
                                      key={itemIndex}
                                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors"
                                    >
                                      <td className="py-5 px-4">
                                        <div className="flex items-center space-x-4">
                                          <div className="relative h-14 w-14 flex-shrink-0 group">
                                            {displayImage ? (
                                              <img
                                                src={displayImage}
                                                alt={displayName || "Product"}
                                                className="h-full w-full object-cover rounded-lg border border-gray-200 shadow-sm transition-transform group-hover:scale-105"
                                              />
                                            ) : (
                                              <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Loader2 className="h-4 w-4 text-gray-300" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 leading-tight">
                                              {displayName || "Unnamed Product"}
                                            </p>
                                            {isVariant &&
                                              item.product?.name && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                  Base: {item.product.name}
                                                </p>
                                              )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-5 px-4 text-center">
                                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-700 text-sm font-bold">
                                          {item.quantity}
                                        </span>
                                      </td>
                                      <td className="py-5 px-4 text-right">
                                        <div className="text-sm font-medium text-gray-900">
                                          $ {item.price?.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500 font-bold mt-1">
                                          Total: ${" "}
                                          {item.totalPrice?.toLocaleString()}
                                        </div>
                                      </td>
                                      {itemIndex === 0 && (
                                        <td
                                          rowSpan={shopOrder.items.length}
                                          className="py-5 px-4 text-center border-l bg-gray-50/20 align-middle"
                                        >
                                          {qrUrl ? (
                                            <div className="flex flex-col items-center gap-3">
                                              <div
                                                className="relative cursor-pointer group"
                                                onClick={() =>
                                                  setSelectedQRCode({
                                                    url: qrUrl,
                                                    shopName:
                                                      shopOrder.shopName,
                                                    token:
                                                      shopOrder.pickupToken,
                                                  })
                                                }
                                              >
                                                <img
                                                  src={qrUrl}
                                                  alt="Pickup QR"
                                                  className="w-24 h-24 border-2 border-white shadow-md rounded-lg transition-all group-hover:scale-110 group-hover:shadow-xl"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                                                  <QrCode className="text-white h-8 w-8" />
                                                </div>
                                              </div>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-[10px] font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all shadow-sm"
                                                onClick={() =>
                                                  downloadQRCode(
                                                    qrUrl,
                                                    `pickup-${shopOrder.shopName}-${shopOrder.shopOrderCode}.png`
                                                  )
                                                }
                                              >
                                                <Download className="h-3 w-3 mr-1.5" />
                                                Download
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="text-xs text-muted-foreground flex items-center justify-center gap-2 italic">
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                              Generating...
                                            </div>
                                          )}
                                        </td>
                                      )}
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  /* Fallback to legacy single list if shopOrders is missing */
                  <div className="bg-white border rounded-xl overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">
                        Purchased Items
                      </h3>
                      <div className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium border border-blue-100">
                        Order # {orderDetails.orderNumber}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-50/30">
                          <tr className="border-b">
                            <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">
                              Product
                            </th>
                            <th className="text-center py-4 px-6 font-semibold text-gray-600 text-sm w-24">
                              Qty
                            </th>
                            <th className="text-right py-4 px-6 font-semibold text-gray-600 text-sm w-32">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetails.items?.map(
                            (item: any, index: number) => (
                              <tr
                                key={index}
                                className="border-b last:border-0 hover:bg-gray-50/50"
                              >
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-4">
                                    <img
                                      src={
                                        item.variant?.images?.[0] ||
                                        item.product?.images?.[0]
                                      }
                                      alt="Product"
                                      className="h-12 w-12 object-cover rounded shadow-sm border"
                                    />
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {item.variant?.name ||
                                          item.product?.name}
                                      </p>
                                      <p className="text-xs text-gray-500 italic mt-0.5">
                                        $ {item.price?.toLocaleString()} each
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-center font-bold text-gray-700">
                                  {item.quantity}
                                </td>
                                <td className="py-4 px-6 text-right font-bold text-primary">
                                  $ {item.totalPrice?.toLocaleString()}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="mt-12 bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="w-full md:w-1/2">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Payment & Success Tips
                    </h4>
                    <div className="space-y-4 text-sm text-gray-600">
                      <div className="flex gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                        <div className="shrink-0 h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                          1
                        </div>
                        <p>
                          Present the <strong>specific QR code</strong> for each
                          shop when picking up your items.
                        </p>
                      </div>
                      <div className="flex gap-3 bg-green-50/50 p-3 rounded-lg border border-green-100">
                        <div className="shrink-0 h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">
                          2
                        </div>
                        <p>
                          You can download the QR codes as images for easy
                          offline access during pickup.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-1/3 space-y-3 bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Subtotal:</span>
                      <span className="font-semibold">
                        $ {orderDetails.subtotal?.toLocaleString()}
                      </span>
                    </div>
                    {orderDetails.shipping > 0 && (
                      <div className="flex justify-between text-gray-600 text-sm">
                        <span>Shipping:</span>
                        <span className="font-semibold">
                          $ {orderDetails.shipping?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {orderDetails.tax > 0 && (
                      <div className="flex justify-between text-gray-600 text-sm">
                        <span>Tax:</span>
                        <span className="font-semibold">
                          $ {orderDetails.tax?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {orderDetails.discount > 0 && (
                      <div className="flex justify-between text-green-600 text-sm">
                        <span>Discount:</span>
                        <span className="font-semibold">
                          -$ {orderDetails.discount?.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Points Info */}
                    {((pointsUsed && pointsUsed > 0) ||
                      (orderDetails?.transaction?.pointsUsed &&
                        orderDetails.transaction.pointsUsed > 0)) && (
                      <div className="pt-2 border-t border-gray-200 mt-2 space-y-2">
                        <div className="flex justify-between text-blue-700 text-sm font-medium">
                          <span>Points Applied:</span>
                          <span>
                            {(
                              pointsUsed ||
                              orderDetails?.transaction?.pointsUsed ||
                              0
                            ).toLocaleString()}{" "}
                            pts
                          </span>
                        </div>
                        <div className="flex justify-between text-blue-700 text-xs italic">
                          <span>Value Saved:</span>
                          <span>
                            -$
                            {(
                              pointsValue ||
                              orderDetails?.transaction?.pointsValue ||
                              0
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t-2 border-gray-200 mt-3 flex justify-between items-center text-xl font-black text-gray-900">
                      <span>TOTAL</span>
                      <span className="text-primary">
                        $ {orderDetails.total?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info Card */}
              {verificationResult && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      Payment Transaction
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Method:</span>
                        <span className="font-medium capitalize">
                          {verificationResult.paymentMethod}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className="text-green-600 font-bold uppercase tracking-tight">
                          {verificationResult.status}
                        </span>
                      </div>
                      {orderDetails?.transaction?.transactionRef && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Ref ID:</span>
                          <span className="font-mono text-[10px]">
                            {orderDetails.transaction.transactionRef}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Help & Support
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Need assistance or have concerns?</p>
                      <p className="font-semibold text-primary mt-2 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        support@shopsphere.io
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Remaining info sections (Map, etc.) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Map section remains same but with nicer container */}
          {orderDetails?.shippingAddress?.latitude &&
            orderDetails?.shippingAddress?.longitude && (
              <Card className="overflow-hidden border-2 border-gray-100 shadow-md transform-gpu hover:shadow-xl transition-all">
                {/* ... existing map code with better styling ... */}
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-gray-800 flex items-center gap-2">
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Delivery Destination
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 relative">
                  <div className="h-96 w-full">
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${orderDetails.shippingAddress.latitude},${orderDetails.shippingAddress.longitude}&zoom=17&maptype=satellite&center=${orderDetails.shippingAddress.latitude},${orderDetails.shippingAddress.longitude}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Delivery Location Map"
                    />
                    <div className="absolute top-4 left-4 right-4 md:right-auto bg-white/95 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-2xl animate-in zoom-in-95 duration-700">
                      <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">
                        Shipping Precise At
                      </p>
                      <p className="text-sm font-bold text-gray-800">
                        {orderDetails.shippingAddress.street}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Secure Location Locked
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-white space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-black uppercase text-gray-400">
                          City
                        </p>
                        <p className="text-sm font-bold">
                          {orderDetails.shippingAddress.city}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-black uppercase text-gray-400">
                          Country
                        </p>
                        <p className="text-sm font-bold">
                          {orderDetails.shippingAddress.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <a
                        href={`https://www.google.com/maps?q=${orderDetails.shippingAddress.latitude},${orderDetails.shippingAddress.longitude}`}
                        target="_blank"
                        className="flex-1 bg-primary text-white text-center py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                      >
                        Open Direct in Maps
                      </a>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `${orderDetails.shippingAddress.latitude}, ${orderDetails.shippingAddress.longitude}`
                          )
                        }
                        className="px-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        <div className="mt-16 text-center space-y-8 animate-in fade-in zoom-in duration-1000">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl text-white shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">You're all set!</h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8">
              A detailed order confirmation and receipt have been sent to your
              email. You can track your order status in real-time.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="px-10 rounded-xl bg-primary hover:bg-white hover:text-black transition-all"
              >
                <Link href="/shop" className="flex items-center gap-2">
                  Shop More
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="px-10 rounded-xl border-white/20 hover:bg-white/10 text-white transition-all"
              >
                <Link href="/track-order">Track My Order</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Lightbox Dialog */}
      <Dialog
        open={!!selectedQRCode}
        onOpenChange={() => setSelectedQRCode(null)}
      >
        <DialogContent className="max-w-md bg-white border-2 border-primary/20 rounded-3xl overflow-hidden p-0 gap-0">
          {selectedQRCode && (
            <div className="flex flex-col items-center">
              <div className="w-full bg-primary/5 p-6 border-b text-center">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                  {selectedQRCode.shopName}
                </h2>
                <p className="text-xs text-muted-foreground mt-1 font-bold">
                  PICKUP TOKEN VERIFICATION
                </p>
              </div>

              <div className="p-10 flex flex-col items-center gap-8">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-primary/5 rounded-[40px] blur-xl group-hover:bg-primary/10 transition-all duration-700" />
                  <img
                    src={selectedQRCode.url}
                    alt="Enlarged QR"
                    className="relative w-72 h-72 border-8 border-white shadow-2xl rounded-[32px]"
                  />
                </div>

                <div className="w-full space-y-6 text-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                      Secret Token
                    </p>
                    <p className="text-xl font-mono font-black text-primary bg-primary/5 py-2 px-4 rounded-xl border border-primary/10 inline-block">
                      {selectedQRCode.token}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() =>
                        downloadQRCode(
                          selectedQRCode.url,
                          `pickup-token-${selectedQRCode.shopName}.png`
                        )
                      }
                      className="w-full py-7 text-lg font-black rounded-2xl shadow-xl shadow-primary/30"
                    >
                      <Download className="mr-3 h-6 w-6" />
                      DOWNLOAD PASS
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedQRCode(null)}
                      className="text-gray-400 hover:text-red-500 font-bold"
                    >
                      CLOSE VIEW
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
          <p className="text-muted-foreground">
            Please wait while we load your payment information.
          </p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
