// Product service for fetching products from backend
import { API_ENDPOINTS } from "./api";

// Product DTOs matching the backend
export interface ProductWarehouseStockDTO {
  stockId: number;
  warehouseId: number;
  warehouseName: string;
  warehouseAddress: string;
  warehouseCity: string;
  warehouseState: string;
  warehouseCountry: string;
  warehouseContactNumber: string;
  warehouseEmail: string;
  quantity: number;
  lowStockThreshold: number;
  isInStock: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
  createdAt: string;
  updatedAt: string;
  variantId?: number;
  variantSku?: string;
  variantName?: string;
  isVariantBased: boolean;
  batches: any[];
  totalBatches: number;
  activeBatches: number;
  expiredBatches: number;
  recalledBatches: number;
  stockQuantity: number;
}

export interface ProductDTO {
  productId: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  basePrice: number;
  salePrice?: number;
  discountedPrice?: number;
  stockQuantity: number;
  categoryId: number;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  model?: string;
  slug: string;
  isActive: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  averageRating?: number;
  reviewCount?: number;
  reviews?: ReviewDTO[];
  createdAt: string;
  updatedAt: string;
  images: ProductImageDTO[];
  videos: ProductVideoDTO[];
  variants: ProductVariantDTO[];
  warehouseStock?: ProductWarehouseStockDTO[];
  totalWarehouseStock?: number;
  totalWarehouses?: number;
  fullDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  dimensionsCm?: string;
  weightKg?: number;
  material?: string;
  careInstructions?: string;
  warrantyInfo?: string;
  shippingInfo?: string;
  returnPolicy?: string;
  shopCapability?: "VISUALIZATION_ONLY" | "PICKUP_ORDERS" | "FULL_ECOMMERCE" | "HYBRID";
  // Shop information
  shopId?: string;
  shopName?: string;
  shopLogoUrl?: string;
  shopEmail?: string;
  shopPhone?: string;
  shopAddress?: string;
}

export interface ProductImageDTO {
  imageId: number;
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVideoDTO {
  videoId: number;
  url: string;
  title?: string;
  description?: string;
  sortOrder: number;
  durationSeconds?: number;
}

export interface WarehouseStockDTO {
  warehouseId: number;
  warehouseName: string;
  warehouseLocation: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  lastUpdated: string;
}

export interface ProductVariantDTO {
  variantId: number;
  variantSku: string;
  variantName?: string;
  variantBarcode?: string;
  price: number;
  salePrice?: number;
  costPrice?: number;
  isActive: boolean;
  isInStock?: boolean;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
  images: VariantImageDTO[];
  attributes: VariantAttributeDTO[];
  warehouseStocks?: WarehouseStockDTO[];

  // Discount information
  discount?: DiscountDTO;
  discountedPrice?: number;
  hasActiveDiscount?: boolean;

  // Computed properties for backward compatibility
  stockQuantity?: number; // Will be calculated from warehouseStocks
}

export interface VariantImageDTO {
  imageId: number;
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface VariantAttributeDTO {
  attributeValueId: number;
  attributeValue: string;
  attributeTypeId: number;
  attributeType: string;
}

// Backend Category DTO
export interface CategoryDto {
  id: number;
  name: string;
  description?: string;
  slug: string;
  url?: string;
}

// Backend Brand DTO
export interface BrandDto {
  brandId: string;
  brandName: string;
  description?: string;
  logoUrl?: string;
}

// Backend Primary Image DTO
export interface PrimaryImageDto {
  id: number;
  imageUrl: string;
  altText?: string;
  title?: string;
  isPrimary: boolean;
  sortOrder: number;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
}

// Backend Discount Info DTO
export interface DiscountDTO {
  discountId: string;
  name: string;
  description?: string;
  percentage: number;
  discountCode?: string;
  startDate: string;
  endDate: string;
  active: boolean;
  usageLimit?: number;
  usedCount?: number;
  discountType?: string;
  createdAt: string;
  updatedAt: string;
  valid: boolean;
}

export interface DiscountInfoDto {
  discountId: string;
  name: string;
  percentage: number;
  startDate: string;
  endDate: string;
  active: boolean;
  isValid: boolean;
  discountCode: string;
}

// For product grid display - updated to match backend response
export interface ManyProductsDto {
  productId: string;
  productName: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  discountedPrice?: number;
  stockQuantity: number;
  category: CategoryDto;
  brand: BrandDto;
  isBestSeller: boolean;
  isNew: boolean;
  isFeatured: boolean;
  discountInfo?: DiscountInfoDto;
  primaryImage?: PrimaryImageDto;
  averageRating?: number;
  reviewCount?: number;
  hasActiveDiscount: boolean;
  shopCapability?: "VISUALIZATION_ONLY" | "PICKUP_ORDERS" | "FULL_ECOMMERCE" | "HYBRID";
}

export interface ProductSearchDTO {
  // Text search
  name?: string;
  description?: string;
  sku?: string;

