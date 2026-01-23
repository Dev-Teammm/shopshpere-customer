"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Package,
  Calendar,
  Clock,
  Upload,
  X,
  Play,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { OrderDetails, OrderItem, ReturnItem } from "@/types/return";
import { ReturnService } from "@/services/returnService";

interface SelectedItem {
  orderItemId: string;
  returnQuantity: number;
  itemReason: string;
}

export default function ReturnRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL parameters
  const orderNumber = searchParams.get("orderNumber");
  const orderId = searchParams.get("orderId");
  const shopOrderId = searchParams.get("shopOrderId");
  const pickupToken = searchParams.get("pickupToken");
  const trackingToken = searchParams.get("token");

  // Fix hydration mismatch by using state for authentication check
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication status on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      setIsAuthenticated(!!token);
      setIsGuest(!token);
      setAuthChecked(true);
    }
  }, []);

  // State
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    Record<string, SelectedItem>
  >({});
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<Record<string, string>>(
    {}
  );
  const [generalReason, setGeneralReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load order details on component mount
  useEffect(() => {
    // Only load order details after authentication state is determined
    if (authChecked) {
      loadOrderDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    orderNumber,
    orderId,
    shopOrderId,
    pickupToken,
    trackingToken,
    authChecked,
    isAuthenticated,
  ]);

  const loadOrderDetails = async () => {
    if (
      !orderNumber &&
      !orderId &&
      !shopOrderId &&
      !pickupToken &&
      !trackingToken
    ) {
      setError("Order information is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let order: OrderDetails;

      if (isAuthenticated && (shopOrderId || orderId)) {
        // Preference: shopOrderId (shop-scoped)
        if (shopOrderId) {
          order = await ReturnService.initShopOrderReturn(shopOrderId);
        } else {
          // Fallback: orderId (legacy/global)
          order = await ReturnService.getOrderByIdForAuthenticated(orderId!);
        }
      } else if (orderNumber && (trackingToken || pickupToken)) {
        // Preference: orderNumber + token (shop-scoped)
        const token = trackingToken || pickupToken;
        order = await ReturnService.initGuestShopOrderReturn(
          orderNumber,
          token!
        );
      } else if (trackingToken && orderNumber) {
        // Use tokenized order lookup for secure access
        order = await ReturnService.getOrderByTrackingToken(
          trackingToken,
          orderNumber
        );
      } else if (pickupToken) {
        order = await ReturnService.getOrderByPickupToken(pickupToken);
      } else if (orderNumber) {
        order = await ReturnService.getOrderByOrderNumber(orderNumber);
      } else {
        throw new Error("Order information is required");
      }

      // Normalize the order data to ensure consistent structure
      const normalizedOrder = {
        ...order,
        id: order.id?.toString() || "",
        items:
          order.items?.map((item) => ({
            ...item,
            id: item.id?.toString() || "",
            product: {
              ...item.product,
              id: item.product?.id || item.product?.productId || "",
              productId: item.product?.productId || item.product?.id || "",
              price: item.product?.price || item.price || 0,
            },
            variant: item.variant
              ? {
                  ...item.variant,
                  id: item.variant.id?.toString() || "",
                  productId: item.variant?.productId || item.product?.id || "",
                  price: item.variant?.price || item.price || 0,
                }
              : undefined,
          })) || [],
        customerInfo: order.customerInfo
          ? {
              firstName:
                order.customerInfo.name?.split(" ")[0] ||
                order.customerInfo.firstName ||
                "",
              lastName:
                order.customerInfo.name?.split(" ").slice(1).join(" ") ||
                order.customerInfo.lastName ||
                "",
              email: order.customerInfo.email || "",
              phoneNumber:
                order.customerInfo.phone ||
                order.customerInfo.phoneNumber ||
                "",
            }
          : undefined,
      };

      setOrderDetails(normalizedOrder);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load order details");
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (item: OrderItem, checked: boolean) => {
    const itemId = item.id.toString();
    if (checked) {
      setSelectedItems((prev) => ({
        ...prev,
        [itemId]: {
          orderItemId: itemId,
          returnQuantity: 1,
          itemReason: "",
        },
      }));
    } else {
      setSelectedItems((prev) => {
        const newSelected = { ...prev };
        delete newSelected[itemId];
        return newSelected;
      });
    }
  };

  const handleQuantityChange = (itemId: string, returnQuantity: number) => {
    if (returnQuantity < 1) return;

    const item = orderDetails?.items.find((i) => i.id.toString() === itemId);
    if (!item || returnQuantity > item.quantity) return;

    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        returnQuantity,
      },
    }));
  };

  const handleReasonChange = (itemId: string, itemReason: string) => {
    if (itemReason.length > 500) return;

    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        itemReason,
      },
    }));
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validation = ReturnService.validateMediaFiles([
      ...mediaFiles,
      ...files,
    ]);
    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    // Add files and create previews
    const newFiles = [...mediaFiles, ...files];
    setMediaFiles(newFiles);

    // Create previews for new files
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setMediaPreviews((prev) => ({
        ...prev,
        [file.name]: url,
      }));
    });

    toast.success(`${files.length} file(s) added`);
  };

  const removeMediaFile = (fileName: string) => {
    setMediaFiles((prev) => prev.filter((file) => file.name !== fileName));
    setMediaPreviews((prev) => {
      const newPreviews = { ...prev };
      if (newPreviews[fileName]) {
        URL.revokeObjectURL(newPreviews[fileName]);
        delete newPreviews[fileName];
      }
      return newPreviews;
    });
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedItems).length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    // Validate that all selected items have reasons
    const itemsWithoutReason = Object.values(selectedItems).filter(
      (item) => !item.itemReason.trim()
    );
    if (itemsWithoutReason.length > 0) {
      toast.error("Please provide a reason for each selected item");
      return;
    }

    if (!generalReason.trim()) {
      toast.error("Please provide an overall reason for the return request");
      return;
    }

    try {
      setSubmitting(true);

      const returnItems: ReturnItem[] = Object.values(selectedItems).map(
        (item) => ({
          orderItemId: item.orderItemId.toString(),
          returnQuantity: item.returnQuantity,
          itemReason: item.itemReason,
        })
      );

      let response;
      if (isAuthenticated && orderDetails?.id) {
        // Authenticated user return request (shopOrderId)
        response = await ReturnService.submitReturnRequest(
          {
            orderId: shopOrderId ? parseInt(shopOrderId) : orderDetails.id,
            reason: generalReason,
            returnItems,
            trackingToken: trackingToken || pickupToken || undefined,
          },
          mediaFiles
        );
      } else if (trackingToken && orderNumber) {
        // Tokenized return request (Guest/Secure access)
        response = await ReturnService.submitTokenizedReturnRequest(
          {
            orderNumber,
            trackingToken,
            reason: generalReason,
            returnItems,
          },
          mediaFiles
        );
      } else if (isGuest && pickupToken && orderNumber) {
        // Guest return with pickupToken: treat as tokenized
        response = await ReturnService.submitTokenizedReturnRequest(
          {
            orderNumber,
            trackingToken: pickupToken,
            reason: generalReason,
            returnItems,
          },
          mediaFiles
        );
      } else {
        throw new Error(
          "Missing required information for return request. Please try refreshing the page."
        );
      }

      toast.success("Return request submitted successfully!");
      const tokenParam = trackingToken ? `&token=${trackingToken}` : "";
      router.push(`/returns/success?requestId=${response.id}${tokenParam}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit return request");
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysRemainingBadge = (item: OrderItem) => {
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

  if (!authChecked || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {!authChecked ? "Initializing..." : "Loading order details..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Order not found"}</AlertDescription>
        </Alert>
        <div className="text-center mt-4">
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const eligibleItems =
    orderDetails?.items?.filter((item) => item.returnEligible) || [];
  const ineligibleItems =
    orderDetails?.items?.filter((item) => !item.returnEligible) || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Return Request</h1>
        <p className="text-gray-600">
          Select the items you'd like to return from order #
          {orderDetails.orderNumber}
        </p>
        {isAuthenticated && (
          <div className="mt-2">
            <Badge
              variant="outline"
              className="text-green-600 border-green-300"
            >
              Authenticated User
            </Badge>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-gray-500">Order Number</Label>
              <p className="font-semibold">{orderDetails.orderNumber}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Shop</Label>
              <p className="font-semibold">{orderDetails.shopName || "-"}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Status</Label>
              <p className="font-semibold">{orderDetails.status}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Order Date</Label>
              <p className="font-semibold">
                {new Date(orderDetails.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Access Type</Label>
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-300"
                  >
                    Authenticated
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-blue-600 border-blue-300"
                  >
                    Guest Access
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eligible Items */}
      {eligibleItems.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Items Eligible for Return ({eligibleItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {eligibleItems.map((item) => {
              const itemId = item.id.toString();
              const isSelected = selectedItems[itemId];
              const displayProduct = item.variant || item.product;

              return (
                <div key={item.id} className="border rounded-md p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={!!isSelected}
                      onCheckedChange={(checked) =>
                        handleItemSelection(item, checked as boolean)
                      }
                      className="mt-1"
                    />

                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                      {displayProduct.images &&
                      displayProduct.images.length > 0 ? (
                        <img
                          src={displayProduct.images[0]}
                          alt={displayProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {displayProduct.name}
                          </h3>
                          {item.variant && (
                            <p className="text-sm text-gray-600">
                              Variant: {item.variant.name}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            Quantity ordered: {item.quantity} • Price: ${" "}
                            {item.price.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Return window: {item.maxReturnDays} days
                            </span>
                            {getDaysRemainingBadge(item)}
                          </div>
                        </div>
                      </div>

                      {/* Return Quantity and Reason (shown when selected) */}
                      {isSelected && (
                        <div className="mt-4 space-y-3 bg-gray-50 p-3 rounded-md">
                          <div>
                            <Label
                              htmlFor={`quantity-${itemId}`}
                              className="text-sm font-medium"
                            >
                              Quantity to Return
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(
                                    itemId,
                                    isSelected.returnQuantity - 1
                                  )
                                }
                                disabled={isSelected.returnQuantity <= 1}
                              >
                                -
                              </Button>
                              <Input
                                id={`quantity-${itemId}`}
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={isSelected.returnQuantity}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    itemId,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-20 text-center"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(
                                    itemId,
                                    isSelected.returnQuantity + 1
                                  )
                                }
                                disabled={
                                  isSelected.returnQuantity >= item.quantity
                                }
                              >
                                +
                              </Button>
                              <span className="text-sm text-gray-600">
                                of {item.quantity} available
                              </span>
                            </div>
                          </div>

                          <div>
                            <Label
                              htmlFor={`reason-${itemId}`}
                              className="text-sm font-medium"
                            >
                              Reason for Return *
                            </Label>
                            <Textarea
                              id={`reason-${itemId}`}
                              placeholder="Please explain why you want to return this item..."
                              value={isSelected.itemReason}
                              onChange={(e) =>
                                handleReasonChange(itemId, e.target.value)
                              }
                              maxLength={500}
                              className="mt-1"
                              rows={3}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {isSelected.itemReason.length}/500 characters
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Ineligible Items */}
      {ineligibleItems.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Items Not Eligible for Return ({ineligibleItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ineligibleItems.map((item) => {
              const displayProduct = item.variant || item.product;

              return (
                <div key={item.id} className="border rounded-md p-4 opacity-60">
                  <div className="flex items-start gap-4">
                    <Checkbox disabled className="mt-1" />

                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                      {displayProduct.images &&
                      displayProduct.images.length > 0 ? (
                        <img
                          src={displayProduct.images[0]}
                          alt={displayProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold">{displayProduct.name}</h3>
                      {item.variant && (
                        <p className="text-sm text-gray-600">
                          Variant: {item.variant.name}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} • Price: ${" "}
                        {item.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-red-400" />
                        <span className="text-sm text-red-600">
                          Return period expired ({item.maxReturnDays} days)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Media Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Attach Photos/Videos (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="media-upload" className="text-sm text-gray-600">
                Upload images or videos to support your return request (Max: 5
                images, 1 video)
              </Label>
              <Input
                id="media-upload"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="mt-2"
              />
            </div>

            {/* Media Previews */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mediaFiles.map((file) => (
                  <div key={file.name} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                      {file.type.startsWith("image/") ? (
                        <img
                          src={mediaPreviews[file.name]}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Play className="h-8 w-8 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMediaFile(file.name)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* General Reason */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="general-reason">General Reason *</Label>
            <Textarea
              id="general-reason"
              placeholder="Any additional information about your return request..."
              value={generalReason}
              onChange={(e) => setGeneralReason(e.target.value)}
              maxLength={1000}
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {generalReason.length}/1000 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(selectedItems).length === 0}
          className="min-w-[120px]"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            "Submit Return Request"
          )}
        </Button>
      </div>
    </div>
  );
}
