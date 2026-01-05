import { API_ENDPOINTS, apiCall } from "./api";

export interface Shop {
  shopId: string;
  name: string;
  description: string;
  logoUrl?: string; // Corresponds to 'image' in UI
  rating: number;
  totalReviews: number;
  productCount: number;
  address?: string; // Corresponds to 'location' in UI
  ownerName?: string; // Corresponds to 'owner' in UI
  ownerEmail?: string;
  category?: string;
  isActive: boolean;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
  createdAt: string; // Corresponds to 'joinedDate' in UI
}

export interface ShopSearchResponse {
  content: Shop[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export const StoreService = {
  /**
   * Search shops with parameters
   */
  searchShops: async (
    search: string = "",
    category: string = "",
    page: number = 0,
    size: number = 10,
    sort: string = "rating-desc"
  ): Promise<ShopSearchResponse> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category && category !== "all") params.append("category", category);
    params.append("page", page.toString());
    params.append("size", size.toString());
    params.append("sort", sort);

    const url = `${API_ENDPOINTS.SEARCH_SHOPS}?${params.toString()}`;
    return apiCall<ShopSearchResponse>(url);
  },

  /**
   * Get shop by ID
   */
  getShopById: async (shopId: string): Promise<Shop> => {
    return apiCall<Shop>(API_ENDPOINTS.SHOP_BY_ID(shopId));
  },

  /**
   * Get shop details including owner and featured products
   */
  getShopDetails: async (shopId: string): Promise<any> => {
    return apiCall<any>(API_ENDPOINTS.SHOP_DETAILS(shopId));
  },
};
