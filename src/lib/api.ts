export const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "/api/v1"
    : "http://localhost:8080/api/v1";
export const API_ENDPOINTS = {
  PRODUCTS: `${API_BASE_URL}/customer/products`,
  PRODUCTS_BY_IDS: `${API_BASE_URL}/products/by-ids`,
  PRODUCT_BY_ID: (id: string) => `${API_BASE_URL}/customer/products/${id}`,
  PRODUCT_BY_SLUG: (slug: string) =>
    `${API_BASE_URL}/customer/products/slug/${slug}`,
  SEARCH_PRODUCTS: `${API_BASE_URL}/customer/products/search`,
  FEATURED_PRODUCTS: `${API_BASE_URL}/customer/products/featured`,
  BESTSELLER_PRODUCTS: `${API_BASE_URL}/customer/products/bestsellers`,
  NEW_ARRIVAL_PRODUCTS: `${API_BASE_URL}/customer/products/new-arrivals`,
  PRODUCTS_BY_CATEGORY: (categoryId: string) =>
    `${API_BASE_URL}/customer/products/category/${categoryId}`,
  PRODUCTS_BY_BRAND: (brandId: string) =>
    `${API_BASE_URL}/customer/products/brand/${brandId}`,
  SIMILAR_PRODUCTS: (productId: string) =>
    `${API_BASE_URL}/customer/products/${productId}/similar`,
  PRODUCT_REVIEWS: (productId: string) =>
    `${API_BASE_URL}/reviews/product/${productId}`,
  REVIEWS: `${API_BASE_URL}/reviews`,

  CATEGORIES: `${API_BASE_URL}/categories`,
  CATEGORY_BY_ID: (id: string) => `${API_BASE_URL}/categories/${id}`,

  BRANDS: `${API_BASE_URL}/brands`,
  BRAND_BY_ID: (id: string) => `${API_BASE_URL}/brands/${id}`,

  ATTRIBUTE_TYPES: `${API_BASE_URL}/product-attribute-types`,
  ATTRIBUTE_VALUES: `${API_BASE_URL}/product-attribute-values`,

  CART: `${API_BASE_URL}/cart`,
  CART_VIEW: `${API_BASE_URL}/cart/view`,
  CART_ADD: `${API_BASE_URL}/cart/add`,
  CART_UPDATE: `${API_BASE_URL}/cart/update`,
  CART_REMOVE: (itemId: string) => `${API_BASE_URL}/cart/remove/${itemId}`,
  CART_CLEAR: `${API_BASE_URL}/cart/clear`,
  CART_HAS_ITEMS: `${API_BASE_URL}/cart/has-items`,
  CART_PRODUCTS: `${API_BASE_URL}/cart/products`,
  CART_ITEMS: `${API_BASE_URL}/cart/items`,
  CART_ITEM_BY_ID: (itemId: string) => `${API_BASE_URL}/cart/items/${itemId}`,
  CART_COUNT: `${API_BASE_URL}/cart/count`,

  // Wishlist endpoints
  WISHLIST: `${API_BASE_URL}/wishlist`,
  WISHLIST_ADD: `${API_BASE_URL}/wishlist/add`,
  WISHLIST_REMOVE: (productId: string) =>
    `${API_BASE_URL}/wishlist/remove/${productId}`,
  WISHLIST_MOVE_TO_CART: (productId: string) =>
    `${API_BASE_URL}/wishlist/move-to-cart/${productId}`,
  WISHLIST_CLEAR: `${API_BASE_URL}/wishlist/clear`,

  // Authentication endpoints
  AUTH_REGISTER: `${API_BASE_URL}/auth/users/register`,
  AUTH_LOGIN: `${API_BASE_URL}/auth/users/login`,
  AUTH_ME: `${API_BASE_URL}/auth/users/me`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/users/logout`,
  AUTH_PASSWORD_RESET: `${API_BASE_URL}/auth/users/request-password-reset`,
  AUTH_VERIFY_RESET: `${API_BASE_URL}/auth/users/verify-reset`,
  AUTH_VERIFY_RESET_TOKEN: `${API_BASE_URL}/auth/users/verify-reset-token`,
  AUTH_RESET_PASSWORD: `${API_BASE_URL}/auth/users/reset-password`,

  // Order endpoints
  ORDERS: `${API_BASE_URL}/orders`,
  GUEST_ORDERS: `${API_BASE_URL}/guest/orders`,

  // Checkout endpoints
  CHECKOUT_CREATE_SESSION: `${API_BASE_URL}/checkout/create-user-session`,
  CHECKOUT_GUEST_CREATE_SESSION: `${API_BASE_URL}/checkout/guest/create-session`,
  CHECKOUT_VERIFY: `${API_BASE_URL}/checkout/verify`,

  // Landing page endpoints
  LANDING_PAGE: `${API_BASE_URL}/landing`,
  LANDING_TOP_SELLING: `${API_BASE_URL}/landing/top-selling`,
  LANDING_NEW_PRODUCTS: `${API_BASE_URL}/landing/new-products`,
  LANDING_DISCOUNTED: `${API_BASE_URL}/landing/discounted`,
  LANDING_CATEGORIES: `${API_BASE_URL}/landing/categories`,
  LANDING_BRANDS: `${API_BASE_URL}/landing/brands`,

  // Discount endpoints
  DISCOUNTS: `${API_BASE_URL}/discounts`,
  DISCOUNTS_ACTIVE: `${API_BASE_URL}/discounts/active`,
  DISCOUNT_BY_ID: (id: string) => `${API_BASE_URL}/discounts/${id}`,

  // Points Payment endpoints
  POINTS_PAYMENT_PREVIEW: `${API_BASE_URL}/points-payment/preview`,
  POINTS_PAYMENT_PROCESS: `${API_BASE_URL}/points-payment/process`,
  POINTS_PAYMENT_COMPLETE_HYBRID: (userId: string, orderId: string) =>
    `${API_BASE_URL}/points-payment/complete-hybrid/${userId}/${orderId}`,

  // Return endpoints
  RETURNS: `${API_BASE_URL}/returns`,
  RETURN_BY_ID: (returnId: string) => `${API_BASE_URL}/returns/${returnId}`,
  RETURN_BY_ORDER_ID: (orderId: string) =>
    `${API_BASE_URL}/returns/order/${orderId}`,
  RETURN_BY_ORDER_NUMBER: (orderNumber: string) =>
    `${API_BASE_URL}/returns/order-number/${orderNumber}`,
  RETURN_REQUESTS_BY_ORDER: (orderId: string, customerId: string) =>
    `${API_BASE_URL}/returns/order/${orderId}?customerId=${customerId}`,
  RETURN_REQUESTS_BY_ORDER_GUEST: (orderNumber: string, token: string) =>
    `${API_BASE_URL}/returns/order/guest?orderNumber=${encodeURIComponent(
      orderNumber
    )}&token=${encodeURIComponent(token)}`,
  RETURN_SUBMIT: `${API_BASE_URL}/returns/submit`,

  // Appeal endpoints
  APPEALS: `${API_BASE_URL}/appeals`,
  APPEAL_SUBMIT: `${API_BASE_URL}/appeals/submit`,
  APPEAL_BY_RETURN_ID: (returnId: string) =>
    `${API_BASE_URL}/appeals/return/${returnId}`,

  // Public Delivery endpoints (no authentication required)
  DELIVERY_CHECK_AVAILABILITY: (country: string) =>
    `${API_BASE_URL}/public/delivery/check-availability?country=${encodeURIComponent(
      country
    )}`,
  DELIVERY_AVAILABLE_COUNTRIES: `${API_BASE_URL}/public/delivery/available-countries`,

  // Shop endpoints
  SHOPS: `${API_BASE_URL}/shops`,
  SHOP_BY_ID: (id: string) => `${API_BASE_URL}/shops/${id}`,
  SEARCH_SHOPS: `${API_BASE_URL}/shops/search`,
  ACTIVE_SHOPS: `${API_BASE_URL}/shops/active`,
  SHOP_DETAILS: (id: string) => `${API_BASE_URL}/shops/${id}/details`,
} as const;

// HTTP Headers
export const getAuthHeaders = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// API Response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
}

// API Helper functions
export const apiCall = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
};

// Public API call (no authentication required)
export const publicApiCall = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  return apiCall<T>(url, options);
};
