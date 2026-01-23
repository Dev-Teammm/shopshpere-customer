import { API_BASE_URL, getAuthHeaders } from "../api";

export interface ExpectedRefund {
  paymentMethod: string;
  monetaryRefund: number;
  pointsRefund: number;
  pointsRefundValue: number;
  totalRefundValue: number;
  isFullReturn: boolean;
  itemsRefund: number;
  shippingRefund: number;
  refundDescription: string;
}

export interface ReturnRequest {
  id: number;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: ReturnStatus;
  reason: string;
  description?: string;
  returnItems: ReturnItem[];
  submittedAt: string;
  processedAt?: string;
  decisionAt?: string;
  decisionNotes?: string;
  refundAmount?: number;
  refundMethod?: string;
  returnAppeal?: ReturnAppeal;
  canBeAppealed?: boolean;
  daysUntilExpiry?: number;
  eligibleForReturn?: boolean;
  returnMedia?: MediaAttachment[];
  expectedRefund?: ExpectedRefund;
}

export interface ReturnItem {
  orderItemId: number;
  returnQuantity: number;
  itemReason: string;
  productId: string;
  variantId?: number;
  productName: string;
  variantName?: string;
  maxQuantity?: number;
  productImage?: string;
  unitPrice?: number;
  totalPrice?: number;
  condition?: string;
}

export interface ReturnAppeal {
  id: number;
  returnRequestId: number;
  reason: string;
  description: string;
  status: AppealStatus;
  submittedAt: string;
  processedAt?: string;
  decisionAt?: string;
  decisionNotes?: string;
  mediaAttachments?: MediaAttachment[];
}

export interface MediaAttachment {
  id: number;
  returnRequestId?: number;
  fileUrl: string;
  publicId?: string;
  fileType: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  uploadedAt: string;
  createdAt?: string;
  updatedAt?: string;
  image?: boolean;
  video?: boolean;
  fileExtension?: string;
  fileName?: string;
}

export enum ReturnStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  DENIED = "DENIED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum AppealStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  DENIED = "DENIED",
}

// Return Service
export class ReturnService {
  private static baseUrl = `${API_BASE_URL}/returns`;

  /**
   * Get return request by order ID (DEPRECATED - returns single request)
   * Use getReturnRequestsByOrderId instead for multiple returns
   */
  static async getReturnByOrderId(
    orderId: number,
  ): Promise<ReturnRequest | null> {
    try {
      const response = await fetch(`${this.baseUrl}/order/${orderId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.status === 404) {
        return null; // No return request found for this order
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch return information",
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching return by order ID:", error);
      throw error;
    }
  }

  /**
   * Get all return requests by order ID for authenticated users
   */
  static async getReturnRequestsByOrderId(
    orderId: number,
  ): Promise<ReturnRequest[]> {
    try {
      const response = await fetch(`${this.baseUrl}/order/${orderId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch return requests");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching return requests by order ID:", error);
      throw error;
    }
  }

  /**
   * Get all return requests by shop order ID for authenticated users
   */
  static async getReturnRequestsByShopOrderId(
    shopOrderId: number,
  ): Promise<ReturnRequest[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/shop-order/${shopOrderId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch return requests");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching return requests by shop order ID:", error);
      throw error;
    }
  }

