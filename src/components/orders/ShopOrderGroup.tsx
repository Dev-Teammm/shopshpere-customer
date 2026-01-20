"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  Clock,
  FileText,
  RotateCcw,
  Info,
  CheckCircle2,
  Circle,
  HelpCircle,
  Download,
} from "lucide-react";
import {
  ShopOrderGroup as ShopOrderGroupType,
  OrderItemResponse,
  StatusTimeline,
} from "@/lib/orderService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface ShopOrderGroupProps {
  shopOrder: ShopOrderGroupType;
}

export const ShopOrderGroup: React.FC<ShopOrderGroupProps> = ({
  shopOrder,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "READY_FOR_PICKUP":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm mb-6 transition-all duration-200 hover:shadow-md">
      {/* Header - Collapsible Toggle */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer bg-slate-50 border-b select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {shopOrder.shopLogo ? (
            <img
              src={shopOrder.shopLogo}
              alt={shopOrder.shopName}
              className="w-10 h-10 rounded-full object-cover border bg-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
              {shopOrder.shopName.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg text-slate-900">
              {shopOrder.shopName}
            </h3>
            <p className="text-sm text-slate-500">
              Order #{shopOrder.shopOrderCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge
            className={`${getStatusColor(shopOrder.status)} border px-3 py-1`}
          >
            {shopOrder.status.replace(/_/g, " ")}
          </Badge>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500">Total for this shop</p>
            <p className="font-bold text-slate-900">
              {formatCurrency(shopOrder.total)}
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Foldable Content */}
      {isExpanded && (
        <div className="p-0 animate-in slide-in-from-top-2 duration-300 bg-white">
          {/* Shop-Level Timeline (The USER specifically asked for this to be enclosed here) */}
          <div className="bg-slate-50 border-b p-6">
            <h4 className="font-semibold flex items-center gap-2 text-slate-800 mb-6 uppercase tracking-wider text-xs">
              <Clock className="h-4 w-4 text-blue-500" />
              Order Journey Details
            </h4>
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
              {/* Desktop Horizontal Line */}
              <div className="absolute top-[18px] left-0 right-0 h-0.5 bg-slate-200 hidden md:block -z-0" />

              {shopOrder.timeline.map((step, idx) => (
                <div
                  key={idx}
                  className="flex flex-row md:flex-col items-start md:items-center gap-3 relative z-10 flex-1 w-full md:w-auto"
                >
                  {/* Indicator */}
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-full border-4 bg-white transition-all duration-300 ${
                      step.isCompleted
                        ? "border-green-500 shadow-md shadow-green-100"
                        : "border-slate-200"
                    }`}
                  >
                    {step.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : step.isCurrent ? (
                      <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    ) : (
                      <Circle className="w-3 h-3 text-slate-200" />
                    )}
                  </div>

                  <div className="flex-1 md:text-center">
                    <p
                      className={`text-sm font-bold truncate ${
                        step.isCompleted ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {step.statusLabel}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium md:max-w-[120px]">
                      {step.description}
                    </p>
                    {step.timestamp && (
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {format(new Date(step.timestamp), "MMM dd, HH:mm")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
            {/* Left Side: Products List */}
            <div className="lg:col-span-8 p-6 space-y-6">
              <h4 className="font-semibold flex items-center gap-2 text-slate-800 uppercase tracking-wider text-xs">
                <Package className="h-4 w-4 text-blue-500" />
                Ordered Items
              </h4>

              <div className="space-y-4">
                {shopOrder.items.map((item) => (
                  <div
                    key={item.itemId}
                    className="group border rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row gap-0 sm:gap-6 p-4">
                      {/* Product Image */}
                      <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-slate-50 border flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                        {item.productImages?.[0] ? (
                          <img
                            src={item.productImages[0]}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 mt-3 sm:mt-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-slate-900 text-base">
                              {item.productName}
                            </h5>
                            <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">
                              {item.productDescription}
                            </p>
                          </div>
                          {item.returnEligible &&
                            !item.returnInfo?.hasReturnRequest && (
                              <Badge
                                variant="secondary"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              >
                                Return Eligible ({item.daysRemainingForReturn}d)
                              </Badge>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm border-t pt-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                              Quantity
                            </span>
                            <span className="font-bold text-slate-900">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                              Price
                            </span>
                            <span className="font-bold text-slate-900">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                          {item.hasDiscount && (
                            <div className="flex flex-col">
                              <span className="text-[10px] text-red-400 uppercase font-bold tracking-tight">
                                Discount
                              </span>
                              <span className="font-bold text-green-600">
                                -{item.discountPercentage}%{" "}
                                <span className="text-[10px] font-normal">
                                  ({item.discountName})
                                </span>
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col ml-auto text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                              Item Total
                            </span>
                            <span className="font-extrabold text-blue-600 text-lg">
                              {formatCurrency(item.totalPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ITEM SPECIFIC RETURN/APPEAL UI */}
                    {item.returnInfo?.hasReturnRequest && (
                      <div className="bg-amber-50/50 border-t border-amber-100 p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <RotateCcw className="h-4 w-4 text-amber-600" />
                          <h6 className="text-sm font-bold text-amber-900 border-b border-amber-200 pb-1 w-full">
                            Return Request History
                          </h6>
                        </div>

                        {item.returnInfo.returnRequests.map((ret) => (
                          <div
                            key={ret.id}
                            className="bg-white border border-amber-200 rounded-lg p-3 shadow-sm"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-xs font-mono font-bold text-slate-500">
                                  ID: #{ret.id}
                                </span>
                                <div className="mt-1 flex items-center gap-2">
                                  <Badge
                                    className={
                                      ret.status === "APPROVED"
                                        ? "bg-green-100 text-green-700 border-green-200"
                                        : ret.status === "DENIED"
                                          ? "bg-red-100 text-red-700 border-red-200"
                                          : "bg-amber-100 text-amber-700 border-amber-200"
                                    }
                                  >
                                    {ret.status}
                                  </Badge>
                                  <span className="text-xs text-slate-400 italic">
                                    Submitted{" "}
                                    {format(
                                      new Date(ret.submittedAt),
                                      "MMM dd, yyyy",
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm">
                              <p className="text-slate-700">
                                <span className="font-semibold text-slate-500 text-xs uppercase mr-2 tracking-wider">
                                  Reason:
                                </span>
                                {ret.reason}
                              </p>

                              {ret.decisionNotes && (
                                <div className="bg-slate-50 p-2 rounded border-l-4 border-slate-300 mt-2">
                                  <span className="font-semibold text-slate-500 text-xs uppercase block mb-1 tracking-wider">
                                    Decision Notes:
                                  </span>
                                  <p className="text-xs italic text-slate-600">
                                    "{ret.decisionNotes}"
                                  </p>
                                </div>
                              )}

                              {/* REFUND INFO */}
                              {ret.refundProcessed && (
                                <div className="bg-green-50 border border-green-100 rounded-md p-3 mt-2">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span className="text-xs font-bold text-green-900 uppercase tracking-wider">
                                      Refund Processed
                                    </span>
                                    {ret.refundProcessedAt && (
                                      <span className="ml-auto text-[10px] text-green-600 font-medium">
                                        {format(
                                          new Date(ret.refundProcessedAt),
                                          "MMM dd, yyyy",
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-sm font-bold text-slate-900">
                                      Amount:{" "}
                                      {formatCurrency(ret.refundAmount || 0)}
                                    </p>
                                    {ret.refundScreenshotUrl && (
                                      <div className="pt-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 text-xs bg-white text-green-700 border-green-200 hover:bg-green-50 w-full flex items-center justify-center gap-2"
                                          onClick={() => {
                                            const link =
                                              document.createElement("a");
                                            link.href =
                                              ret.refundScreenshotUrl!;
                                            link.target = "_blank";
                                            link.download = `refund-receipt-${ret.id}.jpg`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                          }}
                                        >
                                          <Download className="h-3 w-3" />
                                          Download Refund Proof
                                        </Button>
                                      </div>
                                    )}
                                    {ret.refundNotes && (
                                      <p className="text-[10px] text-green-700 italic border-t border-green-100 pt-2 mt-2">
                                        Note: {ret.refundNotes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* APPEAL INFO */}
                              {ret.appeal && (
                                <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-md p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <HelpCircle className="h-3 h-3 text-indigo-600" />
                                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                                      Return Appeal
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="ml-auto text-[10px] bg-white text-indigo-600 border-indigo-200"
                                    >
                                      {ret.appeal.status}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-indigo-700">
                                    <span className="font-bold">
                                      Appeal Reason:
                                    </span>{" "}
                                    {ret.appeal.reason}
                                  </p>
                                  {ret.appeal.decisionNotes && (
                                    <p className="text-[10px] text-indigo-600 mt-2 italic px-2 border-l-2 border-indigo-200">
                                      Decision: {ret.appeal.decisionNotes}
                                    </p>
                                  )}
                                </div>
                              )}

                              {ret.canBeAppealed && (
                                <div className="mt-2 flex justify-end">
                                  <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 transition-colors">
                                    Request Appeal
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Tracking, Totals, Delivery Info */}
            <div className="lg:col-span-4 bg-slate-50/50 p-6 space-y-6 border-l">
              {/* Delivery Detailed Info */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2 text-slate-800 uppercase tracking-wider text-xs">
                  <Truck className="h-4 w-4 text-blue-500" />
                  Delivery & Fulfillment
                </h4>

                {shopOrder.deliveryInfo ? (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                          Delivery Status
                        </span>
                      </div>
                      <Badge className="bg-white text-blue-600 border-blue-200 hover:bg-white">
                        {shopOrder.deliveryInfo.hasDeliveryStarted
                          ? "Out for Delivery"
                          : "Processing"}
                      </Badge>
                    </div>

                    <div className="space-y-3 px-1">
                      {shopOrder.deliveryInfo.delivererName && (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">
                            Delivery Agent
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            {shopOrder.deliveryInfo.delivererName}
                          </span>
                          {shopOrder.deliveryInfo.delivererPhone && (
                            <span className="text-xs text-blue-600 font-medium">
                              {shopOrder.deliveryInfo.delivererPhone}
                            </span>
                          )}
                        </div>
                      )}
                      {shopOrder.deliveryInfo.scheduledAt && (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">
                            Scheduled Arrival
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            {format(
                              new Date(shopOrder.deliveryInfo.scheduledAt),
                              "MMMM dd, yyyy",
                            )}
                          </span>
                        </div>
                      )}

                      <div className="mt-2 pt-2 border-t">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">
                            Pickup Token
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border overflow-hidden truncate max-w-[150px]">
                              {shopOrder.deliveryInfo.pickupToken}
                            </span>
                            {shopOrder.pickupTokenUsed && (
                              <Badge className="bg-green-500 text-white border-0 text-[10px] h-5">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center">
                    <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">
                      Assignment in progress...
                    </p>
                  </div>
                )}
              </div>

              {/* Delivery Notes */}
              {shopOrder.deliveryNote && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-slate-800 uppercase tracking-wider text-xs">
                    <FileText className="h-4 w-4 text-slate-500" />
                    Delivery Notes
                  </h4>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <p className="text-sm italic text-slate-700 leading-relaxed font-medium capitalize">
                      "{shopOrder.deliveryNote.note}"
                    </p>
                    <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-tighter">
                      Left on{" "}
                      {format(
                        new Date(shopOrder.deliveryNote.createdAt),
                        "MMM dd, yyyy",
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Shop Sumary / Totals */}
              <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg space-y-4">
                <h4 className="text-[10px] uppercase font-extrabold tracking-[0.2em] text-slate-400 mb-2">
                  Shop Order Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Items:</span>
                    <span className="font-bold">{shopOrder.items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Shop Subtotal:</span>
                    <span className="font-bold">
                      {formatCurrency(shopOrder.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Shipping:</span>
                    <span className="font-bold">
                      {formatCurrency(shopOrder.shippingCost)}
                    </span>
                  </div>
                  {shopOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400">Shop Discount:</span>
                      <span className="font-bold text-emerald-400">
                        -{formatCurrency(shopOrder.discountAmount)}
                      </span>
                    </div>
                  )}
                  {shopOrder.pointsUsed !== undefined &&
                    shopOrder.pointsUsed > 0 && (
                      <div className="flex justify-between text-sm py-1 px-2 bg-blue-500/10 rounded mt-1">
                        <span className="text-blue-300 flex items-center gap-1 italic">
                          <Info className="h-3 w-3" />
                          Points Applied:
                        </span>
                        <span className="font-bold text-blue-300">
                          -{formatCurrency(shopOrder.pointsValue || 0)}
                          <span className="text-[10px] ml-1 opacity-70 italic">
                            ({shopOrder.pointsUsed} pts)
                          </span>
                        </span>
                      </div>
                    )}
                  <Separator className="bg-slate-800 my-2" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
                      {shopOrder.pointsUsed && shopOrder.pointsUsed > 0
                        ? "Amount Charged"
                        : "Grand Total"}
                    </span>
                    <span className="text-2xl font-black text-blue-400">
                      {formatCurrency(
                        Math.max(
                          0,
                          shopOrder.total - (shopOrder.pointsValue || 0),
                        ),
                      )}
                    </span>
                  </div>
                  {shopOrder.pointsUsed !== undefined &&
                    shopOrder.pointsUsed > 0 && (
                      <p className="text-[10px] text-slate-500 text-right italic font-medium mt-1">
                        *Original total: {formatCurrency(shopOrder.total)}
                      </p>
                    )}
                </div>
              </div>

              {/* ACTION BUTTONS (The USER asked for the UI back with its routes) */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => {
                    const orderId = shopOrder.shopOrderId.toString();
                    let url = `/returns/order/${orderId}?isShopOrder=true`;
                    if (shopOrder.trackingToken && shopOrder.shopOrderCode) {
                      url += `&token=${shopOrder.trackingToken}&orderNumber=${shopOrder.shopOrderCode}`;
                    }
                    window.location.href = url;
                  }}
                  className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
                >
                  <RotateCcw className="h-4 w-4 text-orange-500 group-hover:rotate-[-45deg] transition-transform" />
                  View All Shop Returns
                </button>

                <button
                  onClick={() => {
                    window.location.href = `/returns/request?shopOrderId=${shopOrder.shopOrderId}&orderNumber=${shopOrder.shopOrderCode}&token=${shopOrder.trackingToken}`;
                  }}
                  className="w-full bg-blue-600 border border-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Request New Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
