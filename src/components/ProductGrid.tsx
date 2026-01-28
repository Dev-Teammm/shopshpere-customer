import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutGrid,
  Filter,
  List,
  Star,
  ShoppingCart,
  Check,
  AlertCircle,
  Loader2,
  Heart,
  Eye,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import VariantSelectionModal from "@/components/VariantSelectionModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ProductService,
  ManyProductsDto,
  Page,
  ProductSearchDTO,
  ProductDTO,
} from "@/lib/productService";
import { CartService, CartItemRequest } from "@/lib/cartService";
import { WishlistService, AddToWishlistRequest } from "@/lib/wishlistService";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/lib/store/hooks";
import { filterMappingService } from "@/lib/filterMappingService";
import { formatPrice, formatDiscountedPrice } from "@/lib/utils/priceFormatter";
import { triggerCartUpdate } from "@/lib/utils/cartUtils";
import Link from "next/link";

interface FilterState {
  priceRange: number[];
  categories: string[];
  brands: string[];
  attributes: Record<string, string[]>;
  selectedDiscounts: string[];
  rating: number | null;
  inStock: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  searchTerm: string | null;
}

interface ProductGridProps {
  filters: FilterState;
  currentPage: number;
  productsPerPage: number;
  showFilters: boolean;
  onToggleFilters: () => void;
  onClearAllFilters: () => void;
  onPageChange?: (page: number) => void;
}

