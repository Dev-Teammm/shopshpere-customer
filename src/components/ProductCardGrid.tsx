"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { useAppSelector } from "@/lib/store/hooks";
import { CartService } from "@/lib/cartService";
import { WishlistService } from "@/lib/wishlistService";
import { formatPrice, formatDiscountedPrice } from "@/lib/utils/priceFormatter";

interface Product {
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
  isInStock?: boolean;
  brand?: string;
  category?: string;
  hasActiveDiscount?: boolean;
  hasVariantDiscounts?: boolean;
  maxVariantDiscount?: number;
  discountedVariantsCount?: number;
  shopCapability?: "VISUALIZATION_ONLY" | "PICKUP_ORDERS" | "FULL_ECOMMERCE" | "HYBRID";
}

interface ProductCardGridProps {
  products: Product[];
  title: string;
  onSeeMore?: () => void;
  showSeeMore?: boolean;
  maxItems?: number;
}

const ProductCardGrid = ({
  products,
  title,
  onSeeMore,
  showSeeMore = true,
  maxItems = 4,
}: ProductCardGridProps) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [loadingStates, setLoadingStates] = useState<Set<string>>(new Set());

  const displayedProducts = products.slice(0, maxItems);

  // Don't render if no products
  if (!products || products.length === 0) {
    return null;
  }

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return;
    }

    // Don't allow adding to cart for visualization-only shops
    if (product.shopCapability === "VISUALIZATION_ONLY") {
      return;
    }

    setLoadingStates((prev) => new Set(prev).add(product.id));

    try {
      await CartService.addItemToCart({
        productId: product.id,
        quantity: 1,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setLoadingStates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  const handleWishlistToggle = async (productId: string) => {
    if (!isAuthenticated) return;

    try {
      if (wishlistItems.has(productId)) {
        // First get the wishlist to find the wishlistProductId
        const wishlistResponse = await WishlistService.getWishlist();
        const wishlistProduct = wishlistResponse.products.find(
          (item) => item.productId === productId
        );

        if (wishlistProduct) {
          await WishlistService.removeFromWishlist(wishlistProduct.id);
          setWishlistItems((prev) => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
        }
      } else {
        await WishlistService.addToWishlist({ productId });
        setWishlistItems((prev) => new Set(prev).add(productId));
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  return (
    <div className="bg-white rounded-md shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {showSeeMore && onSeeMore && (
          <Button
            variant="link"
            onClick={onSeeMore}
            className="text-blue-600 hover:text-blue-800 p-0 h-auto"
          >
            See more
          </Button>
        )}
      </div>

      <div
        className={`grid gap-4 ${
          maxItems <= 4
            ? "grid-cols-2 lg:grid-cols-4"
            : maxItems <= 6
            ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
            : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8"
        }`}
      >
        {displayedProducts.map((product) => (
          <div key={product.id} className="group relative">
            <Link href={`/product/${product.id}`}>
              <div className="relative bg-gray-100 rounded-md overflow-hidden aspect-square mb-3">
                {product.image &&
                product.image !== "https://via.placeholder.com/400x400" ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    <span className="text-sm font-medium">No Image</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 max-w-[calc(100%-4rem)]">
                  {product.discount && (
                    <Badge className="bg-red-500 text-white text-xs w-fit px-2 py-1 whitespace-nowrap">
                      -{product.discount}%
                    </Badge>
                  )}
                  {product.hasVariantDiscounts &&
                    !product.hasActiveDiscount &&
                    product.maxVariantDiscount &&
                    product.maxVariantDiscount > 0 && (
                      <Badge className="bg-orange-500 text-white text-xs w-fit px-2 py-1 whitespace-nowrap">
                        Up to -{Math.round(product.maxVariantDiscount)}%
                      </Badge>
                    )}
                  {product.isNew && (
                    <Badge className="bg-green-500 text-white text-xs w-fit px-2 py-1 whitespace-nowrap">
                      New
                    </Badge>
                  )}
                  {product.isBestseller && (
                    <Badge className="bg-blue-500 text-white text-xs w-fit px-2 py-1 whitespace-nowrap">
                      Bestseller
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.preventDefault();
                      handleWishlistToggle(product.id);
                    }}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        wishlistItems.has(product.id)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-600"
                      }`}
                    />
                  </Button>
                  {product.shopCapability !== "VISUALIZATION_ONLY" && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-white/90 hover:bg-white"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(product);
                      }}
                      disabled={loadingStates.has(product.id)}
                    >
                      <ShoppingCart className="h-4 w-4 text-gray-600" />
                    </Button>
                  )}
                </div>
              </div>
            </Link>

            {/* Product Info */}
            <div className="space-y-1">
              <Link href={`/product/${product.id}`}>
                <h3
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {product.name}
                </h3>
              </Link>

              {/* Rating */}
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  ({product.reviewCount})
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2">
                {(() => {
                  const priceInfo = formatDiscountedPrice(
                    product.originalPrice || product.price,
                    product.price
                  );
                  
                  return (
                    <>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                      {priceInfo.hasDiscount && product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Brand/Category */}
              {(product.brand || product.category) && (
                <p className="text-xs text-gray-500">
                  {product.brand && product.category
                    ? `${product.brand} • ${product.category}`
                    : product.brand || product.category}
                </p>
              )}

              {/* Variant Sale Indicator */}
              {product.hasVariantDiscounts && 
               !product.hasActiveDiscount && 
               product.discountedVariantsCount && 
               product.discountedVariantsCount > 0 && (
                <p className="text-xs text-orange-600 font-medium">
                  {product.discountedVariantsCount} variant{product.discountedVariantsCount > 1 ? 's' : ''} on sale
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCardGrid;
