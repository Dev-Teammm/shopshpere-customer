// Types based on backend DTOs
export interface CartItemResponse {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number; // Current price with discount applied
  originalPrice: number; // Original price before discount
  previousPrice: number | null;
  url: string;
  quantity: number;
  stock: number;
  totalPrice: number;
  weight?: number; 
  averageRating: number;
  ratingCount: number;

  // Discount information
  discountPercentage?: number;
  discountName?: string;
  discountAmount?: number; // Amount saved due to discount
  hasDiscount?: boolean;
  
  // Shop capability
  shopCapability?: "VISUALIZATION_ONLY" | "PICKUP_ORDERS" | "FULL_ECOMMERCE" | "HYBRID";
}

export interface CartResponse {
  cartId: string;
  userId: string;
  items: CartItemResponse[];
  totalItems: number;
  subtotal: number;
  totalPages: number;
  currentPage: number;
}

export interface CartItemRequest {
  productId?: string;
  variantId?: string;
  quantity: number;
}

// Interface for localStorage cart items (simplified)
interface LocalStorageCartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
}

// Interface for backend cart products request
interface CartProductsRequest {
  items: {
    productId: string;
    variantId?: number;
    quantity: number;
    itemId: string;
  }[];
}

// Interface for backend cart products response
interface CartProductsResponse {
  items: {
    itemId: string;
    productId: string;
    variantId?: number;
    productName: string;
    productDescription: string;
    price: number;
    previousPrice?: number;
    productImage: string;
    quantity: number;
    availableStock: number;
    totalPrice: number;
    averageRating?: number;
    reviewCount?: number;
    variantSku?: string;
    variantAttributes?: {
      attributeTypeName: string;
      attributeValue: string;
    }[];
    // Discount information
    discountPercentage?: number;
    discountName?: string;
    discountAmount?: number;
    hasDiscount?: boolean;
    // Shop capability
    shopCapability?: "VISUALIZATION_ONLY" | "PICKUP_ORDERS" | "FULL_ECOMMERCE" | "HYBRID";
  }[];
  subtotal: number;
  totalItems: number;
}

// Base API URL
import { API_ENDPOINTS } from "./api";

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
};

export interface MessageResponse {
  message: string;
  success: boolean;
}

/**
 * Service to interact with the Cart API
 */
