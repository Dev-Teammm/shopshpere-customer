"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  AlertCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CartService, CartResponse, CartItemResponse } from "@/lib/cartService";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/lib/store/hooks";
import { formatPrice as formatPriceUtil } from "@/lib/utils/priceFormatter";
import { PaymentIcons } from "@/components/PaymentIcons";
import { ShopCapabilityBadge, ShopCapabilityDialog } from "@/components/ShopCapabilityDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRemovingItem, setIsRemovingItem] = useState<string | null>(null);
  const [isUpdatingItem, setIsUpdatingItem] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<{[key: string]: string}>({});
  const [showCapabilityDialog, setShowCapabilityDialog] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<"VISUALIZATION_ONLY" | "PICKUP_ORDERS" | "FULL_ECOMMERCE" | "HYBRID" | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0); // Backend uses 0-based pagination
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);

  // Load cart from API on component mount
  useEffect(() => {
    loadCart();
  }, [currentPage]);

  // Debug discount calculations when cart changes
  useEffect(() => {
    if (cart && cart.items) {
      console.log("=== DISCOUNT DEBUG ===");
      cart.items.forEach((item, index) => {
        console.log(`Item ${index + 1}: ${item.name}`);
        console.log(`  - hasDiscount: ${item.hasDiscount}`);
        console.log(`  - price: ${item.price}`);
        console.log(`  - originalPrice: ${item.originalPrice}`);
        console.log(`  - discountAmount: ${item.discountAmount}`);
        console.log(`  - discountName: ${item.discountName}`);
        console.log(`  - quantity: ${item.quantity}`);
        console.log(`  - calculated discount: ${calculateItemDiscount(item)}`);
        console.log("---");
      });
      console.log(`Total calculated discount: ${calculateTotalDiscount()}`);
      console.log(`Original subtotal: ${calculateOriginalSubtotal()}`);
      console.log(`Cart subtotal: ${cart.subtotal}`);
      console.log("=== END DEBUG ===");
    }
  }, [cart]);

  // Function to load cart data
  const loadCart = async () => {
    setLoading(true);
    try {
      const cartData = await CartService.getCart(currentPage, itemsPerPage);
      setCart(cartData);
      setTotalPages(cartData.totalPages || 1);
      
      // Debug: Log cart data to understand discount structure
      console.log("Cart Data:", cartData);
      console.log("Cart Items with hasDiscount flag:", cartData.items.filter(item => item.hasDiscount));
    } catch (error) {
      console.error("Error loading cart:", error);
      toast.error("Failed to load cart items.");
    } finally {
      setLoading(false);
    }
  };

  // Add function to dispatch cart updated event
  const dispatchCartUpdatedEvent = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  // Handle quantity input change
  const handleQuantityInputChange = (itemId: string, value: string) => {
    setEditingQuantity(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  // Handle quantity input blur (when user finishes editing)
  const handleQuantityInputBlur = async (itemId: string) => {
    const inputValue = editingQuantity[itemId];
    if (!inputValue) return;

    const newQuantity = parseInt(inputValue, 10);
    const item = cart?.items.find((item: CartItemResponse) => item.id === itemId);
    
    if (!item) return;

    if (isNaN(newQuantity) || newQuantity < 1) {
      // Reset to current quantity if invalid
      setEditingQuantity(prev => ({
        ...prev,
        [itemId]: item.quantity.toString()
      }));
      return;
    }

    // If quantity hasn't changed, just clear the editing state
    if (newQuantity === item.quantity) {
      setEditingQuantity(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
      return;
    }

    await updateQuantity(itemId, newQuantity);
  };

  // Handle Enter key press in quantity input
  const handleQuantityInputKeyPress = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter') {
      handleQuantityInputBlur(itemId);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (!cart) return;

    if (newQuantity < 1) newQuantity = 1;

    const item = cart.items.find((item) => item.id === itemId);
    if (!item) return;

    const maxStock = item.stock || 100;
    if (newQuantity > maxStock) {
      newQuantity = maxStock;
      toast.warning(`Only ${maxStock} items available in stock.`);
    }

    setEditingQuantity(prev => ({
      ...prev,
      [itemId]: newQuantity.toString()
    }));

    setIsUpdatingItem(itemId);

    try {
      const updatedCart = await CartService.updateCartItem(itemId, {
        productId: item.productId,
        quantity: newQuantity,
      });

      setCart(updatedCart);
      dispatchCartUpdatedEvent();
      toast.success("Cart updated successfully");
      
      // Clear the editing state after successful update
      setEditingQuantity(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    } catch (error) {
      console.error("Error updating cart:", error);
      toast.error("Failed to update cart item.");
      // Reset the editing quantity on error
      setEditingQuantity(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
      // Reload cart to get the correct state
      await loadCart();
    } finally {
      setIsUpdatingItem(null);
    }
  };

  // Remove item function
  const removeItem = async (itemId: string) => {
    if (!cart) return;

    setIsRemovingItem(itemId);

    try {
      const updatedCart = await CartService.removeItemFromCart(itemId);
      setCart(updatedCart);
      toast.success("Item removed from cart");
      dispatchCartUpdatedEvent();

      // Adjust current page if needed
      if (updatedCart.items.length === 0 && currentPage > 0) {
        setCurrentPage(Math.max(0, currentPage - 1));
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
      toast.error("Failed to remove item from cart.");
    } finally {
      setIsRemovingItem(null);
    }
  };

  // Clear cart function
  const clearCart = async () => {
    try {
      await CartService.clearCart();
      setCart({
        cartId: "",
        userId: "",
        items: [],
        totalItems: 0,
        subtotal: 0,
        totalPages: 1,
        currentPage: 0,
      });
      setCurrentPage(0);
      toast.success("Cart cleared successfully");
      dispatchCartUpdatedEvent();
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart.");
    }
  };

  // Calculate original subtotal (before discounts)
  const calculateOriginalSubtotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => {
      // Use originalPrice * quantity to get the price before any discounts
      const originalItemPrice = (item.originalPrice || item.price) * item.quantity;
      return total + originalItemPrice;
    }, 0);
  };

  // Calculate total discount amount
  const calculateTotalDiscount = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => {
      // If discountAmount is provided, use it
      if (item.discountAmount && item.discountAmount > 0) {
        return total + item.discountAmount;
      }
      
      // Otherwise, calculate discount from originalPrice and current price
      if (item.hasDiscount && item.originalPrice && item.originalPrice > item.price) {
        const discountPerItem = (item.originalPrice - item.price) * item.quantity;
        return total + discountPerItem;
      }
      
      return total;
    }, 0);
  };

  // Calculate discount amount for individual item
  const calculateItemDiscount = (item: any) => {
    // If discountAmount is provided, use it
    if (item.discountAmount && item.discountAmount > 0) {
      return item.discountAmount;
    }
    
    // Otherwise, calculate discount from originalPrice and current price
    if (item.hasDiscount && item.originalPrice && item.originalPrice > item.price) {
      return (item.originalPrice - item.price) * item.quantity;
    }
    
    return 0;
  };

  // Calculate total
  const getTotal = () => {
    if (!cart) return 0;
    return cart.subtotal;
  };

  // Handle proceed to checkout
  const handleProceedToCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error("Your cart is empty. Add items to proceed to checkout.");
      return;
    }

    // Validate that no items are from VISUALIZATION_ONLY shops
    const visualizationOnlyItems = cart.items.filter(
      (item) => item.shopCapability === "VISUALIZATION_ONLY"
    );

    if (visualizationOnlyItems.length > 0) {
      toast.error(
        `Cannot proceed to checkout. ${visualizationOnlyItems.length} item(s) are from shops that only display products and do not accept orders. Please remove these items or contact the shops directly.`,
        { duration: 6000 }
      );
      return;
    }

    router.push("/checkout");
  };

  // Format price using our utility
  const formatPrice = (price: number) => {
    return formatPriceUtil(price);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 0 || page >= totalPages) return;
    setCurrentPage(page);
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink
          onClick={() => handlePageChange(0)}
          isActive={currentPage === 0}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Show ellipsis if needed
    if (currentPage > 2) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Show current page and neighbors
    for (
      let i = Math.max(1, currentPage - 1);
      i <= Math.min(totalPages - 2, currentPage + 1);
      i++
    ) {
      if (i === 0 || i === totalPages - 1) continue; // Skip first and last as they're always shown
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Show ellipsis if needed
    if (currentPage < totalPages - 3) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            onClick={() => handlePageChange(totalPages - 1)}
            isActive={currentPage === totalPages - 1}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading your cart...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>
        <div className="bg-muted/30 rounded-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">
            Looks like you haven't added any products to your cart yet.
          </p>
          <Button size="lg" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Your Shopping Cart</h1>
        <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
          <Link href="/shop" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items Section */}
        <div className="lg:col-span-2">
          {/* Desktop Cart View */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Product</TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className={
                      isRemovingItem === item.id
                        ? "opacity-50 transition-opacity"
                        : ""
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/product/${item.productId}`}
                          className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </Link>
                        <div className="flex flex-col">
                          <Link
                            href={`/product/${item.productId}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {item.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < Math.floor(item.averageRating)
                                      ? "fill-rating-star text-rating-star"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              ({item.ratingCount})
                            </span>
                            {item.shopCapability && (
                              <div className="flex items-center gap-1">
                                <ShopCapabilityBadge
                                  capability={item.shopCapability}
                                  onClick={() => {
                                    setSelectedCapability(item.shopCapability!);
                                    setShowCapabilityDialog(true);
                                  }}
                                  className="text-xs"
                                />
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedCapability(item.shopCapability!);
                                          setShowCapabilityDialog(true);
                                        }}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label="Learn more about shop capability"
                                      >
                                        <Info className="h-3 w-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Click to learn how this shop operates</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-sm self-start mt-1 h-7 px-2 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                            disabled={isRemovingItem === item.id}
                          >
                            {isRemovingItem === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Remove
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">
                          {formatPrice(item.price)}
                        </span>
                        {item.originalPrice &&
                          item.originalPrice > item.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(item.originalPrice)}
                            </span>
                          )}
                        {item.hasDiscount && item.discountPercentage && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            -{Math.round(item.discountPercentage)}% OFF
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex border rounded-lg overflow-hidden">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-none"
                            onClick={() => {
                              const currentQuantity = editingQuantity[item.id] 
                                ? parseInt(editingQuantity[item.id], 10) 
                                : item.quantity;
                              updateQuantity(item.id, currentQuantity - 1);
                            }}
                            disabled={
                              isUpdatingItem === item.id || 
                              (editingQuantity[item.id] 
                                ? parseInt(editingQuantity[item.id], 10) <= 1 
                                : item.quantity <= 1)
                            }
                          >
                            {isUpdatingItem === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max={item.stock}
                            value={editingQuantity[item.id] ?? item.quantity.toString()}
                            onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                            onBlur={() => handleQuantityInputBlur(item.id)}
                            onKeyPress={(e) => handleQuantityInputKeyPress(e, item.id)}
                            className="min-w-[3rem] w-auto max-w-[6rem] h-8 text-center border-0 rounded-none focus:ring-0 focus:border-0 px-2"
                            disabled={isUpdatingItem === item.id}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-none"
                            onClick={() => {
                              const currentQuantity = editingQuantity[item.id] 
                                ? parseInt(editingQuantity[item.id], 10) 
                                : item.quantity;
                              updateQuantity(item.id, currentQuantity + 1);
                            }}
                            disabled={
                              isUpdatingItem === item.id ||
                              (editingQuantity[item.id] 
                                ? parseInt(editingQuantity[item.id], 10) >= item.stock 
                                : item.quantity >= item.stock)
                            }
                          >
                            {isUpdatingItem === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.stock} available
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(item.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination for desktop */}
            {totalPages > 1 && (
              <div className="p-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={
                          currentPage === 0
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {renderPaginationItems()}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={
                          currentPage === totalPages - 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>

          {/* Mobile Cart View */}
          <div className="md:hidden space-y-4">
            {cart.items.map((item) => (
              <Card
                key={item.id}
                className={`overflow-hidden ${
                  isRemovingItem === item.id
                    ? "opacity-50 transition-opacity"
                    : ""
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex gap-3">
                    <Link
                      href={`/product/${item.productId}`}
                      className="w-24 h-24 flex-shrink-0"
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="flex flex-col p-3 flex-1">
                      <Link
                        href={`/product/${item.productId}`}
                        className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 mb-2 flex-wrap">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(item.averageRating)
                                  ? "fill-rating-star text-rating-star"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({item.ratingCount})
                        </span>
                        {item.shopCapability && (
                          <div className="flex items-center gap-1">
                            <ShopCapabilityBadge
                              capability={item.shopCapability}
                              onClick={() => {
                                setSelectedCapability(item.shopCapability!);
                                setShowCapabilityDialog(true);
                              }}
                              className="text-xs"
                            />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCapability(item.shopCapability!);
                                      setShowCapabilityDialog(true);
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="Learn more about shop capability"
                                  >
                                    <Info className="h-3 w-3" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Click to learn how this shop operates</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatPrice(item.price)}
                          </span>
                          {item.originalPrice &&
                            item.originalPrice > item.price && (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatPrice(item.originalPrice)}
                              </span>
                            )}
                          {item.hasDiscount && item.discountPercentage && (
                            <Badge
                              variant="destructive"
                              className="text-xs mt-1 w-fit"
                            >
                              -{Math.round(item.discountPercentage)}% OFF
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="flex border rounded-lg overflow-hidden">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-none"
                                onClick={() => {
                                  const currentQuantity = editingQuantity[item.id] 
                                    ? parseInt(editingQuantity[item.id], 10) 
                                    : item.quantity;
                                  updateQuantity(item.id, currentQuantity - 1);
                                }}
                                disabled={
                                  isUpdatingItem === item.id || 
                                  (editingQuantity[item.id] 
                                    ? parseInt(editingQuantity[item.id], 10) <= 1 
                                    : item.quantity <= 1)
                                }
                              >
                                {isUpdatingItem === item.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Minus className="h-3 w-3" />
                                )}
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                max={item.stock}
                                value={editingQuantity[item.id] ?? item.quantity.toString()}
                                onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                                onBlur={() => handleQuantityInputBlur(item.id)}
                                onKeyPress={(e) => handleQuantityInputKeyPress(e, item.id)}
                                className="min-w-[2.5rem] w-auto max-w-[5rem] h-7 text-center text-sm border-0 rounded-none focus:ring-0 focus:border-0 px-2"
                                disabled={isUpdatingItem === item.id}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-none"
                                onClick={() => {
                                  const currentQuantity = editingQuantity[item.id] 
                                    ? parseInt(editingQuantity[item.id], 10) 
                                    : item.quantity;
                                  updateQuantity(item.id, currentQuantity + 1);
                                }}
                                disabled={
                                  isUpdatingItem === item.id ||
                                  (editingQuantity[item.id] 
                                    ? parseInt(editingQuantity[item.id], 10) >= item.stock 
                                    : item.quantity >= item.stock)
                                }
                              >
                                {isUpdatingItem === item.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => removeItem(item.id)}
                              disabled={isRemovingItem === item.id}
                            >
                              {isRemovingItem === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground text-center">
                            {item.stock} available
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination for mobile */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 p-0"
                    disabled={currentPage === 0}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="text-sm">
                    Page {currentPage + 1} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 p-0"
                    disabled={currentPage === totalPages - 1}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all items from your cart. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearCart}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Clear Cart
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="ghost" size="sm" asChild className="sm:hidden">
              <Link href="/shop" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="mt-4 lg:mt-0">
          <div className="rounded-md border overflow-hidden sticky top-24">
            <div className="bg-muted px-6 py-4">
              <h2 className="font-semibold text-lg">Order Summary</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Original Subtotal (before discounts) */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatPrice(calculateOriginalSubtotal())}
                </span>
              </div>

              {cart.items.some((item) => item.hasDiscount || calculateItemDiscount(item) > 0) && (
                <>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-600">
                      Discounts Applied
                    </div>
                    {cart.items
                      .filter((item) => item.hasDiscount || calculateItemDiscount(item) > 0)
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {item.name} ({item.discountName || "Discount"})
                          </span>
                          <span className="text-green-600 font-medium">
                            -{formatPrice(calculateItemDiscount(item))}
                          </span>
                        </div>
                      ))}
                    <div className="flex justify-between text-sm font-medium text-green-600 border-t pt-2">
                      <span>Total Discount</span>
                      <span>
                        -{formatPrice(calculateTotalDiscount())}
                      </span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Subtotal after discount */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal after discount</span>
                    <span className="font-medium">
                      {formatPrice(cart.subtotal)}
                    </span>
                  </div>
                </>
              )}

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(getTotal())}</span>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Estimated delivery: 3-5 business days</p>
              </div>

              <Button
                className="w-full mt-4"
                size="lg"
                onClick={handleProceedToCheckout}
              >
                Proceed to Checkout
              </Button>

              {/* Guest user message */}
              {!isAuthenticated && (
                <div className="text-center text-sm text-muted-foreground mt-2">
                  <p>Continue as guest or sign in to save your cart.</p>
                </div>
              )}

              {/* Payment options */}
              <PaymentIcons className="mt-4" />

              <div className="border-t pt-4 mt-4">
                <div className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Items in your cart are not reserved. Checkout now to secure
                    your order.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Capability Dialog */}
      {selectedCapability && (
        <ShopCapabilityDialog
          open={showCapabilityDialog}
          onOpenChange={setShowCapabilityDialog}
          capability={selectedCapability}
        />
      )}
    </div>
  );
}
