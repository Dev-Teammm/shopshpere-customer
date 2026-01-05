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

// Reuse MockShop interface (in a real app this would be shared)
interface MockShop {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  totalReviews: number;
  productCount: number;
  location: string;
  owner: string;
  ownerAvatar: string;
  category: string;
  isVerified: boolean;
  joinedDate: string;
}

// Mock Data (duplicated for now as requested for speed)
const mockShops: MockShop[] = [
  {
    id: "1",
    name: "Tech Haven Electronics",
    description:
      "Your one-stop shop for the latest electronics, gadgets, and tech accessories. We offer premium quality products with excellent customer service and fast shipping.",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
    rating: 4.8,
    totalReviews: 1247,
    productCount: 342,
    location: "New York, USA",
    owner: "John Smith",
    ownerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    category: "Electronics",
    isVerified: true,
    joinedDate: "2020-03-15",
  },
  {
    id: "2",
    name: "Fashion Forward Boutique",
    description:
      "Trendy fashion pieces for the modern wardrobe. From casual wear to elegant evening dresses, we curate the best styles for every occasion.",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
    rating: 4.6,
    totalReviews: 892,
    productCount: 567,
    location: "Los Angeles, USA",
    owner: "Sarah Johnson",
    ownerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    category: "Fashion",
    isVerified: true,
    joinedDate: "2019-07-22",
  },
  {
    id: "3",
    name: "Home & Garden Essentials",
    description:
      "Transform your living space with our curated collection of home decor, furniture, and garden supplies. Quality products for a beautiful home.",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    rating: 4.7,
    totalReviews: 634,
    productCount: 289,
    location: "Chicago, USA",
    owner: "Michael Brown",
    ownerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    category: "Home & Garden",
    isVerified: false,
    joinedDate: "2021-01-10",
  },
  {
    id: "4",
    name: "Sports & Fitness Pro",
    description:
      "Everything you need for your fitness journey. From gym equipment to athletic wear, we support your active lifestyle with premium products.",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    rating: 4.9,
    totalReviews: 2156,
    productCount: 478,
    location: "Miami, USA",
    owner: "Emily Davis",
    ownerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    category: "Sports",
    isVerified: true,
    joinedDate: "2018-11-05",
  },
  {
    id: "5",
    name: "Beauty & Cosmetics Store",
    description:
      "Discover your perfect beauty routine with our extensive collection of skincare, makeup, and beauty tools. Expert-curated products for all skin types.",
    image:
      "https://images.unsplash.com/photo-1522338243-122c23b3ea3b?w=800&h=600&fit=crop",
    rating: 4.5,
    totalReviews: 1873,
    productCount: 623,
    location: "San Francisco, USA",
    owner: "Jessica Martinez",
    ownerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
    category: "Beauty",
    isVerified: true,
    joinedDate: "2020-09-18",
  },
  {
    id: "6",
    name: "Books & Media Hub",
    description:
      "A paradise for book lovers and media enthusiasts. Browse our vast collection of books, e-books, audiobooks, and digital media content.",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop",
    rating: 4.4,
    totalReviews: 456,
    productCount: 1234,
    location: "Seattle, USA",
    owner: "David Wilson",
    ownerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    category: "Books",
    isVerified: false,
    joinedDate: "2021-05-30",
  },
  {
    id: "7",
    name: "Gourmet Food Market",
    description:
      "Premium quality food products from around the world. Organic, artisanal, and specialty foods for the discerning palate.",
    image:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop",
    rating: 4.8,
    totalReviews: 1023,
    productCount: 456,
    location: "Portland, USA",
    owner: "Lisa Anderson",
    ownerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    category: "Food",
    isVerified: true,
    joinedDate: "2019-12-14",
  },
  {
    id: "8",
    name: "Toy Kingdom",
    description:
      "Fun and educational toys for children of all ages. We offer safe, high-quality toys that spark imagination and creativity.",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
    rating: 4.7,
    totalReviews: 789,
    productCount: 234,
    location: "Boston, USA",
    owner: "Robert Taylor",
    ownerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert",
    category: "Toys",
    isVerified: true,
    joinedDate: "2020-06-20",
  },
  {
    id: "9",
    name: "Artisan Crafts Co.",
    description:
      "Handmade and unique artisan products. Support independent creators and discover one-of-a-kind items for your home and lifestyle.",
    image:
      "https://images.unsplash.com/photo-1452860606245-08c77f79b47d?w=800&h=600&fit=crop",
    rating: 4.6,
    totalReviews: 567,
    productCount: 189,
    location: "Austin, USA",
    owner: "Amanda White",
    ownerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda",
    category: "Handmade",
    isVerified: false,
    joinedDate: "2021-08-12",
  },
  {
    id: "10",
    name: "Pet Paradise",
    description:
      "Everything your furry friends need. Premium pet supplies, food, toys, and accessories for dogs, cats, and small animals.",
    image:
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=600&fit=crop",
    rating: 4.9,
    totalReviews: 1456,
    productCount: 378,
    location: "Denver, USA",
    owner: "Chris Thompson",
    ownerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chris",
    category: "Pets",
    isVerified: true,
    joinedDate: "2019-04-08",
  },
  {
    id: "11",
    name: "Outdoor Adventure Gear",
    description:
      "Gear up for your next adventure with our selection of camping, hiking, and outdoor equipment. Quality gear for outdoor enthusiasts.",
    image:
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&h=600&fit=crop",
    rating: 4.7,
    totalReviews: 923,
    productCount: 267,
    location: "Phoenix, USA",
    owner: "Mark Harris",
    ownerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mark",
    category: "Outdoor",
    isVerified: true,
    joinedDate: "2020-02-25",
  },
  {
    id: "12",
    name: "Vintage Collectibles",
    description:
      "Discover rare and unique vintage items. From collectibles to antiques, find treasures from the past for your collection.",
    image:
      "https://images.unsplash.com/photo-1503602642452-3eee4d1b0c1e?w=800&h=600&fit=crop",
    rating: 4.5,
    totalReviews: 345,
    productCount: 156,
    location: "Nashville, USA",
    owner: "Patricia Garcia",
    ownerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Patricia",
    category: "Vintage",
    isVerified: false,
    joinedDate: "2021-10-15",
  },
];

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  category: string;
}

