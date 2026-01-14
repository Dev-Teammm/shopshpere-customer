"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Coins, CreditCard, Loader2, X, Check, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatPrice } from "@/lib/utils/priceFormatter";
import { toast } from "sonner";
import {
  pointsPaymentService,
  PointsPaymentRequest,
  PointsEligibilityResponse,
  PointsEligibilityRequest,
  ShopPointsEligibility,
} from "@/lib/services/points-payment-service";

interface PointsPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (
    orderId: number,
    orderNumber?: string,
    pointsUsed?: number,
    pointsValue?: number
  ) => void;
  onHybridPayment: (stripeSessionId: string, orderId: number) => void;
  paymentRequest: PointsPaymentRequest;
}

interface SelectedShopPoints {
  shopId: string;
  shopName: string;
  pointsToUse: number;
  pointsValue: number;
  orderAmount: number;
}

export function PointsPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  onHybridPayment,
  paymentRequest,
}: PointsPaymentModalProps) {
  const [eligibility, setEligibility] =
    useState<PointsEligibilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedShops, setSelectedShops] = useState<Set<string>>(new Set());

  const loadEligibility = async () => {
    if (!isOpen || eligibility) return;

    setLoading(true);
    try {
      const request: PointsEligibilityRequest = {
        userId: paymentRequest.userId,
        items: paymentRequest.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        shippingAddress: paymentRequest.shippingAddress,
      };

      const data = await pointsPaymentService.checkPointsEligibility(request);
      setEligibility(data);

      // Auto-select shops that have points available
      const autoSelected = new Set<string>();
      data.shopEligibilities.forEach((shop) => {
        if (shop.canPayWithPoints && shop.currentPointsBalance > 0) {
          autoSelected.add(shop.shopId);
        }
      });
      setSelectedShops(autoSelected);
    } catch (error: any) {
      console.error("Error loading points eligibility:", error);
      toast.error("Failed to load points information");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals based on selected shops
  const calculations = useMemo(() => {
    if (!eligibility) {
      return {
        totalOrderAmount: 0,
        totalPointsValue: 0,
        totalPointsUsed: 0,
        remainingToPay: 0,
        isFullPointsPayment: false,
        selectedShopDetails: [] as SelectedShopPoints[],
      };
    }

    let totalOrderAmount = 0;
    let totalPointsValue = 0;
    let totalPointsUsed = 0;
    const selectedShopDetails: SelectedShopPoints[] = [];

    eligibility.shopEligibilities.forEach((shop) => {
      totalOrderAmount += shop.totalAmount;

      if (selectedShops.has(shop.shopId) && shop.canPayWithPoints) {
        // Use up to the order amount for this shop
        const usableValue = Math.min(shop.currentPointsValue, shop.totalAmount);
        const pointsToUse = Math.ceil(
          usableValue / (shop.currentPointsValue / shop.currentPointsBalance)
        );

        totalPointsValue += usableValue;
        totalPointsUsed += pointsToUse;

        selectedShopDetails.push({
          shopId: shop.shopId,
          shopName: shop.shopName,
          pointsToUse: pointsToUse,
          pointsValue: usableValue,
          orderAmount: shop.totalAmount,
        });
      }
    });

    const remainingToPay = Math.max(0, totalOrderAmount - totalPointsValue);
    const isFullPointsPayment = remainingToPay <= 0.01; // Small tolerance for rounding

    return {
      totalOrderAmount,
      totalPointsValue,
      totalPointsUsed,
      remainingToPay,
      isFullPointsPayment,
      selectedShopDetails,
    };
  }, [eligibility, selectedShops]);

  const toggleShopSelection = (shopId: string) => {
    setSelectedShops((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(shopId)) {
        newSet.delete(shopId);
      } else {
        newSet.add(shopId);
      }
      return newSet;
    });
  };

  const handleSubmitPayment = async () => {
    if (calculations.selectedShopDetails.length === 0) {
      toast.error("Please select at least one shop to use points from");
      return;
    }

    setProcessing(true);
    try {
      // Build the enhanced request with selected shops
      const enhancedRequest = {
        ...paymentRequest,
        selectedShopsForPoints: calculations.selectedShopDetails.map((s) => ({
          shopId: s.shopId,
          pointsToUse: s.pointsToUse,
        })),
        useAllAvailablePoints: true,
      };

      const result = await pointsPaymentService.processPointsPayment(
        enhancedRequest as any
      );

      if (result.success) {
        if (result.hybridPayment && result.stripeSessionId) {
          // Hybrid payment - redirect to Stripe
          toast.info("Redirecting to complete remaining payment...");
          onHybridPayment(result.stripeSessionId, result.orderId!);
        } else {
          // Full points payment completed
          toast.success("Payment completed successfully with points!");
          onSuccess(
            result.orderId!,
            result.orderNumber,
            result.pointsUsed,
            result.pointsValue
          );
        }
        onClose();
      } else {
        toast.error(result.message || "Payment failed");
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.message || "Failed to process payment");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEligibility();
    } else {
      setEligibility(null);
      setSelectedShops(new Set());
    }
  }, [isOpen]);

  const hasEligibleShops = eligibility?.shopEligibilities.some(
    (s) => s.canPayWithPoints
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-600" />
            Pay with Points
          </DialogTitle>
          <DialogDescription>
            Select which shops to use your points from
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Checking points eligibility...</span>
          </div>
        ) : eligibility ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable shop list */}
            <ScrollArea className="flex-1 pr-4 max-h-[300px]">
              <div className="space-y-3">
                {eligibility.shopEligibilities.map((shop) => (
                  <div
                    key={shop.shopId}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedShops.has(shop.shopId) && shop.canPayWithPoints
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-gray-200 bg-gray-50"
                    } ${
                      shop.canPayWithPoints
                        ? "hover:border-yellow-400 cursor-pointer"
                        : "opacity-60"
                    }`}
                    onClick={() =>
                      shop.canPayWithPoints && toggleShopSelection(shop.shopId)
                    }
                  >
                    <div className="flex items-start gap-3">
                      {shop.canPayWithPoints && (
                        <Checkbox
                          checked={selectedShops.has(shop.shopId)}
                          onCheckedChange={() =>
                            toggleShopSelection(shop.shopId)
                          }
                          className="mt-1"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {shop.shopName}
                            </span>
                          </div>
                          <Badge
                            variant={
                              shop.canPayWithPoints ? "default" : "secondary"
                            }
                            className={
                              shop.canPayWithPoints ? "bg-green-600" : ""
                            }
                          >
                            {shop.canPayWithPoints ? "Has Points" : "No Points"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div className="text-muted-foreground">
                            Order Total:
                          </div>
                          <div className="font-medium text-right">
                            {formatPrice(shop.totalAmount)}
                          </div>

                          <div className="text-muted-foreground">
                            My Points:
                          </div>
                          <div className="font-medium text-right text-yellow-700">
                            {shop.currentPointsBalance} pts (
                            {formatPrice(shop.currentPointsValue)})
                          </div>

                          {shop.canPayWithPoints && (
                            <>
                              <div className="text-muted-foreground">
                                Can Cover:
                              </div>
                              <div className="font-medium text-right text-green-600">
                                {formatPrice(shop.maxPointsPayableAmount)}
                              </div>
                            </>
                          )}

                          <div className="text-muted-foreground">
                            Potential Earning:
                          </div>
                          <div className="font-medium text-right text-blue-600">
                            +{shop.potentialEarnedPoints} pts
                          </div>
                        </div>

                        {!shop.canPayWithPoints && (
                          <div className="mt-2 text-xs p-2 bg-slate-100 rounded text-center text-slate-600 italic">
                            {shop.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {eligibility.shopEligibilities.length === 0 && (
                  <div className="text-center text-muted-foreground p-4">
                    No shops found in your cart.
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Summary section */}
            <div className="mt-4 pt-4 border-t space-y-3">
              <h4 className="font-semibold text-sm">Payment Summary</h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Total:</span>
                  <span className="font-medium">
                    {formatPrice(calculations.totalOrderAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-yellow-700">
                  <span>Points Applied:</span>
                  <span className="font-medium">
                    -{formatPrice(calculations.totalPointsValue)} (
                    {calculations.totalPointsUsed} pts)
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>
                    {calculations.isFullPointsPayment
                      ? "Fully Covered!"
                      : "Remaining to Pay:"}
                  </span>
                  <span
                    className={
                      calculations.isFullPointsPayment
                        ? "text-green-600"
                        : "text-primary"
                    }
                  >
                    {calculations.isFullPointsPayment ? (
                      <Check className="h-5 w-5 inline" />
                    ) : (
                      formatPrice(calculations.remainingToPay)
                    )}
                  </span>
                </div>
              </div>

              {calculations.selectedShopDetails.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Using points from {calculations.selectedShopDetails.length}{" "}
                  shop(s):{" "}
                  {calculations.selectedShopDetails
                    .map((s) => s.shopName)
                    .join(", ")}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          {hasEligibleShops && (
            <Button
              onClick={handleSubmitPayment}
              disabled={
                processing || calculations.selectedShopDetails.length === 0
              }
              className={
                calculations.isFullPointsPayment
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : calculations.isFullPointsPayment ? (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Pay with Points
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Continue - Pay {formatPrice(calculations.remainingToPay)}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
