export interface OrderItem {
  id: string | number;
  productId?: string;
  variantId?: string;
  product: {
    id?: string;
    productId?: string;
    name: string;
    description?: string;
    price?: number;
    images?: string[];
  };
  variant?: {
    id?: string | number;
    productId?: string;
    name: string;
    price?: number;
    images?: string[];
  };
  quantity: number;
  price: number;
  totalPrice: number;

  // Return eligibility fields
  maxReturnDays: number;
  deliveredAt?: string;
  returnEligible: boolean;
  daysRemainingForReturn: number;
}

export interface OrderDetails {
  id: string | number;
  userId?: string;
  orderNumber: string;
  shopId?: string;
  shopName?: string;
  pickupToken?: string;
  pickupTokenUsed?: boolean;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: {
    id?: string;
    street: string;
    city: string;
    state: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  billingAddress?: any;
  customerInfo?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    phoneNumber?: string;
  };
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  transaction?: any;
}

export interface ReturnItem {
  orderItemId: string;
  returnQuantity: number;
  itemReason: string;
}

export interface SubmitReturnRequest {
  customerId: string | null;
  orderId: string;
  reason: string;
  returnItems: ReturnItem[];
  trackingToken?: string;
}

export interface SubmitGuestReturnRequest {
  orderNumber: string;
  pickupToken: string;
  reason: string;
  returnItems: ReturnItem[];
}

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

export interface ReturnRequestResponse {
  id: string;
  orderId: string;
  customerId?: string;
  reason: string;
  status: string;
  submittedAt: string;
  decisionAt?: string;
  decisionNotes?: string;
  returnItems: {
    id: string;
    orderItemId: string;
    quantity: number;
    reason: string;
  }[];
  returnMedia?: {
    id: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
  }[];
  expectedRefund?: ExpectedRefund;
}