  /**
   * Get all return requests by order number and tracking token (for guest users)
   */
  static async getReturnRequestsByOrderNumberAndToken(
    orderNumber: string,
    token: string,
  ): Promise<ReturnRequest[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/order/guest?orderNumber=${encodeURIComponent(
          orderNumber,
        )}&token=${encodeURIComponent(token)}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch return requests");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching return requests for guest order:", error);
      throw error;
    }
  }

  /**
   * Get return request by return ID
   */
  static async getReturnById(
    returnId: number,
    token?: string,
  ): Promise<ReturnRequest> {
    try {
      const url = token
        ? `${this.baseUrl}/${returnId}?token=${encodeURIComponent(token)}`
        : `${this.baseUrl}/${returnId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch return information",
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching return by ID:", error);
      throw error;
    }
  }

  /**
   * Get return request by order number
   */
  static async getReturnByOrderNumber(
    orderNumber: string,
    token?: string,
  ): Promise<ReturnRequest | null> {
    try {
      const url = token
        ? `${this.baseUrl}/order-number/${orderNumber}?token=${encodeURIComponent(token)}`
        : `${this.baseUrl}/order-number/${orderNumber}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.status === 404) {
        return null; // No return request found for this order
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch return information",
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching return by order number:", error);
      throw error;
    }
  }

  /**
   * Submit a return request for authenticated users
   */
  static async submitReturnRequest(returnData: any): Promise<ReturnRequest> {
    try {
      const response = await fetch(`${this.baseUrl}/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(returnData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit return request");
      }

      return await response.json();
    } catch (error) {
      console.error("Error submitting return request:", error);
      throw error;
    }
  }

  /**
   * Submit a return request using tokenized access (for guest users)
   */
  static async submitTokenizedReturnRequest(
    returnData: FormData,
  ): Promise<ReturnRequest> {
    try {
      const response = await fetch(`${this.baseUrl}/submit/tokenized`, {
        method: "POST",
        body: returnData, // FormData for multipart/form-data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit return request");
      }

      return await response.json();
    } catch (error) {
      console.error("Error submitting tokenized return request:", error);
      throw error;
    }
  }

  /**
   * Submit an appeal for a denied return (authenticated users)
   */
  static async submitAppeal(appealData: FormData | any): Promise<ReturnAppeal> {
    try {
      const isFormData = appealData instanceof FormData;

      const headers = isFormData
        ? {
            Authorization: `Bearer ${
              typeof window !== "undefined"
                ? localStorage.getItem("authToken")
                : null
            }`,
          }
        : getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/appeals/submit`, {
        method: "POST",
        headers,
        body: isFormData ? appealData : JSON.stringify(appealData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit appeal");
      }

      return await response.json();
    } catch (error) {
      console.error("Error submitting appeal:", error);
      throw error;
    }
  }

  /**
   * Submit an appeal using tracking token (for guest users)
   */
  static async submitTokenizedAppeal(
    appealData: FormData,
  ): Promise<ReturnAppeal> {
    try {
      const response = await fetch(`${API_BASE_URL}/appeals/submit/tokenized`, {
        method: "POST",
        body: appealData, // FormData for multipart/form-data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit appeal");
      }

      return await response.json();
    } catch (error) {
      console.error("Error submitting tokenized appeal:", error);
      throw error;
    }
  }

  /**
   * Get appeal by return request ID
   */
  static async getAppealByReturnId(
    returnId: number,
  ): Promise<ReturnAppeal | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/appeals/return/${returnId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        },
      );

      if (response.status === 404) {
        return null; // No appeal found for this return
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch appeal information",
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching appeal:", error);
      throw error;
    }
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  /**
   * Get status color class
   */
  static getStatusColor(status: ReturnStatus | AppealStatus): string {
    switch (status) {
      case ReturnStatus.PENDING:
      case AppealStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case ReturnStatus.APPROVED:
      case AppealStatus.APPROVED:
        return "bg-green-100 text-green-800";
      case ReturnStatus.DENIED:
      case AppealStatus.DENIED:
        return "bg-red-100 text-red-800";
      case ReturnStatus.PROCESSING:
        return "bg-blue-100 text-blue-800";
      case ReturnStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case ReturnStatus.CANCELLED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  /**
   * Get status icon
   */
  static getStatusIcon(status: ReturnStatus | AppealStatus): string {
    switch (status) {
      case ReturnStatus.PENDING:
      case AppealStatus.PENDING:
        return "⏳";
      case ReturnStatus.APPROVED:
      case AppealStatus.APPROVED:
        return "✅";
      case ReturnStatus.DENIED:
      case AppealStatus.DENIED:
        return "❌";
      case ReturnStatus.PROCESSING:
        return "🔄";
      case ReturnStatus.COMPLETED:
        return "✅";
      case ReturnStatus.CANCELLED:
        return "🚫";
      default:
        return "❓";
    }
  }
}
