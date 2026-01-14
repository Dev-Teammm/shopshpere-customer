"use client";

import React, { useState } from "react";
import { Coins, CreditCard, Loader2, X } from "lucide-react";
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
import { formatPrice } from "@/lib/utils/priceFormatter";
import { toast } from "sonner";
import {
  pointsPaymentService,
  PointsPaymentRequest,
  PointsEligibilityResponse,
  PointsEligibilityRequest,
} from "@/lib/services/points-payment-service";
import {
  formatStockErrorMessage,
  extractErrorDetails,
} from "@/lib/utils/errorParser";

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

  const loadEligibility = async () => {
    if (!isOpen || eligibility) return;

    setLoading(true);
    try {
      // Map to eligibility request
      const request: PointsEligibilityRequest = {
        userId: paymentRequest.userId,
        items: paymentRequest.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      };

      const data = await pointsPaymentService.checkPointsEligibility(request);
      setEligibility(data);
    } catch (error: any) {
      console.error("Error loading points eligibility:", error);
      toast.error("Failed to load points information");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    // Logic for processing payment would go here.
    // Currently we only display eligibility as requested.
    // Implementing multi-shop payment would require backend corresponding changes.
    toast.info("Proceeding to payment...");

    // For now, we can try to process each eligible shop one by one or close.
    // Given the task is "display that clearly", I will leave this as a placeholder or close.
    onClose();
  };

  React.useEffect(() => {
    if (isOpen) {
      loadEligibility();
    } else {
      setEligibility(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-600" />
            Pay with Points
          </DialogTitle>
          <DialogDescription>Points breakdown by shop</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Checking points eligibility...</span>
          </div>
        ) : eligibility ? (
          <div className="space-y-4">
            {eligibility.shopEligibilities.map((shop) => (
              <div
                key={shop.shopId}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg">{shop.shopName}</span>
                  <Badge
                    variant={shop.canPayWithPoints ? "default" : "secondary"}
                    className={shop.canPayWithPoints ? "bg-green-600" : ""}
                  >
                    {shop.canPayWithPoints ? "Eligible" : "Unavailable"}
                  </Badge>
                </div>

                <Separator className="my-2" />

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Order Total:</div>
                  <div className="font-medium text-right">
                    {formatPrice(shop.totalAmount)}
                  </div>

                  <div className="text-muted-foreground">My Points:</div>
                  <div className="font-medium text-right text-yellow-700">
                    {shop.currentPointsBalance} pts (
                    {formatPrice(shop.currentPointsValue)})
                  </div>

                  <div className="text-muted-foreground">
                    Potential Earning:
                  </div>
                  <div className="font-medium text-right text-green-600">
                    +{shop.potentialEarnedPoints} pts
                  </div>
                </div>

                <div className="mt-3 text-xs p-2 bg-slate-100 rounded text-center text-slate-600 italic">
                  {shop.message}
                </div>
              </div>
            ))}

            {eligibility.shopEligibilities.length === 0 && (
              <div className="text-center text-muted-foreground p-4">
                No reward details available.
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Close
          </Button>
          {/* 
          <Button 
            onClick={handleConfirmPayment} 
            disabled={processing || !eligibility?.shopEligibilities.some(s => s.canPayWithPoints)}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
             Proceed
          </Button>
          */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
