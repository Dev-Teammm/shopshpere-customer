"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Coins, CreditCard, LockIcon, Loader2, MapPin, Package, Truck } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { PaymentIcons } from "@/components/PaymentIcons";
// Google Maps removed - using mock location data
import { CountrySelector } from "@/components/CountrySelector";
import { PointsPaymentModal } from "@/components/PointsPaymentModal";
import { formatStockErrorMessage, extractErrorDetails } from "@/lib/utils/errorParser";

// Services
import { CartService, CartResponse } from "@/lib/cartService";
import {
  OrderService,
  CheckoutRequest,
  GuestCheckoutRequest,
  AddressDto,
  CartItemDTO,
} from "@/lib/orderService";
import {
  checkoutService,
  PaymentSummaryDTO,
} from "@/lib/services/checkout-service";
import { formatPrice, formatPriceForInput } from "@/lib/utils/priceFormatter";
import { useAppSelector } from "@/lib/store/hooks";
import { PointsPaymentRequest } from "@/lib/services/points-payment-service";

// Constants
const PAYMENT_METHODS = [
  {
    id: "credit_card",
    name: "Credit Card",
    icon: "/visa-mastercard.svg",
    description: "Pay with Visa, Mastercard, or other major cards",
  },
  {
    id: "mtn_momo",
    name: "MTN Mobile Money",
    icon: "/mtn-momo.svg",
    description: "Pay using your MTN Mobile Money account",
  },
];

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // State
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("credit_card");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentSummary, setPaymentSummary] =
    useState<PaymentSummaryDTO | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  
  // Shop fulfillment preferences (for HYBRID shops)
  const [shopFulfillmentPreferences, setShopFulfillmentPreferences] = useState<
    Map<string, "PICKUP" | "DELIVERY">
  >(new Map());
  
  // Track which shops need fulfillment choice
  const [shopsRequiringChoice, setShopsRequiringChoice] = useState<
    Array<{ shopId: string; shopName: string; capability: string }>
  >([]);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    streetAddress: "",
    city: "",
    stateProvince: "",
    country: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    notes: "",
  });
  const [addressSelected, setAddressSelected] = useState(false);

  // Mock location data generator - returns coordinates on or near major roads
  // Note: Road validation is disabled in backend, but we still use road coordinates for accuracy
  const generateMockLocation = (country: string, city: string): { latitude: number; longitude: number } => {
    // Road coordinates - locations on major roads/streets in each country
    // These coordinates are on or very close to actual roads for delivery purposes
    const roadLocations: Record<string, { lat: number; lng: number }> = {
      'RW': { lat: -1.9500, lng: 30.0583 }, // Kigali - KN 3 Road (KG 2 St, main road)
      'UG': { lat: 0.3156, lng: 32.5822 }, // Kampala - Entebbe Road (major highway)
      'KE': { lat: -1.2833, lng: 36.8167 }, // Nairobi - Uhuru Highway (A104, main road)
      'TZ': { lat: -6.8167, lng: 39.2833 }, // Dar es Salaam - Ali Hassan Mwinyi Road
      'US': { lat: 40.7589, lng: -73.9851 }, // New York - Broadway (Times Square area, major street)
      'GB': { lat: 51.5074, lng: -0.1276 }, // London - Strand (major road)
      'CA': { lat: 43.6532, lng: -79.3832 }, // Toronto - Yonge Street (main street)
      'AU': { lat: -33.8688, lng: 151.2093 }, // Sydney - George Street (main road)
      'ZA': { lat: -26.2041, lng: 28.0473 }, // Johannesburg - Main Street
      'NG': { lat: 6.5244, lng: 3.3792 }, // Lagos - Ikorodu Road (major highway)
      'GH': { lat: 5.6037, lng: -0.1870 }, // Accra - Ring Road (major road)
      'ET': { lat: 9.1450, lng: 38.7617 }, // Addis Ababa - Bole Road (main road)
    };
    
    // Get country code (first 2 letters)
    const countryCode = country?.substring(0, 2).toUpperCase() || 'RW';
    const location = roadLocations[countryCode] || roadLocations['RW'];
    
    // Add very small random offset to simulate different points along the same road
    // Small offset (±0.0005 degrees ≈ ~50m) keeps it on/near the road
    const roadOffset = (Math.random() * 0.001 - 0.0005); // ±0.0005 degrees (~50m along road)
    
    return {
      latitude: location.lat + roadOffset,
      longitude: location.lng + roadOffset,
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load cart
        const cartData = await CartService.getCart();
        setCart(cartData);

        // Check if cart is empty
        if (!cartData || cartData.items.length === 0) {
          toast.error("Your cart is empty. Add some products before checkout.");
          setTimeout(() => {
            router.push("/shop");
          }, 2000);
          return;
        }

        // Pre-populate form data for authenticated users
        if (isAuthenticated && user) {
          setFormData((prev) => ({
            ...prev,
            email: user.email || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
          }));
        }

        // Detect HYBRID shops from cart items
        if (cartData && cartData.items) {
          // Group items by shop (we'll need to fetch shop info or use payment summary)
          // For now, we'll detect from payment summary response
          // But we can also check cart items if they have shopId
        }

        // Countries are loaded by CountrySelector component internally
      } catch (error) {
        console.error("Error loading checkout data:", error);
        toast.error("Error loading checkout data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, isAuthenticated, user]);

  useEffect(() => {
    // Only fetch if we have the minimum required fields
    if (cart && formData.streetAddress && formData.city && formData.country) {
      const timeoutId = setTimeout(() => {
        fetchPaymentSummary();
      }, 500); // Reduced timeout for faster response

      return () => clearTimeout(timeoutId);
    } else {
      // Clear payment summary if required fields are missing
      setPaymentSummary(null);
    }
  }, [
    formData.streetAddress,
    formData.city,
    formData.country,
    cart,
    isAuthenticated,
    user,
    shopFulfillmentPreferences, // Re-fetch when preferences change
  ]);
  
  // Auto-detect HYBRID shops from payment summary response (fallback detection)
  useEffect(() => {
    if (paymentSummary && paymentSummary.shopSummaries) {
      console.log("Auto-detecting HYBRID shops from payment summary (useEffect)");
      const hybridShops = paymentSummary.shopSummaries.filter(
        (shop) => {
          const isHybrid = shop.shopCapability === "HYBRID";
          const requiresChoice = shop.requiresFulfillmentChoice === true;
          const hasNoFulfillmentType = !shop.fulfillmentType || shop.fulfillmentType === null;
          const hasPreference = shopFulfillmentPreferences.has(shop.shopId);
          
          // Use same logic as in fetchPaymentSummary
          const shouldRequireChoice = isHybrid && (requiresChoice || (hasNoFulfillmentType && !hasPreference));
          return shouldRequireChoice && !hasPreference;
        }
      );
      console.log("Detected HYBRID shops requiring choice (useEffect):", hybridShops);
      if (hybridShops.length > 0) {
        setShopsRequiringChoice(
          hybridShops.map((shop) => ({
            shopId: shop.shopId,
            shopName: shop.shopName,
            capability: shop.shopCapability || "HYBRID",
          }))
        );
      } else {
        // Clear if all shops have preferences
        setShopsRequiringChoice([]);
      }
    }
  }, [paymentSummary, shopFulfillmentPreferences]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCountryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      country: value,
    }));
  };

  // Handle manual address input - generate mock coordinates
  const handleAddressInput = () => {
    if (formData.streetAddress && formData.city && formData.country) {
      const mockLocation = generateMockLocation(formData.country, formData.city);
      setFormData((prev) => ({
        ...prev,
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
      }));
      setAddressSelected(true);
      
      // Automatically fetch payment summary after address is complete
      setTimeout(() => {
        fetchPaymentSummary();
      }, 500);
    }
  };

  const fetchPaymentSummary = async () => {
    if (
      !cart ||
      !formData.streetAddress ||
      !formData.city ||
      !formData.country
    ) {
      console.log("Skipping payment summary fetch - missing required fields:", {
        hasCart: !!cart,
        hasStreetAddress: !!formData.streetAddress,
        hasCity: !!formData.city,
        hasCountry: !!formData.country,
      });
      return;
    }
    
    // Check if there are HYBRID shops that need fulfillment choice
    // This will be populated after first payment summary call if needed
    if (shopsRequiringChoice.length > 0) {
      const missingChoices = shopsRequiringChoice.filter(
        (shop) => !shopFulfillmentPreferences.has(shop.shopId)
      );
      if (missingChoices.length > 0) {
        toast.error(
          `Please select delivery method for ${missingChoices.length} shop(s) before calculating totals.`,
          { duration: 5000 }
        );
        return;
      }
    }

    console.log("Fetching payment summary for address:", {
      streetAddress: formData.streetAddress,
      city: formData.city,
      country: formData.country,
    });

    // Reset loading state and clear any previous errors
    setLoadingSummary(true);
    setPaymentSummary(null);
    
    try {
      console.log("Processing cart items:", cart.items);

      const cartItems: CartItemDTO[] = cart.items
        .filter((item) => {
          console.log("Filtering cart item:", item);
          return item.productId; // Only require productId, not id
        })
        .map((item) => {
          let itemId: number | undefined;
          if (isAuthenticated) {
            const parsedId = parseInt(item.id);
            if (!isNaN(parsedId)) {
              itemId = parsedId;
            }
          }

          let variantId: number | undefined;
          if (item.variantId) {
            const parsedVariantId = parseInt(item.variantId);
            if (!isNaN(parsedVariantId)) {
              variantId = parsedVariantId;
            }
          }

          const cartItem: CartItemDTO = {
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity || 1,
            price: item.price,
          };

          // Only include variantId if it exists and is valid
          if (variantId !== undefined) {
            cartItem.variantId = variantId;
          }

          console.log("Mapped cart item:", cartItem);
          return cartItem;
        })
        .filter((item) => item !== null) as CartItemDTO[];

      console.log("Final cart items for payment summary:", cartItems);

      // Ensure mock coordinates are set if not already present
      let latitude = formData.latitude;
      let longitude = formData.longitude;
      if (!latitude || !longitude) {
        const mockLocation = generateMockLocation(formData.country, formData.city);
        latitude = mockLocation.latitude;
        longitude = mockLocation.longitude;
        // Update formData with mock coordinates
        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
      }

      const address: AddressDto = {
        streetAddress: formData.streetAddress,
        city: formData.city,
        state: formData.stateProvince,
        country: formData.country,
        latitude: latitude,
        longitude: longitude,
      };

      console.log("Sending payment summary request:", {
        deliveryAddress: address,
        itemsCount: cartItems.length,
        orderValue: cart.subtotal,
        userId: isAuthenticated && user ? user.id : undefined,
      });

      // Convert shopFulfillmentPreferences Map to array format
      const preferencesArray = Array.from(shopFulfillmentPreferences.entries()).map(
        ([shopId, fulfillmentType]) => ({
          shopId,
          fulfillmentType,
        })
      );

      const summary = await checkoutService.getPaymentSummary({
        deliveryAddress: address,
        items: cartItems,
        orderValue: cart.subtotal,
        userId: isAuthenticated && user ? user.id : undefined,
        shopFulfillmentPreferences: preferencesArray.length > 0 ? preferencesArray : undefined,
      });

      console.log("Payment summary received:", summary);
      setPaymentSummary(summary);
      
      // Update shops requiring choice based on response
      if (summary.shopSummaries) {
        console.log("Payment summary shop summaries:", summary.shopSummaries);
        console.log("Current shop fulfillment preferences:", Array.from(shopFulfillmentPreferences.entries()));
        
        const hybridShops = summary.shopSummaries.filter(
          (shop) => {
            // Check if shop is HYBRID and either:
            // 1. requiresFulfillmentChoice is explicitly true, OR
            // 2. shopCapability is HYBRID and no fulfillmentType is set (fallback detection)
            const isHybrid = shop.shopCapability === "HYBRID";
            const requiresChoice = shop.requiresFulfillmentChoice === true;
            const hasNoFulfillmentType = !shop.fulfillmentType || shop.fulfillmentType === null;
            const hasPreference = shopFulfillmentPreferences.has(shop.shopId);
            
            const shouldRequireChoice = isHybrid && (requiresChoice || (hasNoFulfillmentType && !hasPreference));
            
            console.log(`Shop ${shop.shopName}: capability=${shop.shopCapability}, requiresFulfillmentChoice=${shop.requiresFulfillmentChoice}, fulfillmentType=${shop.fulfillmentType}, hasPreference=${hasPreference}, shouldRequireChoice=${shouldRequireChoice}`);
            
            return shouldRequireChoice && !hasPreference;
          }
        );
        
        console.log("HYBRID shops requiring choice:", hybridShops);
        
        if (hybridShops.length > 0) {
          setShopsRequiringChoice(
            hybridShops.map((shop) => ({
              shopId: shop.shopId,
              shopName: shop.shopName,
              capability: shop.shopCapability || "HYBRID",
            }))
          );
          
          // Show a message
          toast.info(
            `Please select delivery method for ${hybridShops.length} shop(s) below.`,
            { duration: 6000 }
          );
        } else {
          // Clear if all shops have preferences
          setShopsRequiringChoice([]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching payment summary:", error);
      
      const errorDetails = extractErrorDetails(error);
      
      // Check for shop capability errors
      const errorMessage = errorDetails.message || error?.response?.data?.message || error?.message || "";
      if (errorMessage.toLowerCase().includes("visualization") || 
          errorMessage.toLowerCase().includes("does not accept orders") ||
          errorMessage.toLowerCase().includes("only displays products")) {
        toast.error(
          "Cannot proceed to checkout. Some items in your cart are from shops that only display products and do not accept orders. Please remove these items from your cart.",
          { duration: 8000 }
        );
        // Redirect to cart page
        router.push("/cart");
        return;
      }
      
      // Check for HYBRID shop fulfillment preference errors
      if (errorMessage.toLowerCase().includes("hybrid") && 
          (errorMessage.toLowerCase().includes("specify") || 
           errorMessage.toLowerCase().includes("please specify") ||
           errorMessage.toLowerCase().includes("pickup") && errorMessage.toLowerCase().includes("delivered"))) {
        // Extract shop name from error message if possible
        const shopMatch = errorMessage.match(/Shop '([^']+)'/);
        const shopName = shopMatch ? shopMatch[1] : "a shop";
        
        toast.error(
          `${shopName} is a HYBRID shop. Please select whether you want to pick up at the shop or have it delivered.`,
          { duration: 8000 }
        );
        // Don't return - let the UI show the fulfillment selection
      }
      
      // Check for road validation errors
      if (errorDetails.errorCode === "VALIDATION_ERROR" && 
          (errorDetails.message?.includes("road") || errorDetails.details?.includes("road") ||
           errorDetails.message?.includes("pickup point") || errorDetails.details?.includes("pickup point"))) {
        const roadMessage = errorDetails.message || errorDetails.details || "Please select a pickup point on or near a road.";
        toast.error(roadMessage, {
          duration: 10000,
          style: {
            backgroundColor: '#fef2f2',
            borderColor: '#fecaca',
            color: '#991b1b',
          },
        });
        // Clear the address to force user to select a different location
        setAddressSelected(false);
        setFormData(prev => ({
          ...prev,
          streetAddress: "",
          latitude: undefined,
          longitude: undefined,
        }));
      }
      // Check for country validation errors
      else if (errorDetails.errorCode === "VALIDATION_ERROR" && 
          (errorDetails.message?.includes("don't deliver to") || errorDetails.details?.includes("don't deliver to"))) {
        const countryMessage = errorDetails.message || errorDetails.details || "We don't deliver to this country.";
        toast.error(countryMessage, {
          duration: 10000,
          style: {
            backgroundColor: '#fef2f2',
            borderColor: '#fecaca',
            color: '#991b1b',
          },
        });
        // Clear the address selection to force user to select a different address
        setAddressSelected(false);
        setFormData(prev => ({
          ...prev,
          country: "",
          city: "",
          stateProvince: "",
          streetAddress: "",
          latitude: undefined,
          longitude: undefined,
        }));
      }
      // Check if this is a stock-related error
      else if (errorDetails.details && (errorDetails.details.includes("not available") || errorDetails.details.includes("out of stock"))) {
        const stockMessage = formatStockErrorMessage(errorDetails.details);
        toast.error(stockMessage, {
          duration: 8000,
        });
      } else if (errorDetails.message && (errorDetails.message.includes("not available") || errorDetails.message.includes("out of stock"))) {
        const stockMessage = formatStockErrorMessage(errorDetails.message);
        toast.error(stockMessage, {
          duration: 8000,
        });
      } else {
        toast.error(
          errorDetails.message || "Error calculating shipping and taxes. Please check your address and try again."
        );
      }
      setPaymentSummary(null);
    } finally {
      // Ensure loading state is always reset
      setLoadingSummary(false);
      
      // Safeguard: Force reset loading state after a short delay
      // This handles edge cases where state updates might be batched
      setTimeout(() => {
        setLoadingSummary(false);
      }, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !validatePaymentInfo()) {
      return;
    }

    setSubmitting(true);

    try {
      const cartItems: CartItemDTO[] = cart!.items
        .filter((item) => item.id && item.productId) // Only require id and productId
        .map((item) => {
          // For guest users, id is a string (localStorage itemId)
          // For authenticated users, id might be a number
          let itemId: number | undefined;
          if (isAuthenticated) {
            // For authenticated users, try to parse as number
            const parsedId = parseInt(item.id);
            if (!isNaN(parsedId)) {
              itemId = parsedId;
            }
          }
          // For guest users, we don't need a numeric id

          // Handle variantId if present
          let variantId: number | undefined;
          if (item.variantId) {
            const parsedVariantId = parseInt(item.variantId);
            if (!isNaN(parsedVariantId)) {
              variantId = parsedVariantId;
            }
          }

          const cartItem: any = {
            productId: item.productId, // Keep as string (backend will parse it)
            productName: item.name || "Unknown Product",
            productImage: item.url || "",
            quantity: item.quantity || 1,
            price: item.price || 0,
            totalPrice:
              item.totalPrice || (item.price || 0) * (item.quantity || 1),
            inStock: (item.stock || 0) > 0,
            availableStock: item.stock || 0,
            isVariantBased: !!variantId, // true if variantId exists, false otherwise
            weight: item.weight || 0, // Add weight field for shipping calculation
          };

          if (isAuthenticated && itemId !== undefined) {
            cartItem.id = itemId;
          }

          if (variantId !== undefined) {
            cartItem.variantId = variantId;
          }

          return cartItem;
        })
        .filter((item) => item !== null) as CartItemDTO[]; // Remove null items and type assert

      // Validate that we have valid cart items
      if (cartItems.length === 0) {
        toast.error(
          "No valid items found in cart. Please refresh and try again."
        );
        setSubmitting(false);
        return;
      }

      // Ensure mock coordinates are set if not already present
      let latitude = formData.latitude;
      let longitude = formData.longitude;
      if (!latitude || !longitude) {
        const mockLocation = generateMockLocation(formData.country, formData.city);
        latitude = mockLocation.latitude;
        longitude = mockLocation.longitude;
      }

      // Create address object
      const address: AddressDto = {
        streetAddress: formData.streetAddress,
        city: formData.city,
        state: formData.stateProvince,
        country: formData.country,
        latitude: latitude,
        longitude: longitude,
      };

      let sessionUrl: string;

      // Debug authentication state
      console.log("Authentication state:", {
        isAuthenticated,
        user: user ? { id: user.id, email: user.email } : null,
      });

      // Convert shopFulfillmentPreferences Map to array format
      const preferencesArray = Array.from(shopFulfillmentPreferences.entries()).map(
        ([shopId, fulfillmentType]) => ({
          shopId,
          fulfillmentType,
        })
      );

      if (isAuthenticated && user) {
        // Authenticated user checkout
        const checkoutRequest: CheckoutRequest = {
          items: cartItems,
          shippingAddress: address,
          currency: "usd",
          userId: user.id,
          platform: "web",
          shopFulfillmentPreferences: preferencesArray.length > 0 ? preferencesArray : undefined,
        };

        const response = await OrderService.createCheckoutSession(
          checkoutRequest
        );
        sessionUrl = response.sessionUrl;
      } else {
        // Guest checkout
        const guestCheckoutRequest: GuestCheckoutRequest = {
          guestName: formData.firstName,
          guestLastName: formData.lastName,
          guestEmail: formData.email,
          guestPhone: formData.phoneNumber,
          address: address,
          items: cartItems,
          platform: "web",
          shopFulfillmentPreferences: preferencesArray.length > 0 ? preferencesArray : undefined,
        };

        console.log("Sending guest checkout request:", guestCheckoutRequest);
        const response = await OrderService.createGuestCheckoutSession(
          guestCheckoutRequest
        );
        sessionUrl = response.sessionUrl;
      }

      // Check if this is a mock payment (relative URL) or Stripe session (absolute URL)
      if (sessionUrl.startsWith('/') && !sessionUrl.startsWith('http')) {
        // Mock payment - redirect to success page
        router.push(sessionUrl);
      } else {
        // Real Stripe session - redirect to Stripe
        window.location.href = sessionUrl;
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      
      const errorDetails = extractErrorDetails(error);
      console.error("Extracted error details:", errorDetails);
      
      if (errorDetails.errorCode) {
        console.log("🔍 DEBUG: Error code detected:", errorDetails.errorCode);
        switch (errorDetails.errorCode) {
          case "VALIDATION_ERROR":
            // Handle country validation errors
            if (errorDetails.message?.includes("don't deliver to") || errorDetails.details?.includes("don't deliver to")) {
              const countryMessage = errorDetails.message || errorDetails.details || "We don't deliver to this country.";
              toast.error(countryMessage, {
                duration: 10000, // Longer duration for important country validation messages
                style: {
                  backgroundColor: '#fef2f2',
                  borderColor: '#fecaca',
                  color: '#991b1b',
                },
              });
              // Clear the address selection to force user to select a different address
              setAddressSelected(false);
              setFormData(prev => ({
                ...prev,
                country: "",
                city: "",
                stateProvince: "",
                streetAddress: "",
                latitude: undefined,
                longitude: undefined,
              }));
            } else {
              // Other validation errors
              toast.error(errorDetails.message || errorDetails.details || "Please check your information and try again.");
            }
            break;
          case "PRODUCT_NOT_FOUND":
          case "VARIANT_NOT_FOUND":
            toast.error("One or more products in your cart are no longer available. Please refresh and try again.");
            break;
          case "PRODUCT_INACTIVE":
          case "PRODUCT_NOT_AVAILABLE":
          case "VARIANT_INACTIVE":
          case "VARIANT_NOT_AVAILABLE":
            // Use the enhanced error parser for stock-related issues
            if (errorDetails.details || errorDetails.message) {
              const stockMessage = formatStockErrorMessage(errorDetails.details || errorDetails.message || "");
              toast.error(stockMessage, {
                duration: 8000, // Longer duration for important stock messages
              });
            } else {
              toast.error("Some products in your cart are no longer available for purchase. Please remove them and try again.");
            }
            break;
          case "INSUFFICIENT_STOCK":
            // Enhanced stock error handling
            if (errorDetails.details || errorDetails.message) {
              const stockMessage = formatStockErrorMessage(errorDetails.details || errorDetails.message || "");
              toast.error(stockMessage, {
                duration: 8000,
              });
            } else {
              toast.error("Insufficient stock for one or more items in your cart. Please review your cart and try again.");
            }
            break;
          case "INTERNAL_ERROR":
            console.log("🔍 DEBUG: INTERNAL_ERROR case triggered");
            console.log("🔍 DEBUG: errorDetails.details:", errorDetails.details);
            console.log("🔍 DEBUG: errorDetails.message:", errorDetails.message);
            
            // Handle internal errors that might contain stock information
            if (errorDetails.details && (errorDetails.details.includes("not available") || errorDetails.details.includes("out of stock"))) {
              console.log("🔍 DEBUG: Stock error detected in details, formatting message...");
              const stockMessage = formatStockErrorMessage(errorDetails.details);
              console.log("🔍 DEBUG: Formatted stock message:", stockMessage);
              toast.error(stockMessage, {
                duration: 8000,
              });
            } else if (errorDetails.message && (errorDetails.message.includes("not available") || errorDetails.message.includes("out of stock"))) {
              console.log("🔍 DEBUG: Stock error detected in message, formatting message...");
              const stockMessage = formatStockErrorMessage(errorDetails.message);
              console.log("🔍 DEBUG: Formatted stock message:", stockMessage);
              toast.error(stockMessage, {
                duration: 8000,
              });
            } else {
              console.log("🔍 DEBUG: No stock error detected, showing generic message");
              toast.error(errorDetails.message || "An unexpected error occurred while processing checkout. Please try again later.");
            }
            break;
          default:
            console.log("🔍 DEBUG: Default case triggered for error code:", errorDetails.errorCode);
            // Check if the default case also contains stock information
            if ((errorDetails.details && (errorDetails.details.includes("not available") || errorDetails.details.includes("out of stock"))) ||
                (errorDetails.message && (errorDetails.message.includes("not available") || errorDetails.message.includes("out of stock")))) {
              console.log("🔍 DEBUG: Stock error detected in default case");
              const stockMessage = formatStockErrorMessage(errorDetails.details || errorDetails.message || "");
              toast.error(stockMessage, {
                duration: 8000,
              });
            } else {
              toast.error(errorDetails.message || "Error processing checkout. Please try again later.");
            }
        }
      } else {
        console.log("🔍 DEBUG: No error code detected, showing generic message");
        // Even without error code, check if there's stock information
        const errorMessage = errorDetails.message || error.message || "";
        if (errorMessage.includes("not available") || errorMessage.includes("out of stock")) {
          console.log("🔍 DEBUG: Stock error detected without error code");
          const stockMessage = formatStockErrorMessage(errorMessage);
          toast.error(stockMessage, {
            duration: 8000,
          });
        } else {
          toast.error("Error processing checkout. Please try again later.");
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePointsPayment = () => {
    if (!isAuthenticated || !user) {
      toast.error("Please log in to use points payment");
      return;
    }

    if (!cart || cart.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!formData.streetAddress || !formData.city || !formData.country) {
      toast.error("Please complete your shipping address first");
      return;
    }

    setShowPointsModal(true);
  };

  const handlePointsSuccess = (orderId: number, orderNumber?: string, pointsUsed?: number, pointsValue?: number) => {
    setShowPointsModal(false);
    toast.success("Order placed successfully!");
    
    // Build URL with orderNumber and points information
    const params = new URLSearchParams();
    if (orderNumber) {
      params.set('orderNumber', orderNumber);
    } else {
      params.set('orderId', orderId.toString()); // Fallback to orderId if orderNumber not available
    }
    if (pointsUsed) {
      params.set('pointsUsed', pointsUsed.toString());
    }
    if (pointsValue) {
      params.set('pointsValue', pointsValue.toString());
    }
    
    router.push(`/payment-success?${params.toString()}`);
  };

  const handleHybridPayment = (stripeSessionId: string, orderId: number) => {
    setShowPointsModal(false);
    // Check if this is a mock payment (relative URL) or Stripe session (absolute URL)
    if (stripeSessionId.startsWith('/') && !stripeSessionId.startsWith('http')) {
      // Mock payment - redirect to success page
      router.push(stripeSessionId);
    } else {
      // Real Stripe session - redirect to Stripe
      window.location.href = stripeSessionId;
    }
  };

  const createPointsPaymentRequest = (): PointsPaymentRequest | null => {
    if (!cart || !user) return null;

    const cartItems = cart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId ? parseInt(item.variantId) : undefined,
      quantity: item.quantity,
      price: item.price,
    }));

    const address = {
      streetAddress: formData.streetAddress,
      city: formData.city,
      state: formData.stateProvince,
      country: formData.country,
      latitude: formData.latitude,
      longitude: formData.longitude,
    };

    return {
      userId: user.id,
      items: cartItems,
      shippingAddress: address,
      useAllAvailablePoints: true,
    };
  };

  const validateForm = () => {
    // Required fields for shipping info
    const requiredFields = [
      "email",
      "firstName",
      "lastName",
      "phoneNumber",
      "streetAddress",
      "city",
      "stateProvince",
      "country",
    ];

    let isValid = true;
    const errors: string[] = [];

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        isValid = false;
        errors.push(
          `${
            field.charAt(0).toUpperCase() +
            field.slice(1).replace(/([A-Z])/g, " $1")
          } is required`
        );
      }
    });
    
    // Validate HYBRID shop fulfillment preferences
    if (shopsRequiringChoice.length > 0) {
      const missingChoices = shopsRequiringChoice.filter(
        (shop) => !shopFulfillmentPreferences.has(shop.shopId)
      );
      if (missingChoices.length > 0) {
        isValid = false;
        errors.push(
          `Please select delivery method for ${missingChoices.length} shop(s): ${missingChoices.map(s => s.shopName).join(", ")}`
        );
      }
    }

    // Email validation
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      isValid = false;
      errors.push("Email is not valid");
    }

    // Phone number validation
    if (
      formData.phoneNumber &&
      !/^\+?[0-9\s\-()]{8,20}$/.test(formData.phoneNumber)
    ) {
      isValid = false;
      errors.push("Phone number is not valid");
    }

    // Address validation
    if (formData.city && formData.city.length < 2) {
      isValid = false;
      errors.push("City name must be at least 2 characters long");
    }

    if (
      formData.city &&
      /^(uk|us|ca|au|de|fr|it|es|nl|be|ch|at|se|no|dk|fi)$/i.test(formData.city)
    ) {
      isValid = false;
      errors.push("Please enter a proper city name, not a country code");
    }

    if (!formData.streetAddress) {
      isValid = false;
      errors.push("Street address must be at least 5 characters long");
    }

    // Show errors if any
    if (!isValid) {
      toast.error(
        <div>
          <strong>Please fix the following errors:</strong>
          <ul className="list-disc pl-4 mt-2">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      );
    }

    return isValid;
  };

  const validatePaymentInfo = () => {
    // Since we're using Stripe, payment validation is handled by Stripe
    // We just need to ensure the form is valid
    return true;
  };

  const calculateSubtotal = () => {
    if (!cart) return 0;
    return cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const formatPrice = (price: number) => {
    return formatPriceForInput(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">
          Loading checkout information...
        </p>
      </div>
    );
  }

  // Handle empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">
          Add some products to your cart before proceeding to checkout.
        </p>
        <Button asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" asChild className="mr-2">
          <Link href="/cart">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Return to Cart
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Checkout</h1>
      </div>

      {/* Alert Banner for HYBRID Shops Requiring Selection */}
      {shopsRequiringChoice.length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-1">
                Action Required: Choose Delivery Method
              </h3>
              <p className="text-sm text-orange-800 mb-2">
                {shopsRequiringChoice.length === 1 
                  ? `The shop "${shopsRequiringChoice[0].shopName}" offers both pickup and delivery options. Please select your preferred method below.`
                  : `${shopsRequiringChoice.length} shops in your cart offer both pickup and delivery options. Please select your preferred method for each shop below.`
                }
              </p>
              <p className="text-xs text-orange-700">
                ⚠️ You must select a delivery method before you can proceed to payment.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden animate-slide-in-right card-animation-delay-1">
            <CardHeader className="bg-muted">
              <CardTitle>Customer Details</CardTitle>
              <CardDescription>Enter your contact information</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address*</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number*</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name*</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name*</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden animate-slide-in-right card-animation-delay-2">
            <CardHeader className="bg-muted">
              <CardTitle>Shipping Address</CardTitle>
              <CardDescription>
                Where should we deliver your order?
              </CardDescription>
              
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="streetAddress">Street Address*</Label>
                  <Input
                    id="streetAddress"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={(e) => {
                      handleInputChange(e);
                      handleAddressInput();
                    }}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City*</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={(e) => {
                        handleInputChange(e);
                        handleAddressInput();
                      }}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateProvince">State/Province*</Label>
                    <Input
                      id="stateProvince"
                      name="stateProvince"
                      value={formData.stateProvince}
                      onChange={(e) => {
                        handleInputChange(e);
                        handleAddressInput();
                      }}
                      placeholder="State/Province"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country*</Label>
                  <CountrySelector
                    value={formData.country}
                    onChange={(value) => {
                      handleCountryChange(value);
                      // Clear payment summary when country changes to force recalculation
                      setPaymentSummary(null);
                      setShopsRequiringChoice([]);
                      handleAddressInput();
                    }}
                  />
                  {paymentSummary && paymentSummary.shopSummaries && (
                    <div className="mt-2 space-y-1">
                      {paymentSummary.shopSummaries.map((shop) => (
                        <div key={shop.shopId} className="text-xs">
                          {shop.selectedWarehouseCountry === formData.country ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shop.shopName}: Warehouse available in {formData.country}
                            </span>
                          ) : shop.fulfillmentType === "PICKUP" ? (
                            <span className="text-blue-600 flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {shop.shopName}: Pickup available
                            </span>
                          ) : (
                            <span className="text-orange-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shop.shopName}: Checking warehouse availability...
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {addressSelected && (formData.latitude && formData.longitude) && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-800">Delivery Address Ready</h4>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">
                      {formData.streetAddress}
                    </p>
                    <p className="text-xs text-blue-600">
                      {formData.city}, {formData.stateProvince}, {formData.country}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Special delivery instructions or other notes"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fulfillment Selection for HYBRID Shops - PROMINENT DISPLAY */}
          {shopsRequiringChoice.length > 0 && (
            <Card className="overflow-hidden animate-slide-in-right card-animation-delay-2.5 border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-200 to-blue-300 border-b-2 border-blue-400">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Package className="h-6 w-6 text-blue-700" />
                  <span className="text-lg">Choose Delivery Method for HYBRID Shops</span>
                </CardTitle>
                <CardDescription className="text-blue-800 font-medium">
                  {shopsRequiringChoice.length === 1 
                    ? `"${shopsRequiringChoice[0].shopName}" offers both pickup and delivery. Select your preference:`
                    : `${shopsRequiringChoice.length} shops offer both pickup and delivery. Select your preference for each:`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {shopsRequiringChoice.map((shop) => (
                  <div key={shop.shopId} className="p-5 border-2 border-blue-300 rounded-xl bg-white shadow-md">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-200">
                      <h4 className="font-bold text-base text-gray-900">{shop.shopName}</h4>
                      <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-semibold rounded">
                        HYBRID SHOP
                      </span>
                    </div>
                    <div className="space-y-4">
                      {/* Pickup Option */}
                      <div 
                        onClick={() => {
                          const newPrefs = new Map(shopFulfillmentPreferences);
                          newPrefs.set(shop.shopId, "PICKUP");
                          setShopFulfillmentPreferences(newPrefs);
                          setPaymentSummary(null);
                          setTimeout(() => {
                            if (formData.streetAddress && formData.city && formData.country) {
                              fetchPaymentSummary();
                            }
                          }, 300);
                        }}
                        className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          shopFulfillmentPreferences.get(shop.shopId) === "PICKUP"
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`pickup-${shop.shopId}`}
                          name={`fulfillment-${shop.shopId}`}
                          value="PICKUP"
                          checked={shopFulfillmentPreferences.get(shop.shopId) === "PICKUP"}
                          onChange={() => {
                            const newPrefs = new Map(shopFulfillmentPreferences);
                            newPrefs.set(shop.shopId, "PICKUP");
                            setShopFulfillmentPreferences(newPrefs);
                            setPaymentSummary(null);
                            setTimeout(() => {
                              if (formData.streetAddress && formData.city && formData.country) {
                                fetchPaymentSummary();
                              }
                            }, 300);
                          }}
                          className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`pickup-${shop.shopId}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3 mb-2">
                            <Package className="h-5 w-5 text-blue-600" />
                            <span className="font-bold text-base text-gray-900">Pickup at Shop</span>
                            {shopFulfillmentPreferences.get(shop.shopId) === "PICKUP" && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                SELECTED
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 ml-8">
                            Visit the shop location to collect your order in person. A small packaging fee may apply.
                          </p>
                          <p className="text-xs text-gray-500 ml-8 mt-1">
                            ✓ No shipping costs • ✓ Quick pickup • ✓ Packaging fee applies
                          </p>
                        </label>
                      </div>
                      
                      {/* Delivery Option */}
                      <div 
                        onClick={() => {
                          const newPrefs = new Map(shopFulfillmentPreferences);
                          newPrefs.set(shop.shopId, "DELIVERY");
                          setShopFulfillmentPreferences(newPrefs);
                          setPaymentSummary(null);
                          setTimeout(() => {
                            if (formData.streetAddress && formData.city && formData.country) {
                              fetchPaymentSummary();
                            }
                          }, 300);
                        }}
                        className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          shopFulfillmentPreferences.get(shop.shopId) === "DELIVERY"
                            ? "border-green-500 bg-green-50 shadow-md"
                            : "border-gray-300 bg-gray-50 hover:border-green-300 hover:bg-green-50/50"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`delivery-${shop.shopId}`}
                          name={`fulfillment-${shop.shopId}`}
                          value="DELIVERY"
                          checked={shopFulfillmentPreferences.get(shop.shopId) === "DELIVERY"}
                          onChange={() => {
                            const newPrefs = new Map(shopFulfillmentPreferences);
                            newPrefs.set(shop.shopId, "DELIVERY");
                            setShopFulfillmentPreferences(newPrefs);
                            setPaymentSummary(null);
                            setTimeout(() => {
                              if (formData.streetAddress && formData.city && formData.country) {
                                fetchPaymentSummary();
                              }
                            }, 300);
                          }}
                          className="mt-1 h-5 w-5 text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor={`delivery-${shop.shopId}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3 mb-2">
                            <Truck className="h-5 w-5 text-green-600" />
                            <span className="font-bold text-base text-gray-900">Home Delivery</span>
                            {shopFulfillmentPreferences.get(shop.shopId) === "DELIVERY" && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                SELECTED
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 ml-8">
                            Have your order delivered directly to your address. Shipping costs will be calculated based on your location.
                          </p>
                          <p className="text-xs text-gray-500 ml-8 mt-1">
                            ✓ Convenient delivery • ✓ Shipping costs apply • ✓ Delivered to your door
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        Important Information
                      </p>
                      <p className="text-xs text-blue-800">
                        After selecting your preferred delivery method, the payment summary will automatically recalculate to show the correct costs (packaging fee for pickup or shipping costs for delivery).
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden animate-slide-in-right card-animation-delay-3">
            <CardHeader className="bg-muted">
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                Secure payment powered by Stripe
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-blue-900">
                        Secure Payment
                      </h3>
                      <p className="text-sm text-blue-700">
                        Your payment will be processed securely by Stripe. We
                        accept all major credit cards.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 border rounded-md">
                    <Image
                      src="/visa-icon.png"
                      alt="Visa"
                      width={32}
                      height={20}
                      className="object-contain"
                    />
                    <span className="text-sm font-medium">Visa</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-md">
                    <Image
                      src="/mastercard-icon.png"
                      alt="Mastercard"
                      width={32}
                      height={20}
                      className="object-contain"
                    />
                    <span className="text-sm font-medium">Mastercard</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center py-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <LockIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-muted-foreground">
                      Secured by Stripe • SSL encrypted
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-6 animate-slide-in-left">
            <Card>
              <CardHeader className="bg-muted">
                <CardTitle className="flex items-center justify-between">
                  Order Summary
                  <div className="flex items-center gap-2">
                    {loadingSummary && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Calculating...
                      </div>
                    )}
                    {formData.streetAddress &&
                      formData.city &&
                      formData.country &&
                      !loadingSummary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchPaymentSummary}
                          className="h-6 px-2 text-xs"
                        >
                          Refresh
                        </Button>
                      )}
                  </div>
                </CardTitle>
                <CardDescription>
                  {cart.items.length}{" "}
                  {cart.items.length === 1 ? "item" : "items"} in your cart
                  {paymentSummary && (
                    <span className="block text-blue-600 text-xs mt-1">
                      ✓ Shipping & taxes calculated
                    </span>
                  )}
                  {!paymentSummary &&
                    formData.streetAddress &&
                    formData.city &&
                    formData.country &&
                    !loadingSummary && (
                      <span className="block text-blue-600 text-xs mt-1">
                        ⚠️ Calculating shipping costs...
                      </span>
                    )}
                  {!formData.streetAddress ||
                  !formData.city ||
                  !formData.country ? (
                    <span className="block text-muted-foreground text-xs mt-1">
                      📍 Enter address to calculate shipping
                    </span>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  defaultValue="items"
                >
                  <AccordionItem value="items">
                    <AccordionTrigger>View Cart Items</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      {cart.items.map((item) => (
                        <div key={item.productId} className="flex gap-4">
                          <div className="h-16 w-16 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                            <Link href={`/product/${item.productId}`}>
                              <img
                                src={
                                  item.url ||
                                  "https://placehold.co/100x100?text=Product"
                                }
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            </Link>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-1">
                              {item.name}
                            </p>
                            <div className="flex justify-between mt-1">
                              <span className="text-sm text-muted-foreground">
                                {item.quantity} × {formatPrice(item.price)}
                              </span>
                              <span className="text-sm font-medium">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Separator />

                <div className="space-y-4">
                  {/* Shop Summaries */}
                  {paymentSummary && paymentSummary.shopSummaries && paymentSummary.shopSummaries.length > 0 ? (
                    <div className="space-y-4">
                      {paymentSummary.shopSummaries.map((shop, index) => (
                        <div key={shop.shopId} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{shop.shopName}</h4>
                              {shop.shopCapability && (
                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                  shop.shopCapability === "PICKUP_ORDERS" 
                                    ? "bg-blue-100 text-blue-700"
                                    : shop.shopCapability === "FULL_ECOMMERCE"
                                    ? "bg-green-100 text-green-700"
                                    : shop.shopCapability === "HYBRID"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}>
                                  {shop.shopCapability === "PICKUP_ORDERS" && "Pickup Only"}
                                  {shop.shopCapability === "FULL_ECOMMERCE" && "Full E-commerce"}
                                  {shop.shopCapability === "HYBRID" && "Hybrid"}
                                  {shop.shopCapability === "VISUALIZATION_ONLY" && "Display Only"}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {shop.productCount} {shop.productCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                          
                          {/* Fulfillment Type Badge */}
                          {shop.fulfillmentType && (
                            <div className="mb-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                shop.fulfillmentType === "PICKUP" 
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : "bg-green-100 text-green-700 border border-green-200"
                              }`}>
                                {shop.fulfillmentType === "PICKUP" ? (
                                  <>
                                    <Package className="h-3 w-3" />
                                    Pickup at Shop
                                  </>
                                ) : (
                                  <>
                                    <Truck className="h-3 w-3" />
                                    Home Delivery
                                  </>
                                )}
                              </span>
                            </div>
                          )}
                          
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span className="font-medium">{formatPrice(shop.subtotal)}</span>
                            </div>
                            
                            {shop.discountAmount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Discount</span>
                                <span className="font-medium text-blue-600">
                                  -{formatPrice(shop.discountAmount)}
                                </span>
                              </div>
                            )}
                            
                            {/* Show shipping for delivery, packaging fee for pickup */}
                            {shop.fulfillmentType === "PICKUP" ? (
                              shop.packagingFee && shop.packagingFee > 0 ? (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Packaging Fee</span>
                                  <span className="font-medium">{formatPrice(shop.packagingFee)}</span>
                                </div>
                              ) : null
                            ) : (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                <span className="font-medium">
                                  {shop.shippingCost === 0 ? (
                                    <span className="text-blue-600">Free</span>
                                  ) : (
                                    formatPrice(shop.shippingCost)
                                  )}
                                </span>
                              </div>
                            )}
                            
                            {/* Shop-specific shipping details */}
                            {shop.distanceKm && shop.distanceKm > 0 && (
                              <div className="space-y-1 pl-3 border-l-2 border-muted/50 mt-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Distance</span>
                                  <span className="font-medium">{shop.distanceKm.toFixed(1)} km</span>
                                </div>
                                {shop.costPerKm && shop.costPerKm > 0 && (
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Cost per km</span>
                                    <span className="font-medium">{formatPrice(shop.costPerKm)}/km</span>
                                  </div>
                                )}
                                {shop.selectedWarehouseName && (
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Warehouse</span>
                                    <span className="font-medium">
                                      {shop.selectedWarehouseName}
                                      {shop.selectedWarehouseCountry && ` (${shop.selectedWarehouseCountry})`}
                                    </span>
                                  </div>
                                )}
                                {shop.isInternationalShipping && (
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Type</span>
                                    <span className="font-medium text-orange-600">International</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {shop.rewardPoints > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Reward Points</span>
                                <span className="font-medium text-blue-600">
                                  +{shop.rewardPoints} pts
                                </span>
                              </div>
                            )}
                            
                            <Separator className="my-2" />
                            
                            <div className="flex justify-between font-semibold">
                              <span>Shop Total</span>
                              <span>{formatPrice(shop.totalAmount)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Fallback to old display if no shop summaries */
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">
                          {loadingSummary ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : paymentSummary ? (
                            formatPrice(paymentSummary.subtotal)
                          ) : (
                            formatPrice(cart.subtotal)
                          )}
                        </span>
                      </div>

                      {paymentSummary && paymentSummary.discountAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="font-medium text-blue-600">
                            -{formatPrice(paymentSummary.discountAmount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-medium">
                          {loadingSummary ? (
                            <div className="flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span className="text-xs">Calculating...</span>
                            </div>
                          ) : paymentSummary ? (
                            paymentSummary.shippingCost === 0 ? (
                              <span className="text-blue-600">Free</span>
                            ) : (
                              formatPrice(paymentSummary.shippingCost)
                            )
                          ) : !formData.streetAddress ||
                            !formData.city ||
                            !formData.country ? (
                            <span className="text-xs text-muted-foreground">
                              Enter address
                            </span>
                          ) : (
                            <span className="text-blue-600">Free</span>
                          )}
                        </span>
                      </div>

                      {/* Distance and shipping details */}
                      {paymentSummary &&
                        paymentSummary.distanceKm &&
                        paymentSummary.distanceKm > 0 && (
                          <div className="space-y-1 pl-4 border-l-2 border-muted">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Distance</span>
                              <span className="font-medium">
                                {paymentSummary.distanceKm.toFixed(1)} km
                              </span>
                            </div>
                            {paymentSummary.costPerKm && paymentSummary.costPerKm > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Cost per km</span>
                                <span className="font-medium">
                                  {formatPrice(paymentSummary.costPerKm)}/km
                                </span>
                              </div>
                            )}
                            {paymentSummary.selectedWarehouseName && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">From warehouse</span>
                                <span className="font-medium">
                                  {paymentSummary.selectedWarehouseName}
                                  {paymentSummary.selectedWarehouseCountry &&
                                    ` (${paymentSummary.selectedWarehouseCountry})`}
                                </span>
                              </div>
                            )}
                            {paymentSummary.isInternationalShipping && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Shipping type</span>
                                <span className="font-medium text-orange-600">International</span>
                              </div>
                            )}
                          </div>
                        )}

                      {paymentSummary && paymentSummary.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span className="font-medium">
                            {formatPrice(paymentSummary.taxAmount)}
                          </span>
                        </div>
                      )}
                      
                      {/* Show total packaging fees if any */}
                      {paymentSummary && paymentSummary.shopSummaries && (() => {
                        const totalPackagingFee = paymentSummary.shopSummaries.reduce(
                          (sum, shop) => sum + (shop.packagingFee || 0),
                          0
                        );
                        return totalPackagingFee > 0 ? (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Packaging Fees</span>
                            <span className="font-medium">
                              {formatPrice(totalPackagingFee)}
                            </span>
                          </div>
                        ) : null;
                      })()}

                      {paymentSummary && paymentSummary.rewardPoints > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reward Points</span>
                          <span className="font-medium text-blue-600">
                            +{paymentSummary.rewardPoints} pts
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator className="my-2" />

                  {/* Grand Total */}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>
                      {loadingSummary ? (
                        <div className="flex items-center gap-1">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Calculating...</span>
                        </div>
                      ) : paymentSummary ? (
                        formatPrice(paymentSummary.totalAmount)
                      ) : !formData.streetAddress ||
                        !formData.city ||
                        !formData.country ? (
                        <span className="text-sm text-muted-foreground">
                          Enter address
                        </span>
                      ) : (
                        formatPrice(cart.subtotal)
                      )}
                    </span>
                  </div>

                  {paymentSummary && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        💡 Shipping calculated based on your address and item weight
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 px-6 py-4 flex flex-col gap-4">
                {isAuthenticated && user && (
                  <Button
                    variant="outline"
                    className="w-full border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-800"
                    size="lg"
                    onClick={handlePointsPayment}
                    disabled={
                      submitting ||
                      loadingSummary ||
                      !paymentSummary ||
                      !formData.streetAddress.trim() ||
                      !formData.city.trim() ||
                      !formData.country.trim() ||
                      !formData.email.trim() ||
                      !formData.firstName.trim() ||
                      !formData.lastName.trim() ||
                      shopsRequiringChoice.length > 0
                    }
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Pay with Points
                  </Button>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    loadingSummary ||
                    !paymentSummary ||
                    !formData.streetAddress.trim() ||
                    !formData.city.trim() ||
                    !formData.country.trim() ||
                    !formData.email.trim() ||
                    !formData.firstName.trim() ||
                    !formData.lastName.trim() ||
                    shopsRequiringChoice.length > 0
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirecting to Payment...
                    </>
                  ) : loadingSummary ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Calculating Total...
                    </>
                  ) : shopsRequiringChoice.length > 0 ? (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Select Delivery Method ({shopsRequiringChoice.length})
                    </>
                  ) : !formData.streetAddress ||
                    !formData.city ||
                    !formData.country ? (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Enter Address to Continue
                    </>
                  ) : !paymentSummary ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Proceed to Payment
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  By placing your order, you agree to our{" "}
                  <Link href="#" className="underline hover:text-primary">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="underline hover:text-primary">
                    Privacy Policy
                  </Link>
                </div>

                <div className="pt-2">
                  <PaymentIcons />
                </div>

                <div className="flex items-center justify-center gap-2">
                  <LockIcon className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground">
                    Secure Checkout
                  </span>
                </div>

                <div className="flex items-center justify-center mt-4">
                  <Image
                    src="/secure-payment.png"
                    alt="Secure Payment"
                    width={160}
                    height={30}
                    className="object-contain"
                  />
                </div>
              </CardFooter>
            </Card>

            {/* Support Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our customer service team is available 24/7 to assist you with
                  your order.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    Live Chat
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Call Us
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PointsPaymentModal
        isOpen={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        onSuccess={handlePointsSuccess}
        onHybridPayment={handleHybridPayment}
        paymentRequest={createPointsPaymentRequest() || {
          userId: "",
          items: [],
          shippingAddress: {
            streetAddress: "",
            city: "",
            state: "",
            country: "",
          },
          useAllAvailablePoints: true,
        }}
      />
    </div>
  );
}
