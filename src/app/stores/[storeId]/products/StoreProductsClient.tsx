"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Filter, Search, ArrowLeft, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { StoreService } from "@/lib/storeService";
import {
  ProductService,
  ProductSearchDTO,
  ManyProductsDto,
  Page,
} from "@/lib/productService";

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
}

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
  const [store, setStore] = useState<ShopDetails | null>(null);
  const [products, setProducts] = useState<ManyProductsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 2000],
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

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed for backend
  const itemsPerPage = 12;

  // Fetch shop details
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

  // Fetch products with filters
  const fetchProducts = useCallback(async () => {
    if (!store) return;

    try {
      setProductsLoading(true);

      const searchDTO: ProductSearchDTO = {
        shopId: store.shopId,
        page: currentPage,
        size: itemsPerPage,
        sortBy: sortBy,
        sortDirection: sortDirection,
        name: filters.searchTerm || undefined,
        searchKeyword: filters.searchTerm || undefined,
        basePriceMin: filters.priceRange[0],
        basePriceMax:
          filters.priceRange[1] === 2000 ? undefined : filters.priceRange[1],
        categoryNames:
          filters.categories.length > 0 ? filters.categories : undefined,
        brandNames: filters.brands.length > 0 ? filters.brands : undefined,
        averageRatingMin: filters.rating || undefined,
        inStock: filters.inStock,
        isBestseller: filters.isBestseller || undefined,
        isFeatured: filters.isFeatured || undefined,
        discountIds:
          filters.selectedDiscounts.length > 0
            ? filters.selectedDiscounts
            : undefined,
      };

      console.log("Fetching products with DTO:", searchDTO);

      // Handle variant attributes if present
      if (Object.keys(filters.attributes).length > 0) {
        const attributeFilters: string[] = [];
        Object.entries(filters.attributes).forEach(([type, values]) => {
          values.forEach((val) => {
            attributeFilters.push(`${type}:${val}`);
          });
        });
        searchDTO.variantAttributes = attributeFilters;
      }

      const response: Page<ManyProductsDto> =
        await ProductService.searchProducts(searchDTO);
      setProducts(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setProductsLoading(false);
    }
  }, [store, currentPage, sortBy, sortDirection, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split("-");
    setSortBy(field);
    setSortDirection(direction || "desc");
    setCurrentPage(0);
  };

  const clearAllFilters = () => {
    setFilters({
      priceRange: [0, 2000],
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
    setCurrentPage(0);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!store)
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        Store not found
      </div>
    );

  return (
    <div className="min-h-screen bg-transparent pb-16">
      {/* Header Section */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            className="mb-4 pl-0 hover:bg-transparent hover:text-primary transition-colors"
            onClick={() => router.push(`/stores/${storeId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Profile
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 border-2 border-primary/10 shadow-sm">
                <AvatarImage
                  src={store.logoUrl || undefined}
                  alt={store.name}
                />
                <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                  {store.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2 tracking-tight">
                  {store.name}
                  {store.isActive && (
                    <CheckCircle2 className="h-6 w-6 text-primary fill-primary/10" />
                  )}
                </h1>
                <p className="text-muted-foreground text-base mt-1">
                  Browsing all {totalElements} products from {store.name}
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
              <Input
                placeholder="Search in this shop..."
                className="pl-10 h-11 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all"
                value={filters.searchTerm || ""}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    searchTerm: e.target.value,
                  }));
                  setCurrentPage(0);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <ProductFilters
                filters={filters}
                onFiltersChange={(newFilters) => {
                  setFilters(newFilters);
                  setCurrentPage(0);
                }}
                hideTitle={false}
                shopId={storeId}
              />
            </div>
          </aside>

          {/* Mobile Filter Sheet */}
          <div className="lg:hidden w-full mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full h-11 shadow-sm">
                  <Filter className="mr-2 h-4 w-4" /> Filters & Categories
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[300px] sm:w-[400px] overflow-y-auto p-0"
              >
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-6">Filters</h2>
                  <ProductFilters
                    filters={filters}
                    onFiltersChange={(newFilters) => {
                      setFilters(newFilters);
                      setCurrentPage(0);
                    }}
                    shopId={storeId}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Main Product Grid */}
          <main className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="px-3 py-1 font-medium bg-primary/5 text-primary border-primary/10"
                >
                  {totalElements} Products
                </Badge>
                {productsLoading && (
                  <span className="flex items-center text-sm text-muted-foreground animate-pulse">
                    <Package className="h-4 w-4 mr-2" /> Updating...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap hidden sm:inline">
                  Sort by:
                </span>
                <Select
                  value={`${sortBy}-${sortDirection}`}
                  onValueChange={handleSortChange}
                >
                  <SelectTrigger className="w-full sm:w-[200px] h-10 border-muted-foreground/20 shadow-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">
                      Newest Arrivals
                    </SelectItem>
                    <SelectItem value="price-asc">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-desc">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="productName-asc">
                      Name: A to Z
                    </SelectItem>
                    <SelectItem value="averageRating-desc">
                      Highest Rated
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {productsLoading && products.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-muted rounded-xl aspect-[3/4]" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-2xl bg-muted/10">
                <div className="bg-muted/20 p-6 rounded-full mb-6">
                  <Package className="h-16 w-16 text-muted-foreground/40" />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">
                  No products found
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  We couldn't find any products in this shop matching your
                  current filters. Try relaxing your search criteria.
                </p>
                <Button
                  variant="default"
                  size="lg"
                  onClick={clearAllFilters}
                  className="rounded-full px-8 shadow-md"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {products.map((product) => (
                  <ProductCard
                    key={product.productId}
                    {...ProductService.convertToProductCardFormat(product)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-16 flex justify-center">
                <Pagination className="bg-background rounded-full border shadow-sm px-2 py-1">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 0) setCurrentPage(currentPage - 1);
                        }}
                        className={
                          currentPage === 0
                            ? "opacity-30 pointer-events-none"
                            : "hover:bg-muted"
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }).map((_, i) => {
                      // Only show current page, first, last, and neighbors
                      if (
                        i === 0 ||
                        i === totalPages - 1 ||
                        (i >= currentPage - 1 && i <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              href="#"
                              isActive={currentPage === i}
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(i);
                              }}
                              className={
                                currentPage === i
                                  ? "shadow-sm"
                                  : "hover:bg-muted"
                              }
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (
                        i === currentPage - 2 ||
                        i === currentPage + 2
                      ) {
                        return (
                          <PaginationItem key={i}>
                            <span className="px-2 text-muted-foreground">
                              ...
                            </span>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages - 1)
                            setCurrentPage(currentPage + 1);
                        }}
                        className={
                          currentPage === totalPages - 1
                            ? "opacity-30 pointer-events-none"
                            : "hover:bg-muted"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
