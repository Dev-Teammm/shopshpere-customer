import { API_BASE_URL } from "../api";

export interface AddressDto {
  streetAddress: string;
  city: string;
  state?: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface CartItemDTO {
  productId?: string; 
  variantId?: number; 
  quantity: number;
  weight?: number;
}

// Validation function for cart items
export function validateCartItems(items: CartItemDTO[]): string[] {
  const errors: string[] = [];
  
  items.forEach((item, index) => {
    if (!item.productId && !item.variantId) {
      errors.push(`Item ${index + 1}: Must have either productId or variantId`);
    }
    
    if (item.variantId && (typeof item.variantId !== 'number' || item.variantId <= 0)) {
      errors.push(`Item ${index + 1}: Invalid variantId - must be a positive number`);
    }
    
    if (item.productId && typeof item.productId !== 'string') {
      errors.push(`Item ${index + 1}: Invalid productId - must be a string`);
    }
    
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    }
  });
  
  return errors;
}

export interface ShopFulfillmentPreference {
  shopId: string;
  fulfillmentType: "PICKUP" | "DELIVERY";
}

export interface CalculateOrderShippingRequest {
  deliveryAddress: AddressDto;
  items: CartItemDTO[];
  orderValue: number;
  userId?: string;
  shopFulfillmentPreferences?: ShopFulfillmentPreference[];
}

export interface ShopSummary {
  shopId: string;
  shopName: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  rewardPoints: number;
  rewardPointsValue: number;
  productCount: number;
  // Shipping details for this shop
  distanceKm?: number;
  costPerKm?: number;
  selectedWarehouseName?: string;
  selectedWarehouseCountry?: string;
  isInternationalShipping?: boolean;
  // Shop capability and fulfillment information
  shopCapability?: "VISUALIZATION_ONLY" | "PICKUP_ORDERS" | "FULL_ECOMMERCE" | "HYBRID";
  fulfillmentType?: "PICKUP" | "DELIVERY";
  packagingFee?: number;
  requiresFulfillmentChoice?: boolean;
}

export interface PaymentSummaryDTO {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  rewardPoints: number;
  rewardPointsValue: number;
  currency: string;
  // New fields for distance and shipping details (aggregated from farthest warehouse)
  distanceKm?: number;
  costPerKm?: number;
  selectedWarehouseName?: string;
  selectedWarehouseCountry?: string;
  isInternationalShipping?: boolean;
  // Per-shop summaries
  shopSummaries?: ShopSummary[];
}

class CheckoutService {
  private baseUrl = `${API_BASE_URL}/checkout`;

  async calculateShippingCost(
    request: CalculateOrderShippingRequest
  ): Promise<number> {
    const response = await fetch(`${this.baseUrl}/calculate-shipping`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Failed to calculate shipping cost");
    }

    return response.json();
  }

  async getPaymentSummary(
    request: CalculateOrderShippingRequest
  ): Promise<PaymentSummaryDTO> {
    try {
      console.log(
        "Making payment summary request to:",
        `${this.baseUrl}/payment-summary`
      );
      console.log("Request payload:", request);

      const response = await fetch(`${this.baseUrl}/payment-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      console.log("Payment summary response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Payment summary error response:", errorText);

        if (response.status === 400) {
          throw new Error(
            "Invalid address or order information. Please check your details."
          );
        } else if (response.status === 500) {
          throw new Error(
            "Unable to calculate shipping costs. Please try again later."
          );
        } else {
          throw new Error(`Failed to get payment summary: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log("Payment summary result:", result);
      return result;
    } catch (error) {
      console.error("Error in getPaymentSummary:", error);
      throw error;
    }
  }

  async handlePaymentCancellation(sessionId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/webhook/cancel?session_id=${sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to handle payment cancellation");
      }

      console.log("Payment cancellation handled successfully");
    } catch (error) {
      console.error("Error handling payment cancellation:", error);
      throw error;
    }
  }
}

export const checkoutService = new CheckoutService();
