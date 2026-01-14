import { API_BASE_URL } from "./api";

export interface RewardRange {
  id: number;
  rangeType: "QUANTITY" | "AMOUNT";
  minValue: number;
  maxValue: number | null;
  points: number;
  description: string | null;
}

export interface RewardSystem {
  id: number;
  pointValue: number;
  isActive: boolean;
  isReviewPointsEnabled: boolean;
  reviewPointsAmount: number;
  isPurchasePointsEnabled: boolean;
  isQuantityBasedEnabled: boolean;
  isAmountBasedEnabled: boolean;
  isPercentageBasedEnabled: boolean;
  percentageRate: number | null;
  description: string | null;
  rewardRanges: RewardRange[];
}

export interface RewardSystemStatus {
  isActive: boolean;
}

export const rewardSystemService = {
  /**
   * Check if reward system is active
   */
  async checkStatus(): Promise<RewardSystemStatus> {
    const response = await fetch(
      `${API_BASE_URL}/public/reward-system/status`
    );

    if (!response.ok) {
      throw new Error("Failed to check reward system status");
    }

    return response.json();
  },

  /**
   * Get active reward system details
   */
  async getActiveRewardSystem(): Promise<RewardSystem | null> {
    const response = await fetch(
      `${API_BASE_URL}/public/reward-system/active`
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch reward system");
    }

    return response.json();
  },
};
