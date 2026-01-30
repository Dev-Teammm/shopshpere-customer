import { API_ENDPOINTS, apiCall } from "./api";

export interface Shop {
  shopId: string;
  name: string;
  description: string;
  logoUrl?: string; // Corresponds to 'image' in UI
  rating: number;
  totalReviews: number;
  productCount: number;
  followerCount?: number;
  isFollowing?: boolean;
  primaryCapability?: string;
  capabilities?: string[];
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
    sort: string = "followers-desc",
    followedOnly: boolean = false
  ): Promise<ShopSearchResponse> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category && category !== "all") params.append("category", category);
    if (followedOnly) params.append("followedOnly", "true");
    params.append("page", page.toString());
    params.append("size", size.toString());
    params.append("sort", sort);

    const url = `${API_ENDPOINTS.SEARCH_SHOPS}?${params.toString()}`;
    
    // Send auth token if available so backend can include isFollowing status
    const token = localStorage.getItem("authToken");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: "GET",
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  /**
   * Follow a shop
   */
  followShop: async (shopId: string): Promise<void> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Authentication required");
    }
    await fetch(`${API_ENDPOINTS.SHOP_BY_ID(shopId)}/follow`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  },

  /**
   * Unfollow a shop
   */
  unfollowShop: async (shopId: string): Promise<void> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Authentication required");
    }
    await fetch(`${API_ENDPOINTS.SHOP_BY_ID(shopId)}/follow`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
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
    const token = localStorage.getItem("authToken");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    // Add auth header if token exists (for authenticated users to get isFollowing)
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(API_ENDPOINTS.SHOP_DETAILS(shopId), {
      method: "GET",
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },
};