const mockProducts: Product[] = [
  {
    id: "p1",
    name: "Premium Wireless Headphones",
    price: 139.99,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
    category: "Electronics",
  },
  {
    id: "p2",
    name: "Smart Fitness Watch",
    price: 199.5,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
    category: "Electronics",
  },
  {
    id: "p3",
    name: "Ultra HD 4K Camera",
    price: 849.0,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop",
    category: "Electronics",
  },
  {
    id: "p4",
    name: "Mechanical Keyboard",
    price: 129.99,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1587829741301-3e47d159be43?w=500&h=500&fit=crop",
    category: "Electronics",
  },
];

export function StoreProfileClient({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [store, setStore] = useState<MockShop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      const foundStore = mockShops.find((s) => s.id === storeId);
      setStore(foundStore || null);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
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
          src={store.image}
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
                    <AvatarImage src={store.ownerAvatar} alt={store.owner} />
                    <AvatarFallback>
                      {store.owner.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {store.isVerified && (
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
                      <p className="font-medium">{store.owner}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        Location
                      </p>
                      <p className="font-medium">{store.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        Joined
                      </p>
                      <p className="font-medium">{store.joinedDate}</p>
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
                  Products
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

              <TabsContent
                value="products"
                className="animate-in fade-in-50 duration-500"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Featured Products</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  {mockProducts.slice(0, 4).map((product) => (
                    <Card
                      key={product.id}
                      className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="rounded-full shadow-md h-8 w-8"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                              {product.category}
                            </p>
                            <h4 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                              {product.name}
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-end justify-between mt-2">
                          <span className="text-lg font-bold">
                            ${product.price.toFixed(2)}
                          </span>
                          <div className="flex items-center text-sm text-yellow-500">
                            <Star className="fill-current w-3.5 h-3.5 mr-1" />
                            {product.rating}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button
                          className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
                          size="sm"
                        >
                          Add to Cart
                        </Button>
                      </CardFooter>
                    </Card>
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
                      community since {new Date(store.joinedDate).getFullYear()}
                      . Our mission is to provide high-quality{" "}
                      {store.category.toLowerCase()} products at affordable
                      prices.
                    </p>
                    <p>
                      Located in {store.location}, we take pride in our fast
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
