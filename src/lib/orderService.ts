// Types based on backend DTOs

// Secure Order Tracking Types
export interface OrderTrackingRequest {
  email: string;
}

export interface OrderTrackingResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
  trackingUrl?: string;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: string;
  createdAt: string;
  total: number;
  itemCount: number;
  customerName: string;
  customerEmail: string;
  hasReturnRequest: boolean;
}

export interface OrderListResponse {
  success: boolean;
  data: OrderSummary[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface CreateOrderRequest {
  userId: string;
  items: CreateOrderItemRequest[];
  shippingAddress: CreateOrderAddressRequest;
  billingAddress?: CreateOrderAddressRequest;
  paymentMethod: string;
  notes?: string;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
}

export interface CreateOrderItemRequest {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface CreateOrderAddressRequest {
  street: string;
  city: string;
  state: string;
  country: string;
  phone: string;
}

export interface CheckoutRequest {
  items: CartItemDTO[];
  shippingAddress: AddressDto;
  currency?: string;
  userId?: string;
  platform: string;
}

export interface GuestCheckoutRequest {
  guestName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;
  address: AddressDto;
  items: CartItemDTO[];
  platform: string;
}

export interface CartItemDTO {
  id?: number;
  productId?: string;
  variantId?: number;
  sku?: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  totalPrice?: number;
  addedAt?: string;
  inStock?: boolean;
  availableStock?: number;
  isVariantBased?: boolean;
}

export interface AddressDto {
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface CheckoutVerificationResult {
  status: string;
  amount: number;
  currency: string;
  customerEmail: string;
  receiptUrl: string;
  paymentIntentId: string;
  updated: boolean;
  order: OrderResponse;
}

export interface OrderTransactionInfo {
  orderTransactionId: string;
  orderAmount: number;
  paymentMethod: string;
  transactionRef?: string;
  status: string;
  receiptUrl?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentDate?: string;
  pointsUsed: number;
  pointsValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderCustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface OrderResponse {
  id: string;
  userId: string;
  orderNumber: string;
  pickupToken: string;
  status: string;
  items: any[] | null;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: any | null;
  billingAddress: any | null;
  customerInfo: OrderCustomerInfo | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery: string | null;
  trackingNumber: string | null;
  transaction?: OrderTransactionInfo | null;
}

export interface SimpleProduct {
  productId: string;
  name: string;
  description?: string;
  price?: number;
  images: string[];
}

export interface OrderProductInfo {
  id: string;
  name: string;
  images: string[];
}

export interface OrderVariantInfo {
  id: number;
  name: string;
  images: string[];
}

export interface ReturnAppealInfo {
  id: number;
  status: string;
  reason: string;
  description: string;
  submittedAt: string;
  decisionAt?: string;
  decisionNotes?: string;
}

export interface ReturnRequestInfo {
  id: number;
  returnCode?: string;
  status: string;
  reason: string;
  submittedAt: string;
  decisionAt?: string;
  decisionNotes?: string;
  canBeAppealed: boolean;
  appeal?: ReturnAppealInfo;
}

export interface ReturnItemInfo {
  hasReturnRequest: boolean;
  totalReturnedQuantity: number;
  remainingQuantity: number;
  returnRequests: ReturnRequestInfo[];
}

export interface OrderItemResponse {
  itemId: number;
  id?: string; // For backward compatibility
  productId: string;
  productName: string;
  productDescription: string;
  productImages: string[];
  product?: OrderProductInfo; // For backward compatibility
  variant?: OrderVariantInfo; // For backward compatibility
  variantId?: string;
  quantity: number;
  price: number;
  originalPrice: number;
  totalPrice: number;
  discountPercentage: number;
  discountName?: string;
  hasDiscount: boolean;

  // Return fields
  returnEligible?: boolean;
  maxReturnDays?: number;
  daysRemainingForReturn?: number;
  returnInfo?: ReturnItemInfo;
}

export interface DeliveryNote {
  id: number;
  orderId: number;
  deliveryGroupId?: number;
  agentId: string;
  agentName: string;
  noteText: string;
  noteCategory: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryNotesResponse {
  success: boolean;
  data: {
    notes: DeliveryNote[];
    totalNotes: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface OrderAddressResponse {
  id: string;
  street: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface StatusTimeline {
  status: string;
  statusLabel: string;
  description: string;
  timestamp: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface DeliveryInfo {
  deliveryGroupName?: string;
  delivererName?: string;
  delivererPhone?: string;
  scheduledAt?: string;
  deliveryStartedAt?: string;
  deliveredAt?: string;
  hasDeliveryStarted: boolean;
  pickupToken: string;
}

export interface ReturnRequest {
  returnId: number;
  returnCode: string;
  reason: string;
  status: string;
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

export interface ShopOrderGroup {
  shopOrderId: number;
  shopOrderCode: string;
  shopId: string;
  shopName: string;
  shopLogo?: string;
  shopSlug: string;
  status: string;
  timeline: StatusTimeline[];
  items: OrderItemResponse[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  deliveryInfo?: DeliveryInfo;
  returnRequests: ReturnRequest[];
  deliveryNote?: {
    noteId: number;
    note: string;
    createdAt: string;
  };
  trackingToken: string;
  pickupTokenUsed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetailsResponse {
  orderId: number;
  orderCode: string;
  orderNumber?: string; // For backward compatibility
  orderDate: string;
  createdAt?: string; // For backward compatibility
  overallStatus: string;
  status?: string; // For backward compatibility
  customerInfo: OrderCustomerInfo | null;
  shippingAddress: OrderAddressResponse | null;
  billingAddress: OrderAddressResponse | null;
  paymentInfo?: {
    paymentMethod: string;
    paymentStatus: string;
    paymentDate?: string;
    transactionRef?: string;
    pointsUsed: number;
    pointsValue: number;
  };
  // Backward compatibility fields
  paymentMethod?: string | null;
  paymentStatus?: string | null;

  shopOrders: ShopOrderGroup[];
  subtotal: number;
  totalShipping?: number;
  shipping?: number; // For backward compatibility
  totalDiscount?: number;
  discount?: number; // For backward compatibility
  tax: number;
  grandTotal: number;
  total?: number; // For backward compatibility
}

export interface ErrorResponse {
  status: number;
  message: string;
  path: string;
  timestamp: string;
}

// Import centralized API configuration
import { API_ENDPOINTS } from "./api";

/**
 * Service to interact with the Order and Checkout APIs
 */
export const OrderService = {
  /**
   * Create a checkout session for authenticated user
   */
  createCheckoutSession: async (
    request: CheckoutRequest
  ): Promise<{ sessionUrl: string }> => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_ENDPOINTS.CHECKOUT_CREATE_SESSION}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating checkout session");
      }

      const data = await response.json();
      return { sessionUrl: data.sessionUrl };
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  },

  /**
   * Create a checkout session for guest user
   */
  createGuestCheckoutSession: async (
    request: GuestCheckoutRequest
  ): Promise<{ sessionUrl: string }> => {
    try {
      // Validate cart items before sending to backend
      const validationErrors: string[] = [];

      request.items.forEach((item, index) => {
        if (!item.productId && !item.variantId) {
          validationErrors.push(
            `Item ${index + 1}: Must have either productId or variantId`
          );
        }

        if (
          item.variantId &&
          (typeof item.variantId !== "number" || item.variantId <= 0)
        ) {
          validationErrors.push(
            `Item ${index + 1}: Invalid variantId - must be a positive number`
          );
        }

        if (item.productId && typeof item.productId !== "string") {
          validationErrors.push(
            `Item ${index + 1}: Invalid productId - must be a string`
          );
        }

        if (!item.quantity || item.quantity <= 0) {
          validationErrors.push(
            `Item ${index + 1}: Quantity must be greater than 0`
          );
        }
      });

      if (validationErrors.length > 0) {
        throw new Error(`Validation errors: ${validationErrors.join(", ")}`);
      }

      const response = await fetch(
        `${API_ENDPOINTS.CHECKOUT_GUEST_CREATE_SESSION}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error creating guest checkout session"
        );
      }

      const data = await response.json();
      return { sessionUrl: data.sessionUrl };
    } catch (error) {
      console.error("Error creating guest checkout session:", error);
      throw error;
    }
  },

  /**
   * Verify checkout session
   */
  verifyCheckoutSession: async (
    sessionId: string
  ): Promise<CheckoutVerificationResult> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.CHECKOUT_VERIFY}/${sessionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error verifying checkout session"
        );
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error verifying checkout session:", error);
      throw error;
    }
  },

  /**
   * Create an order for an authenticated user (direct order creation)
   */
  createOrder: async (request: CreateOrderRequest): Promise<OrderResponse> => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_ENDPOINTS.ORDERS}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating order");
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  /**
   * Get all orders for the authenticated user
   */
  getUserOrders: async (): Promise<OrderResponse[]> => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_ENDPOINTS.ORDERS}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error fetching orders");
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching user orders:", error);
      throw error;
    }
  },

  /**
   * Get order details by order ID for the authenticated user
   */
  getOrderDetails: async (orderId: string): Promise<OrderDetailsResponse> => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_ENDPOINTS.ORDERS}/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error fetching order details");
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching order details:", error);
      throw error;
    }
  },

  /**
   * Get order details by order number for the authenticated user
   */
  getOrderDetailsByNumber: async (
    orderNumber: string
  ): Promise<OrderDetailsResponse> => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_ENDPOINTS.ORDERS}/number/${orderNumber}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error fetching order details");
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching order details by number:", error);
      throw error;
    }
  },

  /**
   * Request secure tracking access via email
   */
  requestTrackingAccess: async (
    request: OrderTrackingRequest
  ): Promise<OrderTrackingResponse> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.ORDERS}/track/request-access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error requesting tracking access"
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error requesting tracking access:", error);
      throw error;
    }
  },

  /**
   * Get orders by tracking token with pagination
   */
  getOrdersByToken: async (
    token: string,
    page: number = 0,
    size: number = 10
  ): Promise<OrderListResponse> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.ORDERS}/track/orders?token=${encodeURIComponent(
          token
        )}&page=${page}&size=${size}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error fetching orders");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching orders by token:", error);
      throw error;
    }
  },

  /**
   * Get specific order by tracking token and order ID
   */
  getOrderByTokenAndId: async (
    token: string,
    orderId: number
  ): Promise<OrderDetailsResponse> => {
    try {
      const response = await fetch(
        `${
          API_ENDPOINTS.ORDERS
        }/track/order/${orderId}?token=${encodeURIComponent(token)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error fetching order details");
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching order by token and ID:", error);
      throw error;
    }
  },

  /**
   * Get order by ID (authenticated endpoint)
   */
  getOrderById: async (orderId: string): Promise<OrderDetailsResponse> => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_ENDPOINTS.ORDERS}/id/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error fetching order");
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching order by ID:", error);
      throw error;
    }
  },

  /**
   * Get delivery notes for an order
   */
  getOrderDeliveryNotes: async (
    orderId: number,
    page: number = 0,
    size: number = 10
  ): Promise<DeliveryNotesResponse> => {
    try {
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? "/api/v1"
          : "http://localhost:8080/api/v1";
      const response = await fetch(
        `${baseUrl}/public/orders/${orderId}/delivery-notes?page=${page}&size=${size}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error fetching delivery notes");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching delivery notes:", error);
      throw error;
    }
  },

  /**
   * Get available countries for shipping
   * In a real implementation, this would be fetched from an API
   */
  getCountries: async (): Promise<string[]> => {
    // Mock implementation
    return [
      "United States",
      "Canada",
      "United Kingdom",
      "Australia",
      "Germany",
      "France",
      "Spain",
      "Italy",
      "Japan",
      "China",
      "India",
      "Brazil",
      "South Africa",
      "Nigeria",
      "Kenya",
      "Ghana",
      "Rwanda",
    ];
  },
};
