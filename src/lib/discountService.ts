import { API_ENDPOINTS } from "./api";

export interface DiscountInfo {
  discountId: string;
  name: string;
  description: string;
  percentage: number;
  discountCode: string;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  remainingCount: number;
  productCount: number;
  isActive: boolean;
  isValid: boolean;
}

class DiscountService {
  async getActiveDiscounts(shopId?: string): Promise<DiscountInfo[]> {
    try {
      const url = shopId
        ? `${API_ENDPOINTS.DISCOUNTS_ACTIVE}?shopId=${shopId}`
        : API_ENDPOINTS.DISCOUNTS_ACTIVE;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch active discounts: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data.map(this.transformDiscount);
      } else {
        throw new Error(result.message || "Failed to fetch active discounts");
      }
    } catch (error) {
      console.error("Error fetching active discounts:", error);
      throw error;
    }
  }

  private transformDiscount(discount: any): DiscountInfo {
    return {
      discountId: discount.discountId,
      name: discount.name,
      description: discount.description,
      percentage: discount.percentage,
      discountCode: discount.discountCode,
      startDate: discount.startDate,
      endDate: discount.endDate,
      usageLimit: discount.usageLimit,
      usedCount: discount.usedCount,
      remainingCount: discount.usageLimit - discount.usedCount,
      productCount: discount.productCount || 0,
      isActive: discount.isActive,
      isValid: discount.isValid,
    };
  }
}

export const discountService = new DiscountService();
export default discountService;
