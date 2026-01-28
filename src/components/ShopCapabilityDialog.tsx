"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Package, ShoppingCart, Truck, Store } from "lucide-react";

type ShopCapability = "VISUALIZATION_ONLY" | "PICKUP_ORDERS" | "FULL_ECOMMERCE" | "HYBRID";

interface ShopCapabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capability: ShopCapability;
}

const capabilityInfo = {
  VISUALIZATION_ONLY: {
    title: "Visualization Only",
    icon: Info,
    description: "This shop displays products for viewing purposes only.",
    details: [
      "Products are shown for informational purposes",
      "No online orders can be placed",
      "Contact the shop directly for inquiries or purchases",
      "No delivery or pickup options available",
    ],
    color: "bg-gray-100 text-gray-700",
  },
  PICKUP_ORDERS: {
    title: "Pickup Orders",
    icon: Store,
    description: "This shop accepts orders that you can pick up in person.",
    details: [
      "You can place orders online",
      "Pick up your order at the shop location",
      "Returns are handled at the shop",
      "No delivery service available",
    ],
    color: "bg-blue-100 text-blue-700",
  },
  FULL_ECOMMERCE: {
    title: "Full E-commerce",
    icon: Truck,
    description: "This shop offers complete online shopping with delivery.",
    details: [
      "Place orders online",
      "Home delivery available",
      "Delivery agents handle shipping",
      "Returns can be picked up by delivery agents",
    ],
    color: "bg-green-100 text-green-700",
  },
  HYBRID: {
    title: "Hybrid Shop",
    icon: ShoppingCart,
    description: "This shop offers both pickup and delivery options.",
    details: [
      "Place orders online",
      "Choose between pickup or delivery",
      "Pick up at shop or have it delivered",
      "Flexible return options",
    ],
    color: "bg-purple-100 text-purple-700",
  },
};

export function ShopCapabilityDialog({
  open,
  onOpenChange,
  capability,
}: ShopCapabilityDialogProps) {
  if (!capability) return null;

  const info = capabilityInfo[capability];
  const Icon = info.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${info.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <DialogTitle>{info.title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {info.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-4">
          <h4 className="font-medium text-sm">What this means for you:</h4>
          <ul className="space-y-2">
            {info.details.map((detail, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-1">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="default">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ShopCapabilityBadge({
  capability,
  onClick,
  className,
}: {
  capability: ShopCapability;
  onClick?: () => void;
  className?: string;
}) {
  if (!capability) return null;

  const info = capabilityInfo[capability];
  const Icon = info.icon;

  return (
    <Badge
      variant="outline"
      className={`cursor-pointer hover:bg-accent transition-colors ${info.color} ${className || ""}`}
      onClick={onClick}
    >
      <Icon className="h-3 w-3 mr-1.5" />
      {info.title}
    </Badge>
  );
}
