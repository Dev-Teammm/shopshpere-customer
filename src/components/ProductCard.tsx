import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Check, Eye, Loader2, Heart } from "lucide-react";
import Link from "next/link";
import VariantSelectionModal from "./VariantSelectionModal";
import { ProductService, ProductDTO } from "@/lib/productService";
import { CartService, CartItemRequest } from "@/lib/cartService";
import { WishlistService, AddToWishlistRequest } from "@/lib/wishlistService";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/lib/store/hooks";
import { formatPrice, formatDiscountedPrice } from "@/lib/utils/priceFormatter";
import { triggerCartUpdate } from "@/lib/utils/cartUtils";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  discount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  discountedPrice?: number;
  category?: string;
  brand?: string;
  hasActiveDiscount?: boolean;
  discountName?: string;
  discountEndDate?: string;
  shortDescription?: string;
  isFeatured?: boolean;
  hasVariantDiscounts?: boolean;
  maxVariantDiscount?: number;
  shopCapability?: "VISUALIZATION_ONLY" | "PICKUP_ORDERS" | "FULL_ECOMMERCE" | "HYBRID";
}

const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  rating,
  reviewCount,
  image,
  discount,
  isNew,
  isBestseller,
  discountedPrice,
  category,
  brand,
  hasActiveDiscount,
  discountName,
  discountEndDate,
  shortDescription,
  isFeatured,
  hasVariantDiscounts,
  maxVariantDiscount,
  shopCapability,
}: ProductCardProps) => {
  const isVisualizationOnly = shopCapability === "VISUALIZATION_ONLY";
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDTO | null>(null);
  const [variantDiscountInfo, setVariantDiscountInfo] = useState<{
    hasVariantDiscounts: boolean;
    maxVariantDiscount: number;
  }>({ hasVariantDiscounts: false, maxVariantDiscount: 0 });
  const [productsWithVariants, setProductsWithVariants] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Check if product is in cart and wishlist on component mount
  useEffect(() => {
    checkCartStatus();
    checkWishlistStatus();

    // Fetch variant discount information and check if product has variants
    const fetchProductInfo = async () => {
      try {
        const product = await ProductService.getProductById(id);
        const hasVariantDiscounts = ProductService.hasVariantDiscounts(product);
        const maxVariantDiscount = ProductService.getMaxVariantDiscount(product);
        setVariantDiscountInfo({ hasVariantDiscounts, maxVariantDiscount });

        // Check if product has variants and update the set
        if (ProductService.hasVariants(product)) {
          setProductsWithVariants(prev => new Set(prev).add(id));
        }
      } catch (error) {
        console.error("Error fetching product info:", error);
      }
    };

    fetchProductInfo();

    // Listen for cart updates
    const handleCartUpdate = () => {
      checkCartStatus();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, [id]);

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

  // Helper function to check if a product is in cart (same as ProductGrid)
  const isInCart = (productId: string): boolean => {
    // For products with variants, never show "Added to Cart"
    if (productsWithVariants.has(productId)) {
      return false;
    }
    return cartItems.includes(productId);
  };

  const checkWishlistStatus = async () => {
    try {
      // Check if the product is in wishlist (works for both authenticated and guest users)
      const isProductInWishlist = await WishlistService.isInWishlist(id);
      setIsInWishlist(isProductInWishlist);
    } catch (error) {
      console.error("Error checking wishlist status:", error);
      setIsInWishlist(false);
    }
  };

  // Check if product has variants and handle cart action
  const handleCartToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInCart(id)) {
      // Remove from cart
      try {
        setIsLoading(true);
        const cart = await CartService.getCart();
        const cartItem = cart.items.find((item) => item.productId === id);

        if (cartItem) {
          await CartService.removeItemFromCart(cartItem.id);
          // Refresh cart status after removal
          await checkCartStatus();
          
          // Trigger cart update event for header
          triggerCartUpdate();
          
          toast({
            title: "Removed from cart",
            description: `${name} has been removed from your cart.`,
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
        setIsLoading(false);
      }
      return;
    }

    // Check if product has variants
    setIsLoading(true);
    try {
      const product = await ProductService.getProductById(id);
      setProductDetails(product);

      if (ProductService.hasVariants(product)) {
        // Show variant selection modal - don't update cart status here
        setShowVariantModal(true);
      } else {
        // Add product directly to cart
        await handleAddToCart({ productId: id, quantity: 1 });
        // Cart status is updated within handleAddToCart
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch product details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding to cart (for both products and variants)
  const handleAddToCart = async (request: CartItemRequest) => {
    try {
      setIsLoading(true);
      await CartService.addItemToCart(request);

      // Update cart status based on what was added
      if (request.variantId) {
        // If a variant was added, just refresh the cart status
        await checkCartStatus();
      } else {
        // If product was added directly (no variants), add to cartItems immediately
        setCartItems(prev => [...prev, request.productId || id]);
      }

      // Trigger cart update event for header
      triggerCartUpdate();

      toast({
        title: "Added to cart",
        description: `${name} has been added to your cart.`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInWishlist) {
      // Remove from wishlist
      try {
        setIsWishlistLoading(true);

        if (isAuthenticated) {
          // For authenticated users, we need to get the wishlist item ID
          const wishlist = await WishlistService.getWishlist();
          const wishlistItem = wishlist.products.find(
            (item) => item.productId === id
          );

          if (wishlistItem) {
            await WishlistService.removeFromWishlist(wishlistItem.id);
          }
        } else {
          // For guest users, remove from localStorage by productId
          await WishlistService.removeFromWishlist(id);
        }

        setIsInWishlist(false);
        toast({
          title: "Removed from wishlist",
          description: `${name} has been removed from your wishlist.`,
        });
      } catch (error) {
        console.error("Error removing from wishlist:", error);
        toast({
          title: "Error",
          description: "Failed to remove item from wishlist. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsWishlistLoading(false);
      }
      return;
    }

    // Add to wishlist
    setIsWishlistLoading(true);
    try {
      await WishlistService.addToWishlist({
        productId: id,
      });
      setIsInWishlist(true);

      const message = isAuthenticated
        ? `${name} has been added to your wishlist.`
        : `${name} has been added to your local wishlist. Sign in to sync across devices.`;

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
      setIsWishlistLoading(false);
    }
  };

  return (
    <Card className="group relative overflow-hidden border hover:border-primary/20 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        {/* Image Container */}
        <Link href={`/product/${id}`}>
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 max-w-[calc(100%-4rem)]">
              {hasActiveDiscount && discount && (
                <Badge variant="destructive" className="text-xs w-fit px-2 py-1 whitespace-nowrap">
                  -{discount}% OFF
                </Badge>
              )}
              {variantDiscountInfo.hasVariantDiscounts &&
                !hasActiveDiscount &&
                variantDiscountInfo.maxVariantDiscount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-orange-500 text-white w-fit px-2 py-1 whitespace-nowrap"
                  >
                    Up to -{Math.round(variantDiscountInfo.maxVariantDiscount)}%
                  </Badge>
                )}
              {isNew && (
                <Badge className="bg-green-500 text-white text-xs w-fit px-2 py-1 whitespace-nowrap">New</Badge>
              )}
              {isBestseller && (
                <Badge className="bg-blue-500 text-white text-xs w-fit px-2 py-1 whitespace-nowrap">
                  Bestseller
                </Badge>
              )}
              {isFeatured && (
                <Badge className="bg-purple-500 text-white text-xs w-fit px-2 py-1 whitespace-nowrap">
                  Featured
                </Badge>
              )}
            </div>

            {/* Wishlist Button (always visible) */}
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all ${
                isInWishlist
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              }`}
              onClick={handleWishlistToggle}
              disabled={isWishlistLoading}
            >
              {isWishlistLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart
                  className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`}
                />
              )}
            </Button>

            {/* Buttons (appear on hover) */}
            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex flex-col gap-2">
                {!isVisualizationOnly && (
                  <Button
                    className={`w-full h-10 sm:h-9 text-sm ${
                      isInCart(id) ? "bg-success hover:bg-success/90" : ""
                    }`}
                    onClick={handleCartToggle}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : isInCart(id) ? (
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

                <Link href={`/product/${id}`} className="w-full">
                  <Button
                    variant="outline"
                    className="w-full h-10 sm:h-9 text-sm border-background/80 bg-background/80 backdrop-blur-sm hover:bg-background hover:border-primary"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Product
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Link>

        {/* Product Info */}
        <div className="p-4">
          <Link href={`/product/${id}`}>
            <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
              {name}
            </h3>
          </Link>

          {/* Short Description */}
          {shortDescription && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2 overflow-hidden text-ellipsis">
              {shortDescription}
            </p>
          )}

          {/* Category and Brand */}
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            {category && (
              <span className="bg-gray-100 px-2 py-1 rounded-full">
                {category}
              </span>
            )}
            {brand && (
              <span className="bg-blue-100 px-2 py-1 rounded-full text-blue-700">
                {brand}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">
              {rating.toFixed(1)} ({reviewCount})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            {(() => {
              const priceInfo = formatDiscountedPrice(
                originalPrice || price,
                discountedPrice || price
              );
              
              return (
                <>
                  <span className="font-bold text-lg">
                    {formatPrice(discountedPrice || price)}
                  </span>
                  {priceInfo.hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(originalPrice || price)}
                    </span>
                  )}
                  {hasActiveDiscount && discount && priceInfo.hasDiscount && (
                    <span className="text-xs text-green-600 font-medium">
                      Save {formatPrice(
                        (originalPrice || price) - (discountedPrice || price),
                        { showCurrency: false }
                      )}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </CardContent>

      {/* Variant Selection Modal */}
      {showVariantModal && productDetails && (
        <VariantSelectionModal
          product={productDetails}
          isOpen={showVariantModal}
          onClose={() => setShowVariantModal(false)}
          onAddToCart={handleAddToCart}
        />
      )}
    </Card>
  );
};

export default ProductCard;
