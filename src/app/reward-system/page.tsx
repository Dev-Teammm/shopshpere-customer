"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Gift,
  Star,
  Trophy,
  ShoppingBag,
  Percent,
  CheckCircle,
  Loader2,
  Package,
  DollarSign,
  MessageSquare,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { rewardSystemService, RewardSystem } from "@/lib/rewardSystemService";
import { toast } from "sonner";

export default function RewardSystemPage() {
  const [rewardSystem, setRewardSystem] = useState<RewardSystem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewardSystem = async () => {
      try {
        const data = await rewardSystemService.getActiveRewardSystem();
        setRewardSystem(data);
      } catch (error) {
        console.error("Failed to fetch reward system:", error);
        toast.error("Failed to load reward system information");
      } finally {
        setLoading(false);
      }
    };

    fetchRewardSystem();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!rewardSystem) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-12">
          <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Active Reward System</h2>
          <p className="text-muted-foreground mb-6">
            There is currently no active reward system. Please check back later!
          </p>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pointsToMoney = (points: number) => {
    return (points * rewardSystem.pointValue).toFixed(2);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            Reward System
          </h1>
          <p className="text-muted-foreground mt-2">
            {rewardSystem.description || "Earn points with every purchase and redeem them for discounts"}
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <CardTitle className="text-lg">Point Value</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-2xl font-bold text-primary">
                ${rewardSystem.pointValue.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">per point</p>
            </CardContent>
          </Card>

          {rewardSystem.isPercentageBasedEnabled && rewardSystem.percentageRate && (
            <Card>
              <CardHeader className="text-center">
                <Percent className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Purchase Rewards</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {rewardSystem.percentageRate}%
                </p>
                <p className="text-sm text-muted-foreground">of purchase amount</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ways to Earn Points */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Ways to Earn Points
            </CardTitle>
            <CardDescription>
              Multiple ways to earn reward points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rewardSystem.isPurchasePointsEnabled && (
                <div className="flex items-start gap-4 p-4 border rounded-md">
                  <div className="bg-green-100 rounded-full p-3">
                    <ShoppingBag className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Purchase Rewards</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Earn points on every purchase you make
                    </p>
                    {rewardSystem.isPercentageBasedEnabled && rewardSystem.percentageRate && (
                      <Badge variant="secondary">
                        {rewardSystem.percentageRate}% of purchase amount
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {rewardSystem.isReviewPointsEnabled && rewardSystem.reviewPointsAmount > 0 && (
                <div className="flex items-start gap-4 p-4 border rounded-md">
                  <div className="bg-purple-100 rounded-full p-3">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Product Reviews</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Share your experience and earn points
                    </p>
                    <Badge variant="secondary">
                      {rewardSystem.reviewPointsAmount} points = ${pointsToMoney(rewardSystem.reviewPointsAmount)} per review
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reward Ranges */}
        {rewardSystem.rewardRanges && rewardSystem.rewardRanges.length > 0 && (
          <div className="space-y-6 mb-8">
            {rewardSystem.isQuantityBasedEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    Quantity-Based Rewards
                  </CardTitle>
                  <CardDescription>
                    Earn bonus points based on the number of items purchased
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rewardSystem.rewardRanges
                      .filter((range) => range.rangeType === "QUANTITY")
                      .map((range, index) => (
                        <div key={range.id} className="flex items-center justify-between p-4 border rounded-md">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">
                              {range.minValue} {range.maxValue ? `- ${range.maxValue}` : "+"} items
                            </h3>
                            {range.description && (
                              <p className="text-sm text-muted-foreground">{range.description}</p>
                            )}
                          </div>
                          <Badge variant="default" className="ml-4">
                            {range.points} points
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {rewardSystem.isAmountBasedEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Amount-Based Rewards
                  </CardTitle>
                  <CardDescription>
                    Earn bonus points based on your purchase amount
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rewardSystem.rewardRanges
                      .filter((range) => range.rangeType === "AMOUNT")
                      .map((range, index) => (
                        <div key={range.id} className="flex items-center justify-between p-4 border rounded-md">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">
                              ${range.minValue} {range.maxValue ? `- $${range.maxValue}` : "+"} purchase
                            </h3>
                            {range.description && (
                              <p className="text-sm text-muted-foreground">{range.description}</p>
                            )}
                          </div>
                          <Badge variant="default" className="ml-4">
                            {range.points} points
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* How to Redeem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              How to Redeem Your Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-semibold text-primary">1</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Accumulate Points</h4>
                  <p className="text-muted-foreground">
                    Earn points through purchases, reviews, and other activities
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-semibold text-primary">2</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Shop & Checkout</h4>
                  <p className="text-muted-foreground">
                    Add items to your cart and proceed to checkout
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-semibold text-primary">3</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Apply Points</h4>
                  <p className="text-muted-foreground">
                    Use your points at checkout to get instant discounts on your order
                  </p>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-md border border-blue-200 mt-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Each point is worth ${rewardSystem.pointValue.toFixed(2)}. 
                  Points can be used to reduce your order total at checkout.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
