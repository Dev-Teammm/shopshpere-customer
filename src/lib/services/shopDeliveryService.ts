import { API_BASE_URL } from "../api";

export interface ShopDeliveryInfo {
  shopId: string;
  shopName: string;
  shopSlug: string;
  logoUrl?: string;
  description?: string;
  capability: "FULL_ECOMMERCE" | "HYBRID";
}

export interface CountryDeliveryInfo {
  country: string;
  shopCount: number;
  shops: ShopDeliveryInfo[];
}

export interface ShopsPageResponse {
  content: ShopDeliveryInfo[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

class ShopDeliveryService {
  private baseUrl = `${API_BASE_URL}/shops`;

  /**
   * Get all countries with delivery availability and shop counts
   */
  async getCountriesWithDelivery(): Promise<CountryDeliveryInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/delivery/countries`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch countries with delivery");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching countries with delivery:", error);
      throw error;
    }
  }

  /**
   * Get shops delivering to a specific country with pagination and search
   */
  async getShopsDeliveringToCountry(
    country: string,
    page: number = 0,
    size: number = 10,
    search?: string
  ): Promise<ShopsPageResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(
        `${this.baseUrl}/delivery/countries/${encodeURIComponent(country)}/shops?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch shops delivering to country");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching shops delivering to country:", error);
      throw error;
    }
  }
}

export const shopDeliveryService = new ShopDeliveryService();
