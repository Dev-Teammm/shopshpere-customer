"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Filter, Search, ArrowLeft, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProductFilters from "@/components/ProductFilters";
import ProductCard from "@/components/ProductCard";
import { FilterOptions } from "@/lib/filterService";

// --- Mock Data Definitions (Duplicated from StoreProfileClient for isolation) ---

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

const mockShops: MockShop[] = [
  {
    id: "1",
    name: "Tech Haven Electronics",
    description:
      "Your one-stop shop for the latest electronics, gadgets, and tech accessories.",
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
    id: "10",
    name: "Pet Paradise",
    description:
      "Everything your furry friends need. Premium pet supplies, food, toys, and accessories.",
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
  // Add more from previous file if needed, but these are enough for testing store 10
];

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  category: string;
  storeId?: string; // Optional linkage
}

// Generate more mock products for demonstration
const generateMockProducts = (count: number): Product[] => {
  const categories = [
    "Electronics",
    "Clothing",
    "Home",
    "Sports",
    "Beauty",
    "Pets",
  ];
  const productImages = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop", // Watch
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop", // Headphones
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop", // Shoes
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop", // Camera
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500&h=500&fit=crop", // Dog Food
    "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&h=500&fit=crop", // Laptop
    "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&h=500&fit=crop", // Dog Toy
    "https://images.unsplash.com/photo-1587829741301-3e47d159be43?w=500&h=500&fit=crop", // Keyboard
  ];

  return Array.from({ length: count }).map((_, i) => ({
    id: `p${i + 10}`, // Offset ID
    name: `Product ${i + 1} - ${categories[i % categories.length]}`,
    price: Math.floor(Math.random() * 200) + 10,
    rating: (Math.floor(Math.random() * 20) + 30) / 10,
    image: productImages[i % productImages.length],
    category: categories[i % categories.length],
    storeId: "10", // Force all to store 10 for demo purposes unless otherwise specified
  }));
};

// Static initial list for stability
const initialMockProducts: Product[] = [
  {
    id: "p1",
    name: "Premium Wireless Headphones",
    price: 139.99,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
    category: "Electronics",
    storeId: "1",
  },
  {
    id: "p2",
    name: "Smart Fitness Watch",
    price: 199.5,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
    category: "Electronics",
    storeId: "1",
  },
  {
    id: "p3",
    name: "Luxury Dog Bed",
    price: 89.99,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=500&h=500&fit=crop",
    category: "Pets",
    storeId: "10",
  },
  {
    id: "p4",
    name: "Organic Cat Food",
    price: 24.99,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500&h=500&fit=crop",
    category: "Pets",
    storeId: "10",
  },
  {
    id: "p5",
    name: "Interactive Dog Toy",
    price: 15.5,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&h=500&fit=crop",
    category: "Pets",
    storeId: "10",
  },
  {
    id: "p6",
    name: "Pet Grooming Kit",
    price: 45.0,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&h=500&fit=crop",
    category: "Pets",
    storeId: "10",
  },
];

// Combine static and generated
const allMockProducts = [
  ...initialMockProducts,
  ...generateMockProducts(20).map((p) => ({ ...p, category: "Pets" })),
];

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

export function StoreProductsClient({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [store, setStore] = useState<MockShop | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter States compatible with ProductFilters
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 1000],
    categories: [],
    brands: [],
    attributes: {},
    selectedDiscounts: [],
    rating: null,
    inStock: true,
    isBestseller: false,
    isFeatured: false,
    searchTerm: "",
  });

  const [sortBy, setSortBy] = useState("rating-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Initial Data Load
  useEffect(() => {
    const timer = setTimeout(() => {
      const foundStore = mockShops.find((s) => s.id === storeId);
      setStore(foundStore || null);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [storeId]);

  // Derived Data
  const filteredProducts = useMemo(() => {
    if (!store) return [];

    // 1. Filter by Store (Mock logic: for store 10, show only pet/store 10 items)
    // For demo purposes, if products don't strictly have storeId, we fallback to category matching loosely or show all for that mockup
    let filtered = allMockProducts.filter((p) => {
      if (p.storeId === storeId) return true;
      // Fallback for demo: if store is Pet Paradise, show only Pets category items
      return store.category === "Pets" && p.category === "Pets";
    });

    // 2. Search Term
    if (filters.searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(filters.searchTerm!.toLowerCase())
      );
    }

    // 3. Price Range
    filtered = filtered.filter(
      (p) =>
        p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // 4. Categories
    if (filters.categories.length > 0) {
      filtered = filtered.filter((p) =>
        filters.categories.includes(p.category)
      );
    }

    // 5. Rating
    if (filters.rating) {
      filtered = filtered.filter((p) => p.rating >= filters.rating!);
    }

    // Note: Brand, Attributes, etc. are ignored for this mock data simply because mock data doesn't have them populated well
    // but the ProductFilters component will still emit them if selected.

    // 6. Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "rating-desc":
          return b.rating - a.rating;
        case "name-asc":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [store, filters, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Generate Custom Options for ProductFilters based on available data
  const customFilterOptions: FilterOptions = useMemo(() => {
    // Get all categories from the products relevant to this store
    const storeProducts = allMockProducts.filter(
      (p) => store && (p.storeId === store.id || p.category === store.category)
    );

    // Extract unique categories
    const categoriesList = Array.from(
      new Set(storeProducts.map((p) => p.category))
    ).map((name, index) => ({
      categoryId: index + 1,
      name: name,
      slug: name.toLowerCase(),
      productCount: storeProducts.filter((p) => p.category === name).length,
      subcategories: [],
    }));

    return {
      categories: categoriesList,
      brands: [], // Mock data doesn't have brands populated
      attributes: [],
      priceRange: { min: 0, max: 1000 },
    };
  }, [store]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!store) return <div>Store not found</div>;

  return (
    <div className="min-h-screen bg-transparent pb-16">
      {/* Header Section */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
            onClick={() => router.push(`/stores/${storeId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Profile
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/10">
                <AvatarImage src={store.ownerAvatar} />
                <AvatarFallback>{store.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {store.name}
                  {store.isVerified && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Browsing all products from {store.name}
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in this shop..."
                className="pl-9"
                value={filters.searchTerm || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchTerm: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <ProductFilters
              filters={filters}
              onFiltersChange={setFilters}
              customOptions={customFilterOptions}
              hideTitle={true}
            />
          </div>

          {/* Mobile Filter Sheet */}
          <div className="lg:hidden w-full">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[300px] sm:w-[350px] overflow-y-auto"
              >
                <ProductFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  customOptions={customFilterOptions}
                />
              </SheetContent>
            </Sheet>
          </div>

          {/* Main Product Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} products
              </p>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating-desc">Highest Rated</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paginatedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
                <Package className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No products found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or search terms.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      priceRange: [0, 1000],
                      categories: [],
                      brands: [],
                      attributes: {},
                      selectedDiscounts: [],
                      rating: null,
                      inStock: true,
                      isBestseller: false,
                      isFeatured: false,
                      searchTerm: "",
                    });
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    rating={product.rating}
                    reviewCount={Math.floor(Math.random() * 100) + 1}
                    image={product.image}
                    category={product.category}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={
                          currentPage === 1
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === i + 1}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(i + 1);
                          }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages)
                            setCurrentPage(currentPage + 1);
                        }}
                        className={
                          currentPage === totalPages
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