  // Price filters (backend expects BigDecimal, send as numbers)
  basePriceMin?: number;
  basePriceMax?: number;
  salePriceMin?: number;
  salePriceMax?: number;

  // Stock filters
  stockQuantityMin?: number;
  stockQuantityMax?: number;
  inStock?: boolean;

  // Category and brand filters
  categoryId?: number;
  categoryIds?: number[];
  categoryNames?: string[];
  brandId?: string;
  brandIds?: string[];
  brandNames?: string[];

  // Feature flags
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;

  // Rating filters
  averageRatingMin?: number;
  averageRatingMax?: number;

  // Discount filters
  hasDiscount?: boolean;
  isOnSale?: boolean;
  discountIds?: string[];

  // Pagination and sorting
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;

  // Variant attributes
  variantAttributes?: string[]; // e.g., ["Color:Red", "Size:LG"]

  // Shop scope
  shopId?: string;

  // Text search
  searchKeyword?: string;
}

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface AddToCartRequest {
  productId?: string;
  variantId?: number;
  quantity: number;
}

export interface ReviewDTO {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  productId: string;
  productName: string;
  rating: number;
  title: string;
  content: string;
  status: string;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  notHelpfulVotes: number;
  moderatorNotes?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Service for fetching products from backend
 */
export const ProductService = {
  /**
   * Get all products with pagination for product grid
   */
  getAllProducts: async (
    page = 0,
    size = 12,
    sortBy = "createdAt",
    sortDirection = "desc"
  ): Promise<Page<ManyProductsDto>> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.PRODUCTS}?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const products: Page<ManyProductsDto> = await response.json();
      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  /**
   * Search products with filters
   */
  searchProducts: async (
    searchDTO: ProductSearchDTO
  ): Promise<Page<ManyProductsDto>> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SEARCH_PRODUCTS}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchDTO),
      });

      if (!response.ok) {
        throw new Error(`Failed to search products: ${response.status}`);
      }

      const searchResults: Page<ManyProductsDto> = await response.json();
      return searchResults;
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  },

  /**
   * Get product by ID for detailed view
   */
  getProductById: async (productId: string): Promise<ProductDTO> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.PRODUCT_BY_ID(productId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.status}`);
      }

      const product: ProductDTO = await response.json();
      return product;
    } catch (error) {
      console.error("Error fetching product by ID:", error);
      throw error;
    }
  },

  /**
   * Get product by slug
   */
  getProductBySlug: async (slug: string): Promise<ProductDTO> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PRODUCT_BY_SLUG(slug)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.status}`);
      }

      const product: ProductDTO = await response.json();
      return product;
    } catch (error) {
      console.error("Error fetching product by slug:", error);
      throw error;
    }
  },

  /**
   * Check if product has variants
   */
  hasVariants: (product: ProductDTO): boolean => {
    return product.variants && product.variants.length > 0;
  },

  /**
   * Calculate total stock quantity for a variant from all warehouses
   * Falls back to using isInStock boolean when warehouseStocks is not available
   */
  getVariantTotalStock: (variant: ProductVariantDTO): number => {
    // If warehouseStocks is available, use it for accurate stock count
    if (variant.warehouseStocks && variant.warehouseStocks.length > 0) {
      return variant.warehouseStocks.reduce(
        (total, stock) => total + stock.stockQuantity,
        0
      );
    }

    // If stockQuantity is directly available (backward compatibility)
    if (variant.stockQuantity !== undefined) {
      return variant.stockQuantity;
    }

    // Fall back to isInStock boolean - return 1 if in stock, 0 if not
    // This is for customer-facing APIs that don't expose exact stock quantities
    if (variant.isInStock !== undefined) {
      return variant.isInStock ? 1 : 0;
    }

    // Default to 0 if no stock information is available
    return 0;
  },

  /**
   * Check if variant is in stock (has stock in any warehouse)
   */
  isVariantInStock: (variant: ProductVariantDTO): boolean => {
    // If warehouseStocks is available, check if total stock > 0
    if (variant.warehouseStocks && variant.warehouseStocks.length > 0) {
      return ProductService.getVariantTotalStock(variant) > 0;
    }

    // If stockQuantity is directly available
    if (variant.stockQuantity !== undefined) {
      return variant.stockQuantity > 0;
    }

    // Fall back to isInStock boolean
    if (variant.isInStock !== undefined) {
      return variant.isInStock;
    }

    // Default to false if no stock information is available
    return false;
  },

  /**
   * Check if variant is low stock (any warehouse is low stock)
   */
  isVariantLowStock: (variant: ProductVariantDTO): boolean => {
    if (!variant.warehouseStocks || variant.warehouseStocks.length === 0) {
      return false;
    }
    return variant.warehouseStocks.some((stock) => stock.isLowStock);
  },

  /**
   * Add item to cart (this would typically go to a cart service)
   */
  addToCart: async (request: AddToCartRequest): Promise<any> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CART}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add authentication header if user is logged in
          ...(localStorage.getItem("authToken") && {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          }),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to add to cart: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  },

  /**
   * Check if a product has any variants with active discounts
   */
  hasVariantDiscounts: (product: ProductDTO): boolean => {
    return (
      product.variants?.some((variant) => variant.hasActiveDiscount) || false
    );
  },

  /**
   * Get the maximum discount percentage among all variants
   */
  getMaxVariantDiscount: (product: ProductDTO): number => {
    if (!product.variants) return 0;

    const discounts = product.variants
      .filter((variant) => variant.hasActiveDiscount && variant.discount)
      .map((variant) => variant.discount!.percentage);

    return discounts.length > 0 ? Math.max(...discounts) : 0;
  },

  /**
   * Check if a discount is currently active based on its date range
   */
  isDiscountActive: (discountInfo: any): boolean => {
    if (!discountInfo || !discountInfo.active || !discountInfo.percentage) {
      return false;
    }

    const now = new Date();
    const startDate = discountInfo.startDate
      ? new Date(discountInfo.startDate)
      : null;
    const endDate = discountInfo.endDate
      ? new Date(discountInfo.endDate)
      : null;

    // If start date exists and is in the future, discount is not active yet
    if (startDate && startDate > now) {
      return false;
    }

    // If end date exists and is in the past, discount has expired
    if (endDate && endDate < now) {
      return false;
    }

    return true;
  },

  /**
   * Convert ManyProductsDto to format expected by ProductCard component
   */
  convertToProductCardFormat: (product: ManyProductsDto) => {
    // Check if discount is currently active
    const hasActiveDiscount = ProductService.isDiscountActive(
      product.discountInfo
    );

    // Calculate discount percentage only if discount is active
    const discountPercentage =
      hasActiveDiscount && product.discountInfo?.percentage
        ? Math.round(Number(product.discountInfo.percentage))
        : 0;

    // Calculate discounted price only if discount is active
    const discountedPrice =
      hasActiveDiscount && product.discountInfo?.percentage
        ? product.price * (1 - Number(product.discountInfo.percentage) / 100)
        : product.discountedPrice || undefined;

    return {
      id: product.productId,
      name: product.productName,
      price: product.price,
      originalPrice: product.compareAtPrice || undefined,
      rating: product.averageRating || 0,
      reviewCount: product.reviewCount || 0,
      image: product.primaryImage?.imageUrl || "/placeholder-product.jpg",
      discount: discountPercentage > 0 ? discountPercentage : undefined,
      isNew: product.isNew === true,
      isBestseller: product.isBestSeller === true,
      discountedPrice: discountedPrice,
      category: product.category?.name || undefined,
      shopCapability: product.shopCapability,
      brand: product.brand?.brandName || undefined,
      hasActiveDiscount: hasActiveDiscount,
      discountName: product.discountInfo?.name || undefined,
      discountEndDate: product.discountInfo?.endDate || undefined,
      shortDescription: product.shortDescription || undefined,
      isFeatured: product.isFeatured === true,
      hasVariantDiscounts: false, // This will be updated when we have product details
      maxVariantDiscount: 0, // This will be updated when we have product details
    };
  },

  /**
   * Get product reviews with pagination
   */
  getProductReviews: async (
    productId: string,
    page: number = 0,
    size: number = 10,
    sortBy: string = "createdAt",
    sortDirection: string = "desc"
  ): Promise<{
    data: ReviewDTO[];
    pagination: {
      page: number;
      size: number;
      totalElements: number;
      totalPages: number;
    };
  }> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDirection,
      });

      const response = await fetch(
        `${API_ENDPOINTS.PRODUCT_REVIEWS(productId)}?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch product reviews: ${response.status}`);
      }

      const result = await response.json();
      return {
        data: result.data || [],
        pagination: result.pagination || {
          page: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      throw error;
    }
  },

  /**
   * Get featured products for customers
   */
  getFeaturedProducts: async (
    page = 0,
    size = 12
  ): Promise<Page<ManyProductsDto>> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.FEATURED_PRODUCTS}?page=${page}&size=${size}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch featured products: ${response.status}`
        );
      }

      const products: Page<ManyProductsDto> = await response.json();
      return products;
    } catch (error) {
      console.error("Error fetching featured products:", error);
      throw error;
    }
  },

  /**
   * Get bestseller products for customers
   */
  getBestsellerProducts: async (
    page = 0,
    size = 12
  ): Promise<Page<ManyProductsDto>> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.BESTSELLER_PRODUCTS}?page=${page}&size=${size}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch bestseller products: ${response.status}`
        );
      }

      const products: Page<ManyProductsDto> = await response.json();
      return products;
    } catch (error) {
      console.error("Error fetching bestseller products:", error);
      throw error;
    }
  },

  /**
   * Get new arrival products for customers
   */
  getNewArrivalProducts: async (
    page = 0,
    size = 12
  ): Promise<Page<ManyProductsDto>> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.NEW_ARRIVAL_PRODUCTS}?page=${page}&size=${size}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch new arrival products: ${response.status}`
        );
      }

      const products: Page<ManyProductsDto> = await response.json();
      return products;
    } catch (error) {
      console.error("Error fetching new arrival products:", error);
      throw error;
    }
  },

  /**
   * Get products by category for customers
   */
  getProductsByCategory: async (
    categoryId: string,
    page = 0,
    size = 12,
    sortBy = "createdAt",
    sortDirection = "desc"
  ): Promise<Page<ManyProductsDto>> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.PRODUCTS_BY_CATEGORY(
          categoryId
        )}?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch products by category: ${response.status}`
        );
      }

      const products: Page<ManyProductsDto> = await response.json();
      return products;
    } catch (error) {
      console.error("Error fetching products by category:", error);
      throw error;
    }
  },

  /**
   * Get products by brand for customers
   */
  getProductsByBrand: async (
    brandId: string,
    page = 0,
    size = 12,
    sortBy = "createdAt",
    sortDirection = "desc"
  ): Promise<Page<ManyProductsDto>> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.PRODUCTS_BY_BRAND(
          brandId
        )}?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch products by brand: ${response.status}`
        );
      }

      const products: Page<ManyProductsDto> = await response.json();
      return products;
    } catch (error) {
      console.error("Error fetching products by brand:", error);
      throw error;
    }
  },
};

export default ProductService;