const ProductGrid = ({
  filters,
  currentPage,
  productsPerPage,
  showFilters,
  onToggleFilters,
  onClearAllFilters,
  onPageChange,
}: ProductGridProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Page<ManyProductsDto> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(
    null
  );
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [wishlistLoadingStates, setWishlistLoadingStates] = useState<
    Record<string, boolean>
  >({});
  const [productsWithVariants, setProductsWithVariants] = useState<Set<string>>(
    new Set()
  );
  const { toast } = useToast();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Load cart and wishlist items on mount
  useEffect(() => {
    checkCartStatus();
    checkWishlistStatus();
  }, []);

  const checkCartStatus = async () => {
    try {
      const cart = await CartService.getCart();
      const productIds = cart.items.map((item) => item.productId);
      setCartItems(productIds);
    } catch (error) {
      console.error("Error checking cart status:", error);
      setCartItems([]);
    }
  };

  // Enhanced cart status check for individual products (like ProductCard)
  const checkIndividualProductCartStatus = async (
    productId: string
  ): Promise<boolean> => {
    try {
      // First check if product has variants
      const product = await ProductService.getProductById(productId);

      if (ProductService.hasVariants(product)) {
        // For products with variants, don't show "Added to cart"
        // since only specific variants can be added
        return false;
      } else {
        // For simple products, check if the product itself is in cart
        const isProductInCart = await CartService.isInCart(productId);
        return isProductInCart;
      }
    } catch (error) {
      console.error("Error checking individual product cart status:", error);
      return false;
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const wishlist = await WishlistService.getWishlist();
      const productIds = wishlist.products.map((item: any) => item.productId);
      setWishlistItems(productIds);
    } catch (error) {
      console.error("Error checking wishlist status:", error);
      setWishlistItems([]);
    }
  };

  // Helper function to check if a product is in cart
  const isInCart = (productId: string): boolean => {
    // For products with variants, never show "Added to Cart"
    if (productsWithVariants.has(productId)) {
      return false;
    }
    return cartItems.includes(productId);
  };

  // Enhanced helper function to check if a product should show "Added to Cart"
  const shouldShowAddedToCart = async (productId: string): Promise<boolean> => {
    return await checkIndividualProductCartStatus(productId);
  };

  // Helper function to check if a product is in wishlist
  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.includes(productId);
  };

  // Handle cart toggle with variant support
  const handleCartToggle = async (productId: string) => {
    if (isInCart(productId)) {
      // Remove from cart
      try {
        setLoadingStates((prev) => ({ ...prev, [productId]: true }));
        const cart = await CartService.getCart();
        const cartItem = cart.items.find(
          (item) => item.productId === productId
        );

        if (cartItem) {
          await CartService.removeItemFromCart(cartItem.id);
          await checkCartStatus();
          
          // Trigger cart update event for header
          triggerCartUpdate();
          
          toast({
            title: "Removed from cart",
            description: "Product has been removed from your cart.",
          });
        }
      } catch (error) {
        console.error("Error removing from cart:", error);
        toast({
          title: "Error",
          description: "Failed to remove item from cart. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingStates((prev) => ({ ...prev, [productId]: false }));
      }
      return;
    }

    // Check if product has variants
    setLoadingStates((prev) => ({ ...prev, [productId]: true }));
    try {
      const product = await ProductService.getProductById(productId);
      setSelectedProduct(product);

      if (ProductService.hasVariants(product)) {
        // Mark this product as having variants
        setProductsWithVariants((prev) => new Set(prev).add(productId));
        // Show variant selection modal
        setShowVariantModal(true);
      } else {
        // Add product directly to cart
        await handleAddToCart({ productId, quantity: 1 });
        await checkCartStatus();
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch product details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Handle adding to cart (for both products and variants)
  const handleAddToCart = async (request: CartItemRequest) => {
    try {
      await CartService.addItemToCart(request);

      // Update cart status based on what was added
      if (request.variantId) {
        // If a variant was added, don't update cart status for products with variants
        // since the "Added to cart" button shouldn't appear for variant products
        // Just refresh the general cart status
        await checkCartStatus();
      } else {
        // If product was added, check if product is in cart
        const isProductInCart = await CartService.isInCart(
          request.productId || ""
        );
        if (isProductInCart) {
          setCartItems((prev) => [...prev, request.productId || ""]);
        }
      }

      // Trigger cart update event for header
      triggerCartUpdate();

      toast({
        title: "Added to cart",
        description: "Product has been added to your cart.",
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (productId: string) => {
    if (isInWishlist(productId)) {
      // Remove from wishlist
      try {
        setWishlistLoadingStates((prev) => ({ ...prev, [productId]: true }));

        if (isAuthenticated) {
          // For authenticated users, we need to get the wishlist item ID
          const wishlist = await WishlistService.getWishlist();
          const wishlistItem = wishlist.products.find(
            (item) => item.productId === productId
          );

          if (wishlistItem) {
            await WishlistService.removeFromWishlist(wishlistItem.id);
          }
        } else {
          // For guest users, remove from localStorage by productId
          await WishlistService.removeFromWishlist(productId);
        }

        await checkWishlistStatus();
        toast({
          title: "Removed from wishlist",
          description: "Product has been removed from your wishlist.",
        });
      } catch (error) {
        console.error("Error removing from wishlist:", error);
        toast({
          title: "Error",
          description: "Failed to remove item from wishlist. Please try again.",
          variant: "destructive",
        });
      } finally {
        setWishlistLoadingStates((prev) => ({ ...prev, [productId]: false }));
      }
      return;
    }

    // Add to wishlist
    setWishlistLoadingStates((prev) => ({ ...prev, [productId]: true }));
    try {
      await WishlistService.addToWishlist({
        productId,
      });
      await checkWishlistStatus();

      const message = isAuthenticated
        ? "Product has been added to your wishlist."
        : "Product has been added to your local wishlist. Sign in to sync across devices.";

      toast({
        title: "Added to wishlist",
        description: message,
      });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to add item to wishlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setWishlistLoadingStates((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Convert filters to backend search DTO (async now due to ID mapping)
  const createSearchDTO = async (): Promise<ProductSearchDTO> => {
    const searchDTO: ProductSearchDTO = {
      page: currentPage - 1,
      size: productsPerPage,
      sortBy,
      sortDirection,
    };

    // Add search term
    if (filters.searchTerm && filters.searchTerm.trim() !== "") {
      searchDTO.name = filters.searchTerm.trim();
    }

    // Add categories with proper ID mapping
    if (filters.categories && filters.categories.length > 0) {
      try {
        const categoryIds = await filterMappingService.mapCategoryNamesToIds(
          filters.categories
        );
        if (categoryIds.length > 0) {
          searchDTO.categoryIds = categoryIds;
          console.log("Using category IDs:", categoryIds);
        } else {
          console.warn("No valid category IDs found for:", filters.categories);
          console.log("Falling back to category names:", filters.categories);
          searchDTO.categoryNames = filters.categories;
        }
      } catch (error) {
        console.error("Error mapping category names to IDs:", error);
        console.log(
          "Falling back to category names due to error:",
          filters.categories
        );
        searchDTO.categoryNames = filters.categories;
      }
    }

    // Add brands with proper ID mapping
    if (filters.brands && filters.brands.length > 0) {
      try {
        const brandIds = await filterMappingService.mapBrandNamesToIds(
          filters.brands
        );
        if (brandIds.length > 0) {
          searchDTO.brandIds = brandIds;
          console.log("Using brand IDs:", brandIds);
        } else {
          console.warn("No valid brand IDs found for:", filters.brands);
          console.log("Falling back to brand names:", filters.brands);
          searchDTO.brandNames = filters.brands;
        }
      } catch (error) {
        console.error("Error mapping brand names to IDs:", error);
        console.log(
          "Falling back to brand names due to error:",
          filters.brands
        );
        searchDTO.brandNames = filters.brands;
      }
    }

    // Add price range (only if values are valid numbers)
    if (filters.priceRange && filters.priceRange.length >= 2) {
      const minPrice = filters.priceRange[0];
      const maxPrice = filters.priceRange[1];

      if (typeof minPrice === "number" && minPrice > 0) {
        searchDTO.basePriceMin = minPrice;
      }
      if (typeof maxPrice === "number" && maxPrice < 1000) {
        searchDTO.basePriceMax = maxPrice;
      }
    }

    // Add rating filter (only if value is valid)
    if (
      filters.rating !== null &&
      typeof filters.rating === "number" &&
      filters.rating > 0
    ) {
      searchDTO.averageRatingMin = filters.rating;
    }

    // Add in stock filter
    if (filters.inStock === false) {
      searchDTO.inStock = false;
    }

    // Add bestseller filter
    if (filters.isBestseller === true) {
      searchDTO.isBestseller = true;
    }

    // Add featured filter
    if (filters.isFeatured === true) {
      searchDTO.isFeatured = true;
    }

    // Add attributes as variant attributes
    if (filters.attributes && Object.keys(filters.attributes).length > 0) {
      const variantAttrs: string[] = [];
      Object.entries(filters.attributes).forEach(([type, values]) => {
        values.forEach((value) => {
          variantAttrs.push(`${type}:${value}`);
        });
      });
      if (variantAttrs.length > 0) {
        searchDTO.variantAttributes = variantAttrs;
      }
    }

    // Add selected discounts
    if (filters.selectedDiscounts && filters.selectedDiscounts.length > 0) {
      // Convert discount IDs to UUIDs for backend
      const discountIds = filters.selectedDiscounts
        .map((id) => {
          try {
            // Validate UUID format
            return id;
          } catch (error) {
            console.warn("Invalid discount ID format:", id);
            return null;
          }
        })
        .filter((id) => id !== null);

      if (discountIds.length > 0) {
        searchDTO.discountIds = discountIds;
      }
    }

    // Clean up undefined values before sending
    const cleanSearchDTO: ProductSearchDTO = {};
    Object.entries(searchDTO).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          (cleanSearchDTO as any)[key] = value;
        } else if (!Array.isArray(value)) {
          (cleanSearchDTO as any)[key] = value;
        }
      }
    });

    // Ensure we have at least one filter criterion
    const hasAnyFilter =
      cleanSearchDTO.name ||
      (cleanSearchDTO.categoryIds && cleanSearchDTO.categoryIds.length > 0) ||
      (cleanSearchDTO.categoryNames &&
        cleanSearchDTO.categoryNames.length > 0) ||
      (cleanSearchDTO.brandIds && cleanSearchDTO.brandIds.length > 0) ||
      (cleanSearchDTO.brandNames && cleanSearchDTO.brandNames.length > 0) ||
      cleanSearchDTO.basePriceMin !== undefined ||
      cleanSearchDTO.basePriceMax !== undefined ||
      cleanSearchDTO.averageRatingMin !== undefined ||
      cleanSearchDTO.inStock !== undefined ||
      cleanSearchDTO.isBestseller !== undefined ||
      cleanSearchDTO.isFeatured !== undefined ||
      (cleanSearchDTO.variantAttributes &&
        cleanSearchDTO.variantAttributes.length > 0) ||
      (cleanSearchDTO.discountIds && cleanSearchDTO.discountIds.length > 0);

    if (!hasAnyFilter) {
      console.warn(
        "No valid filter criteria found, using getAllProducts instead"
      );
      throw new Error("No valid filter criteria");
    }

    console.log("Search DTO created:", cleanSearchDTO);
    return cleanSearchDTO;
  };

  // Check if we need to use search vs getAllProducts
  const hasActiveFilters = (): boolean => {
    return (
      !!filters.searchTerm ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 1000 ||
      filters.categories.length > 0 ||
      filters.brands?.length > 0 ||
      filters.selectedDiscounts?.length > 0 ||
      (filters.attributes && Object.keys(filters.attributes).length > 0) ||
      filters.rating !== null ||
      filters.inStock === false ||
      filters.isBestseller === true ||
      filters.isFeatured === true
    );
  };

  // Fetch products
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let productPage: Page<ManyProductsDto>;

      if (hasActiveFilters()) {
        // Use search endpoint when filters are applied
        const searchDTO = await createSearchDTO();
        productPage = await ProductService.searchProducts(searchDTO);
      } else {
        // Use getAllProducts when no filters
        productPage = await ProductService.getAllProducts(
          currentPage - 1,
          productsPerPage,
          sortBy,
          sortDirection
        );
      }

      setProducts(productPage);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters, currentPage, productsPerPage, sortBy, sortDirection]);

  useEffect(() => {
    if (products?.content) {
      const checkVariants = async () => {
        const variantProducts = new Set<string>();
        for (const product of products.content) {
          try {
            const productDetails = await ProductService.getProductById(
              product.productId
            );
            if (ProductService.hasVariants(productDetails)) {
              variantProducts.add(product.productId);
            }
          } catch (error) {
            console.error(
              `Error checking variants for product ${product.productId}:`,
              error
            );
          }
        }
        setProductsWithVariants(variantProducts);
      };
      checkVariants();
    }
  }, [products]);

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortDirection] = value.split("-");
    setSortBy(newSortBy);
    setSortDirection(newSortDirection || "desc");
  };

  const handleRetry = () => {
    fetchProducts();
  };

  const clearAllFilters = () => {
    onClearAllFilters();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Top Controls Skeleton */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {Array(Math.min(productsPerPage, 8))
            .fill(0)
            .map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-square w-full rounded-lg" />
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-12 text-center border rounded-lg bg-red-50">
        <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="font-medium text-lg mb-2 text-red-700">
          Failed to Load Products
        </h3>
        <p className="text-red-600 mb-6">{error}</p>
        <Button onClick={handleRetry} variant="outline">
          <Loader2 className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  const paginatedProducts = products?.content || [];
  const totalProducts = products?.totalElements || 0;

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing <strong>{paginatedProducts.length}</strong> of{" "}
            <strong>{totalProducts}</strong> products
          </span>
          {totalProducts > 0 && (
            <Badge variant="outline" className="text-xs">
              Page {currentPage} of {products?.totalPages || 1}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center flex-1 sm:flex-auto">
            <span className="text-sm mr-2 hidden sm:inline-block">
              Sort by:
            </span>
            <Select
              value={`${sortBy}-${sortDirection}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[130px] sm:w-[160px] h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="finalPrice-asc">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="finalPrice-desc">
                  Price: High to Low
                </SelectItem>
                <SelectItem value="rating-desc">Highest Rated</SelectItem>
                <SelectItem value="reviewCount-desc">Most Reviews</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="hidden sm:flex items-center space-x-1 border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none rounded-l-md"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none rounded-r-md"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={onToggleFilters}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      {paginatedProducts.length === 0 ? (
        <div className="py-12 text-center border rounded-lg bg-gray-50">
          <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <Filter className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-lg mb-2">
            No products match your criteria
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or search term.
          </p>
          <Button variant="outline" onClick={clearAllFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div
          className={`grid gap-4 sm:gap-6 ${
            viewMode === "grid"
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          }`}
        >
          {paginatedProducts.map((product) => {
            const convertedProduct =
              ProductService.convertToProductCardFormat(product);

            return (
              <div key={product.productId}>
                {viewMode === "grid" ? (
                  <ProductCard
                    id={convertedProduct.id}
                    name={convertedProduct.name}
                    price={convertedProduct.price}
                    originalPrice={convertedProduct.originalPrice}
                    rating={convertedProduct.rating}
                    reviewCount={convertedProduct.reviewCount}
                    image={convertedProduct.image}
                    discount={convertedProduct.discount}
                    isNew={convertedProduct.isNew}
                    isBestseller={convertedProduct.isBestseller}
                    discountedPrice={convertedProduct.discountedPrice}
                    category={convertedProduct.category}
                    brand={convertedProduct.brand}
                    hasActiveDiscount={convertedProduct.hasActiveDiscount}
                    discountName={convertedProduct.discountName}
                    discountEndDate={convertedProduct.discountEndDate}
                    shortDescription={convertedProduct.shortDescription}
                    isFeatured={convertedProduct.isFeatured}
                    shopCapability={convertedProduct.shopCapability}
                  />
                ) : (
                  <div className="relative border rounded-md overflow-hidden hover:border-primary/20 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                      {convertedProduct.hasActiveDiscount &&
                        convertedProduct.discount && (
                          <Badge variant="destructive" className="text-xs">
                            -{convertedProduct.discount}% OFF
                          </Badge>
                        )}

                      {convertedProduct.isNew && (
                        <Badge className="bg-green-500 text-white text-xs">
                          New
                        </Badge>
                      )}
                      {convertedProduct.isBestseller && (
                        <Badge className="bg-blue-500 text-white text-xs">
                          Bestseller
                        </Badge>
                      )}
                      {convertedProduct.isFeatured && (
                        <Badge className="bg-purple-500 text-white text-xs">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all ${
                        isInWishlist(convertedProduct.id)
                          ? "text-red-500"
                          : "text-muted-foreground hover:text-red-500"
                      }`}
                      onClick={() => handleWishlistToggle(convertedProduct.id)}
                      disabled={wishlistLoadingStates[convertedProduct.id]}
                    >
                      {wishlistLoadingStates[convertedProduct.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart
                          className={`h-4 w-4 ${
                            isInWishlist(convertedProduct.id)
                              ? "fill-current"
                              : ""
                          }`}
                        />
                      )}
                    </Button>

                    <div className="flex flex-col lg:flex-row">
                      {/* Image Section */}
                      <div className="relative w-full lg:w-64 h-48 lg:h-auto">
                        <Link href={`/product/${convertedProduct.id}`}>
                          <img
                            src={convertedProduct.image}
                            alt={convertedProduct.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-6">
                        <div className="flex flex-col h-full">
                          {/* Product Name */}
                          <Link href={`/product/${convertedProduct.id}`}>
                            <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
                              {convertedProduct.name}
                            </h3>
                          </Link>

                          {/* Short Description */}
                          {convertedProduct.shortDescription && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {convertedProduct.shortDescription}
                            </p>
                          )}

                          {/* Category and Brand */}
                          <div className="flex items-center gap-2 mb-3">
                            {convertedProduct.category && (
                              <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                                {convertedProduct.category}
                              </span>
                            )}
                            {convertedProduct.brand && (
                              <span className="bg-blue-100 px-2 py-1 rounded-full text-blue-700 text-xs">
                                {convertedProduct.brand}
                              </span>
                            )}
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-1 mb-3">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-muted-foreground">
                              {convertedProduct.rating.toFixed(1)} (
                              {convertedProduct.reviewCount} reviews)
                            </span>
                          </div>

                          {/* Price Section */}
                          <div className="mb-4">
                            {(() => {
                              const priceInfo = formatDiscountedPrice(
                                convertedProduct.originalPrice || convertedProduct.price,
                                convertedProduct.discountedPrice || convertedProduct.price
                              );
                              
                              return (
                                <>
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className="font-bold text-xl">
                                      {formatPrice(convertedProduct.discountedPrice || convertedProduct.price)}
                                    </span>
                                    {priceInfo.hasDiscount && (
                                      <span className="text-sm text-muted-foreground line-through">
                                        {formatPrice(convertedProduct.originalPrice || convertedProduct.price)}
                                      </span>
                                    )}
                                  </div>
                                  {convertedProduct.hasActiveDiscount &&
                                    convertedProduct.discount &&
                                    priceInfo.hasDiscount && (
                                      <span className="text-sm text-green-600 font-medium">
                                        Save {formatPrice(
                                          (convertedProduct.originalPrice || convertedProduct.price) -
                                          (convertedProduct.discountedPrice || convertedProduct.price),
                                          { showCurrency: false }
                                        )}
                                      </span>
                                    )}
                                </>
                              );
                            })()}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-3 mt-auto">
                            {convertedProduct.shopCapability !== "VISUALIZATION_ONLY" && (
                              <Button
                                size="sm"
                                className={`flex-1 ${
                                  isInCart(convertedProduct.id)
                                    ? "bg-green-600 hover:bg-green-700"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleCartToggle(convertedProduct.id)
                                }
                                disabled={loadingStates[convertedProduct.id]}
                              >
                                {loadingStates[convertedProduct.id] ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Loading...
                                  </>
                                ) : isInCart(convertedProduct.id) ? (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Added to Cart
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Add to Cart
                                  </>
                                )}
                              </Button>
                            )}
                            <Link
                              href={`/product/${convertedProduct.id}`}
                              className="flex-1"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Variant Selection Modal */}
      {showVariantModal && selectedProduct && (
        <VariantSelectionModal
          product={selectedProduct}
          isOpen={showVariantModal}
          onClose={() => {
            setShowVariantModal(false);
            setSelectedProduct(null);
          }}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};

export default ProductGrid;