export const CartService = {
  /**
   * Get the user's cart
   */
  getCart: async (page = 0, size = 10): Promise<CartResponse> => {
    const token = getAuthToken();

    if (!token) {
      // No token = guest user, use localStorage
      return getCartFromBackend();
    }

    try {
      const response = await fetch(
        `${API_ENDPOINTS.CART_VIEW}?page=${page}&size=${size}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token expired or invalid - clear it and treat as guest
          localStorage.removeItem("authToken");
          console.warn("Authentication token expired, treating as guest user");
          return getCartFromBackend();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform backend response to match frontend interface
      const backendData = data.data;
      return {
        cartId: backendData.cartId?.toString() || "",
        userId: backendData.userId?.toString() || "",
        items:
          backendData.items?.map((item: any) => ({
            id: item.id?.toString() || "",
            productId: item.productId?.toString() || "",
            variantId: item.variantId?.toString() || "",
            name: item.productName || item.name || "",
            price: item.price || 0,
            previousPrice: item.previousPrice || null,
            url: item.productImage || item.url || "",
            quantity: item.quantity || 0,
            stock: item.availableStock || item.stock || 0,
            totalPrice: item.totalPrice || 0,
            averageRating: item.averageRating || 0,
            ratingCount: item.ratingCount || 0,
            shopCapability: item.shopCapability || undefined,
          })) || [],
        totalItems: backendData.totalItems || 0,
        subtotal: backendData.subtotal || backendData.total || 0,
        totalPages: data.pagination?.totalPages || 1,
        currentPage: data.pagination?.page || 0,
      };
    } catch (error) {
      console.error("Error fetching cart:", error);
      // For authenticated users, don't fallback to localStorage on network errors
      // Return empty cart instead
      return {
        cartId: "error-cart",
        userId: "error-user",
        items: [],
        totalItems: 0,
        subtotal: 0,
        totalPages: 1,
        currentPage: 0,
      };
    }
  },

  /**
   * Add an item to the cart
   */
  addItemToCart: async (request: CartItemRequest): Promise<CartResponse> => {
    const token = getAuthToken();
    if (!token) {
      // For guest users, validate product capability before adding to localStorage
      // Fetch product data to check shop capability
      try {
        const productId = request.productId || request.variantId || "";
        if (productId) {
          const productResponse = await fetch(`${API_ENDPOINTS.PRODUCT_BY_ID(productId)}`);
          if (productResponse.ok) {
            const product = await productResponse.json();
            if (product.shopCapability === "VISUALIZATION_ONLY") {
              throw new Error(
                "This product is from a shop that only displays products and does not accept orders. Please contact the shop directly for inquiries."
              );
            }
          }
        }
      } catch (error: any) {
        // Re-throw validation errors
        if (error.message && error.message.includes("VISUALIZATION_ONLY")) {
          throw error;
        }
        // For other errors (network, etc.), log but continue (backend will validate)
        console.warn("Could not validate product capability for guest user:", error);
      }
      
      addToLocalStorageCart(
        request.productId || request.variantId || "",
        request.variantId,
        request.quantity
      );
      return await getCartFromBackend();
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.CART_ADD}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("authToken");
          console.warn("Authentication token expired, treating as guest user");
          addToLocalStorageCart(
            request.productId || request.variantId || "",
            request.variantId,
            request.quantity
          );
          return await getCartFromBackend();
        }
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      window.dispatchEvent(new CustomEvent("cartUpdated"));

      return data.data;
    } catch (error) {
      console.error("Error adding item to cart:", error);
      return {
        cartId: "error-cart",
        userId: "error-user",
        items: [],
        totalItems: 0,
        subtotal: 0,
        totalPages: 1,
        currentPage: 0,
      };
    }
  },

  /**
   * Update an item in the cart
   */
  updateCartItem: async (
    itemId: string,
    request: CartItemRequest
  ): Promise<CartResponse> => {
    const token = getAuthToken();

    if (!token) {
      // No token = guest user, use localStorage
      return await updateLocalStorageCartItem(itemId, request.quantity);
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.CART_UPDATE}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartItemId: parseInt(itemId),
          quantity: request.quantity,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token expired or invalid - clear it and treat as guest
          localStorage.removeItem("authToken");
          console.warn("Authentication token expired, treating as guest user");
          return updateLocalStorageCartItem(itemId, request.quantity);
        }
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      // Trigger cart update event
      window.dispatchEvent(new CustomEvent("cartUpdated"));

      // Return updated cart by fetching it again
      return await CartService.getCart();
    } catch (error) {
      console.error("Error updating cart item:", error);
      // For authenticated users, don't fallback to localStorage on network errors
      // Return empty cart instead
      return {
        cartId: "error-cart",
        userId: "error-user",
        items: [],
        totalItems: 0,
        subtotal: 0,
        totalPages: 1,
        currentPage: 0,
      };
    }
  },

  /**
   * Remove an item from the cart
   */
  removeItemFromCart: async (itemId: string): Promise<CartResponse> => {
    const token = getAuthToken();

    if (!token) {
      // No token = guest user, use localStorage
      return await removeFromLocalStorageCart(itemId);
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.CART_REMOVE(itemId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token expired or invalid - clear it and treat as guest
          localStorage.removeItem("authToken");
          console.warn("Authentication token expired, treating as guest user");
          return removeFromLocalStorageCart(itemId);
        }
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      // Trigger cart update event
      window.dispatchEvent(new CustomEvent("cartUpdated"));

      // Return updated cart by fetching it again
      return await CartService.getCart();
    } catch (error) {
      console.error("Error removing item from cart:", error);
      // For authenticated users, don't fallback to localStorage on network errors
      // Return empty cart instead
      return {
        cartId: "error-cart",
        userId: "error-user",
        items: [],
        totalItems: 0,
        subtotal: 0,
        totalPages: 1,
        currentPage: 0,
      };
    }
  },

  /**
   * Clear the cart
   */
  clearCart: async (): Promise<MessageResponse> => {
    const token = getAuthToken();

    if (!token) {
      // No token = guest user, use localStorage
      localStorage.setItem("cart", JSON.stringify([]));
      return {
        message: "Cart cleared successfully (local only)",
        success: true,
      };
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.CART_CLEAR}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token expired or invalid - clear it and treat as guest
          localStorage.removeItem("authToken");
          console.warn("Authentication token expired, treating as guest user");
          localStorage.setItem("cart", JSON.stringify([]));
          return {
            message: "Cart cleared successfully (local only)",
            success: true,
          };
        }
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      // Trigger cart update event
      window.dispatchEvent(new CustomEvent("cartUpdated"));

      return data;
    } catch (error) {
      console.error("Error clearing cart:", error);
      // For authenticated users, don't fallback to localStorage on network errors
      // Return error response instead
      return {
        message: "Failed to clear cart. Please try again.",
        success: false,
      };
    }
  },

  /**
   * Get the number of distinct items in the cart (not total quantity)
   */
  getCartItemsCount: async (): Promise<number> => {
    const token = getAuthToken();

    if (!token) {
      // No token = guest user, use localStorage
      const cartItems = localStorage.getItem("cart");
      if (!cartItems) return 0;
      const cart = JSON.parse(cartItems) as LocalStorageCartItem[];
      // Return count of distinct items (not total quantity)
      return cart.length;
    }

    try {
      // For authenticated users, get the full cart and count distinct items
      const cart = await CartService.getCart();
      // Return the count of distinct items in the cart, not total quantity
      return cart.items?.length || 0;
    } catch (error) {
      console.error("Error getting cart item count:", error);
      // For authenticated users, don't fallback to localStorage on network errors
      // Return 0 instead
      return 0;
    }
  },

  /**
   * Check if a product or variant is in the cart
   */
  isInCart: async (productId: string, variantId?: string): Promise<boolean> => {
    const token = getAuthToken();

    if (!token) {
      // Check localStorage
      const cartItems = localStorage.getItem("cart");
      if (!cartItems) return false;

      const cart = JSON.parse(cartItems) as LocalStorageCartItem[];
      return cart.some(
        (item) => item.productId === productId && item.variantId === variantId
      );
    }

    try {
      const cart = await CartService.getCart();
      return cart.items.some(
        (item) => item.productId === productId && item.variantId === variantId
      );
    } catch (error) {
      console.error("Error checking if item is in cart:", error);
      // For authenticated users, don't fallback to localStorage on network errors
      // Return false instead
      return false;
    }
  },

  /**
   * Check if a specific variant is in the cart
   */
  isVariantInCart: async (variantId: string): Promise<boolean> => {
    const token = getAuthToken();

    if (!token) {
      // Check localStorage
      const cartItems = localStorage.getItem("cart");
      if (!cartItems) return false;

      const cart = JSON.parse(cartItems) as LocalStorageCartItem[];
      return cart.some((item) => item.variantId === variantId);
    }

    try {
      const cart = await CartService.getCart();
      return cart.items.some((item) => item.variantId === variantId);
    } catch (error) {
      console.error("Error checking if variant is in cart:", error);
      return false;
    }
  },

  /**
   * Get cart items for a specific product (including variants)
   */
  getProductCartItems: async (productId: string): Promise<CartItemResponse[]> => {
    try {
      const cart = await CartService.getCart();
      return cart.items.filter((item) => item.productId === productId);
    } catch (error) {
      console.error("Error getting product cart items:", error);
      return [];
    }
  },

  /**
   * Migrate localStorage cart to database when user logs in
   * This should be called after successful authentication
   */
  migrateCartToDatabase: async (): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      console.warn("No authentication token found for cart migration");
      return;
    }

    try {
      const cartItems = localStorage.getItem("cart");
      if (!cartItems) {
        console.log("No localStorage cart items to migrate");
        return;
      }

      const localCart = JSON.parse(cartItems) as LocalStorageCartItem[];
      if (localCart.length === 0) {
        console.log("Empty localStorage cart, nothing to migrate");
        return;
      }

      console.log(
        `Migrating ${localCart.length} items from localStorage to database`
      );

      // Add each localStorage item to the database cart
      for (const item of localCart) {
        try {
          await CartService.addItemToCart({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          });
        } catch (error) {
          console.warn(
            `Failed to migrate item ${item.productId} to database:`,
            error
          );
          // Continue with other items even if one fails
        }
      }

      // Clear localStorage cart after successful migration
      localStorage.removeItem("cart");
      console.log("Cart migration completed, localStorage cart cleared");
    } catch (error) {
      console.error("Error migrating cart to database:", error);
    }
  },
};

// Helper function to get cart from backend using localStorage data
async function getCartFromBackend(): Promise<CartResponse> {
  try {
    const cartItems = localStorage.getItem("cart");
    if (!cartItems) {
      return {
        cartId: "local-cart",
        userId: "local-user",
        items: [],
        totalItems: 0,
        subtotal: 0,
        totalPages: 1,
        currentPage: 0,
      };
    }

    const localCart = JSON.parse(cartItems) as LocalStorageCartItem[];
    if (localCart.length === 0) {
      return {
        cartId: "local-cart",
        userId: "local-user",
        items: [],
        totalItems: 0,
        subtotal: 0,
        totalPages: 1,
        currentPage: 0,
      };
    }

    // Prepare request for backend
    const request: CartProductsRequest = {
      items: localCart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ? parseInt(item.variantId) : undefined,
        quantity: item.quantity,
        itemId: item.id,
      })),
    };

    // Fetch product details from backend
    const response = await fetch(API_ENDPOINTS.CART_PRODUCTS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const cartData = data.data as CartProductsResponse;

    // Transform backend response to match frontend interface
    return {
      cartId: "local-cart",
      userId: "local-user",
      items: cartData.items.map((item) => {
        const originalPrice = item.previousPrice || item.price;
        const currentPrice = item.price;
        // Use backend discount info if available, otherwise calculate
        const hasDiscount = item.hasDiscount ?? (item.previousPrice && item.previousPrice > item.price);
        const discountAmount = item.discountAmount ?? (hasDiscount ? (originalPrice - currentPrice) * item.quantity : 0);
        const discountPercentage = item.discountPercentage 
          ? Number(item.discountPercentage) 
          : (hasDiscount ? ((originalPrice - currentPrice) / originalPrice) * 100 : 0);
        const discountName = item.discountName || (hasDiscount ? "Discount" : undefined);
        
        return {
          id: item.itemId,
          productId: item.productId.toString(),
          variantId: item.variantId?.toString(),
          name: item.productName,
          price: currentPrice,
          originalPrice: originalPrice,
          previousPrice: item.previousPrice || null,
          url: item.productImage || "",
          quantity: item.quantity,
          stock: item.availableStock,
          totalPrice: item.totalPrice,
          averageRating: item.averageRating || 0,
          ratingCount: item.reviewCount || 0,
          // Discount information
          hasDiscount: hasDiscount || false,
          discountAmount: discountAmount,
          discountPercentage: discountPercentage,
          discountName: discountName,
          // Shop capability
          shopCapability: item.shopCapability || undefined,
        };
      }),
      totalItems: cartData.totalItems,
      subtotal: cartData.subtotal,
      totalPages: 1,
      currentPage: 0,
    };
  } catch (error) {
    console.error("Error getting cart from backend:", error);
    // Fallback to empty cart
    return {
      cartId: "local-cart",
      userId: "local-user",
      items: [],
      totalItems: 0,
      subtotal: 0,
      totalPages: 1,
      currentPage: 0,
    };
  }
}

// Helper functions for localStorage implementation (no longer used, keep for compatibility)

function addToLocalStorageCart(
  productId: string,
  variantId: string | undefined,
  quantity: number
): void {
  try {
    const cartItems = localStorage.getItem("cart");
    const cart = cartItems
      ? (JSON.parse(cartItems) as LocalStorageCartItem[])
      : [];

    // Check if item already exists
    const existingItemIndex = cart.findIndex(
      (item) => item.productId === productId && item.variantId === variantId
    );

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      cart[existingItemIndex].quantity += quantity;
    } else {
      // Create new cart item with minimal data
      const newItem: LocalStorageCartItem = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId,
        variantId,
        quantity,
      };

      cart.push(newItem);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("cartUpdated"));
  } catch (error) {
    console.error("Error adding to localStorage cart:", error);
  }
}

async function updateLocalStorageCartItem(
  itemId: string,
  quantity: number
): Promise<CartResponse> {
  try {
    const cartItems = localStorage.getItem("cart");
    const cart = cartItems
      ? (JSON.parse(cartItems) as LocalStorageCartItem[])
      : [];

    // Find and update the item
    const itemIndex = cart.findIndex((item) => item.id === itemId);
    if (itemIndex !== -1) {
      cart[itemIndex].quantity = quantity;
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    }

    return getCartFromBackend();
  } catch (error) {
    console.error("Error updating localStorage cart item:", error);
    return getCartFromBackend();
  }
}

async function removeFromLocalStorageCart(
  itemId: string
): Promise<CartResponse> {
  try {
    const cartItems = localStorage.getItem("cart");
    const cart = cartItems
      ? (JSON.parse(cartItems) as LocalStorageCartItem[])
      : [];

    const filteredCart = cart.filter((item) => item.id !== itemId);

    localStorage.setItem("cart", JSON.stringify(filteredCart));
    window.dispatchEvent(new CustomEvent("cartUpdated"));

    return getCartFromBackend();
  } catch (error) {
    console.error("Error removing from localStorage cart:", error);
    return getCartFromBackend();
  }
}
