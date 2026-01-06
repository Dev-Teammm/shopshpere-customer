"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Star,
  Calendar,
  Package,
  User,
  CheckCircle2,
  ArrowLeft,
  Search,
  Filter,
  Share2,
  Heart,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StoreService } from "@/lib/storeService";
import ProductCard from "@/components/ProductCard";

interface Product {
  productId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  primaryImage: string | null;
  rating: number;
  reviewCount: number;
  categoryName: string | null;
  isInStock: boolean;
  brandName?: string | null;
  shortDescription?: string | null;
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
  hasActiveDiscount?: boolean;
  discountPercentage?: number;
}

interface ShopDetails {
  shopId: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  category: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  status: string;
  rating: number;
  totalReviews: number;
  productCount: number;
  createdAt: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
  };
  featuredProducts: Product[];
}

export function StoreProfileClient({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [store, setStore] = useState<ShopDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreDetails = async () => {
      try {
        setLoading(true);
        const data = await StoreService.getShopDetails(storeId);
        setStore(data);
      } catch (error) {
        console.error("Error fetching store details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchStoreDetails();
    }
  }, [storeId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-lg text-muted-foreground">
          Loading store profile...
        </p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-3xl font-bold mb-4">Store Not Found</h2>
        <p className="text-muted-foreground mb-8 text-lg">
          The store you are looking for does not exist or has been removed.
        </p>
        <Button onClick={() => router.push("/stores")} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stores
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Banner with Glassmorphism */}
      <div className="relative h-[300px] w-full bg-muted overflow-hidden">
        <Image
          src={
            store.logoUrl ||
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop"
          }
          alt={store.name}
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />

        {/* Top Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
          <Button
            variant="secondary"
            size="sm"
            className="backdrop-blur-md bg-transparent/20 hover:bg-transparent/40 text-white border-white/20"
            onClick={() => router.push("/stores")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Info Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl border-border/50 backdrop-blur-sm bg-background/95">
              <CardHeader className="flex flex-col items-center text-center pt-8">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-md">
                    <AvatarImage
                      src={
                        store.logoUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${store.name}`
                      }
                      alt={store.name}
                    />
                    <AvatarFallback>
                      {store.name.substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {store.isActive && (
                    <Badge className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0 flex items-center justify-center bg-primary border-4 border-background">
                      <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                    </Badge>
                  )}
                </div>

                <h1 className="mt-4 text-2xl font-bold">{store.name}</h1>
                <div className="flex items-center gap-1 mt-2 text-yellow-500">
                  <Star className="fill-current w-5 h-5" />
                  <span className="font-semibold text-foreground">
                    {store.rating}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    ({store.totalReviews} reviews)
                  </span>
                </div>

                <Badge variant="secondary" className="mt-4 text-base px-4 py-1">
                  {store.category}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-6">
                <p className="text-center text-muted-foreground leading-relaxed">
                  {store.description}
                </p>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        Owner
                      </p>
                      <p className="font-medium">
                        {store.owner.firstName} {store.owner.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        Location
                      </p>
                      <p className="font-medium">{store.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        Member Since
                      </p>
                      <p className="font-medium">
                        {new Date(store.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        Products
                      </p>
                      <p className="font-medium">{store.productCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pb-8">
                <Button className="w-full h-11 text-base shadow-lg hover:shadow-primary/20 transition-all">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact Seller
                </Button>
                <Button variant="outline" className="w-full h-11">
                  <Heart className="mr-2 h-4 w-4" />
                  Follow Store
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Main Content Areas */}
          <div className="lg:col-span-2 mt-8 lg:mt-20">
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="w-full justify-start h-12 bg-transparent border-b rounded-none p-0 gap-8 mb-8">
                <TabsTrigger
                  value="products"
                  className="rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-base px-0 pb-3"
                >
                  Products ({store.productCount})
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-base px-0 pb-3"
                >
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-base px-0 pb-3"
                >
                  Reviews ({store.totalReviews})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Featured Products</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {store.featuredProducts.map((product) => (
                    <ProductCard
                      key={product.productId}
                      id={product.productId}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.compareAtPrice || product.price}
                      discountedPrice={product.price}
                      discount={product.discountPercentage}
                      rating={product.rating}
                      reviewCount={product.reviewCount}
                      image={
                        product.primaryImage ||
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop"
                      }
                      category={product.categoryName || undefined}
                      brand={product.brandName || undefined}
                      shortDescription={product.shortDescription || undefined}
                      isNew={product.isNew}
                      isBestseller={product.isBestseller}
                      isFeatured={product.isFeatured}
                      hasActiveDiscount={product.hasActiveDiscount}
                    />
                  ))}
                </div>

                <div className="flex justify-center pb-8 border-b">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 px-8 rounded-full border-primary/50 text-primary hover:bg-primary hover:text-white transition-all"
                    onClick={() => router.push(`/stores/${storeId}/products`)}
                  >
                    Explore More Products
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent
                value="about"
                className="animate-in fade-in-50 duration-500"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>About {store.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-muted-foreground">
                    <p>
                      Welcome to {store.name}! We have been serving our
                      community since {new Date(store.createdAt).getFullYear()}.
                      Our mission is to provide high-quality{" "}
                      {store.category?.toLowerCase() || "premium"} products at
                      affordable prices.
                    </p>
                    <p>
                      Located in {store.address}, we take pride in our fast
                      shipping and excellent customer support. Every product is
                      carefully selected and inspected before shipping.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <h4 className="text-2xl font-bold text-primary mb-1">
                          100%
                        </h4>
                        <p className="text-sm">Authentic Products</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <h4 className="text-2xl font-bold text-primary mb-1">
                          24/7
                        </h4>
                        <p className="text-sm">Support</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="reviews"
                className="animate-in fade-in-50 duration-500"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6 p-6 bg-muted/50 rounded-xl">
                    <div className="text-center">
                      <span className="text-5xl font-bold text-foreground">
                        {store.rating}
                      </span>
                      <div className="flex justify-center my-2 text-yellow-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(store.rating)
                                ? "fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {store.totalReviews} Global Ratings
                      </p>
                    </div>
                    <div className="flex-1 border-l pl-6 space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-sm w-3">{rating}</span>
                          <Star className="w-3 h-3 text-muted-foreground" />
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-500"
                              style={{
                                width:
                                  rating === 5
                                    ? "70%"
                                    : rating === 4
                                    ? "20%"
                                    : "5%",
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">
                            {rating === 5 ? "70%" : rating === 4 ? "20%" : "5%"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mock Reviews */}
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>U{i}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">
                                Happy Customer {i}
                              </p>
                              <div className="flex items-center text-yellow-500 text-xs">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className="w-3 h-3 fill-current"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            2 days ago
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          "Absolutely love the products from this store!
                          Shipping was super fast and the packaging was
                          beautiful. Will definitely order again."
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
