"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Search,
  Star,
  MapPin,
  User,
  Package,
  ArrowRight,
  Filter,
  Users,
  Heart,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import { StoreService, Shop } from "@/lib/storeService";
import { useAppSelector } from "@/lib/store/hooks";
import { toast } from "sonner";

// Static categories for filter
const STORE_CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports",
  "Beauty",
  "Books",
  "Food",
  "Toys",
  "Handmade",
  "Pets",
  "Outdoor",
  "Vintage",
];

type SortOption =
  | "followers-desc"
  | "followers-asc"
  | "rating-desc"
  | "rating-asc"
  | "products-desc"
  | "products-asc"
  | "name-asc"
  | "name-desc";

export function StoresClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // State
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [followingShops, setFollowingShops] = useState<Set<string>>(new Set());
  const [unfollowDialogOpen, setUnfollowDialogOpen] = useState(false);
  const [shopToUnfollow, setShopToUnfollow] = useState<{ id: string; name: string } | null>(null);

  // Filter States (initialized from URL)
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [followedOnly, setFollowedOnly] = useState(
    searchParams.get("followedOnly") === "true"
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "followers-desc"
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );

  // Category pagination state
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [categoryPage, setCategoryPage] = useState(0);
  const [categoryTotalPages, setCategoryTotalPages] = useState(0);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const itemsPerPage = 9;

  // Update URL helper
  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Fetch Shops
  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      // Map frontend sort to backend expected format if needed, but our controller handles the same format keys
      // Controller expects "rating-desc", which matches our SortOption values somewhat.
      // Actually backend handles "rating", "products", "name" split by "-".
      // Our SortOptions: "rating-desc", "products-desc", "name-asc" etc. match this pattern perfectly.

      const response = await StoreService.searchShops(
        searchTerm,
        selectedCategory === "all" ? "" : selectedCategory,
        currentPage - 1, // Backend is 0-indexed
        itemsPerPage,
        sortBy,
        followedOnly && isAuthenticated // Only pass followedOnly if user is authenticated
      );

      setShops(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Failed to fetch shops:", error);
      // Fallback to empty state on error
      setShops([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, currentPage, sortBy, itemsPerPage, followedOnly, isAuthenticated]);

  // Fetch categories
  const fetchCategories = useCallback(async (page: number = 0) => {
    setLoadingCategories(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'}/shop-categories/paginated?page=${page}&size=10`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.content || []);
        setCategoryTotalPages(data.totalPages || 0);
        setCategoryPage(page);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Load categories on mount
  useEffect(() => {
    fetchCategories(0);
  }, [fetchCategories]);

  // Handle follow/unfollow
  const handleFollowToggle = async (shopId: string, isFollowing: boolean) => {
    if (!isAuthenticated) {
      toast.error("Please log in to follow shops");
      router.push("/auth/login");
      return;
    }

    // If unfollowing, show confirmation dialog
    if (isFollowing) {
      const shop = shops.find(s => s.shopId === shopId);
      setShopToUnfollow({ id: shopId, name: shop?.name || "this shop" });
      setUnfollowDialogOpen(true);
      return;
    }

    // If following, proceed directly
    try {
      await StoreService.followShop(shopId);
      toast.success("Following shop");
      // Refresh shops to update follower counts and following status
      fetchShops();
    } catch (error: any) {
      console.error("Error following shop:", error);
      toast.error(error.message || "Failed to follow shop");
    }
  };

  // Handle confirmed unfollow
  const handleConfirmUnfollow = async () => {
    if (!shopToUnfollow) return;

    try {
      await StoreService.unfollowShop(shopToUnfollow.id);
      toast.success("Unfollowed shop");
      setUnfollowDialogOpen(false);
      setShopToUnfollow(null);
      // Refresh shops to update follower counts and following status
      fetchShops();
    } catch (error: any) {
      console.error("Error unfollowing shop:", error);
      toast.error(error.message || "Failed to unfollow shop");
    }
  };

  // Debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShops();
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [fetchShops]);

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    updateUrl({ search: value || null, page: "1" });
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
    updateUrl({ category: value === "all" ? null : value, page: "1" });
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
    updateUrl({ sort: value, page: "1" });
  };

  const handleFollowedOnlyChange = (checked: boolean) => {
    setFollowedOnly(checked);
    setCurrentPage(1);
    updateUrl({ followedOnly: checked ? "true" : null, page: "1" });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setFollowedOnly(false);
    setSortBy("followers-desc");
    setCurrentPage(1);
    router.replace(pathname);
  };

  const renderStars = (rating: number) => {
    const safeRating = typeof rating === "number" ? rating : 0;
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className="h-4 w-4 fill-yellow-400/50 text-yellow-400"
        />
      );
    }

    const emptyStars = 5 - Math.ceil(safeRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  const truncateDescription = (
    text: string | undefined,
    maxLength: number = 120
  ) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Browse Stores</h1>
        <p className="text-muted-foreground">
          Discover amazing shops and find your favorite products
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stores, owners, or locations..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {loadingCategories ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                  {categoryTotalPages > 1 && (
                    <div className="flex items-center justify-between p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (categoryPage > 0) fetchCategories(categoryPage - 1);
                        }}
                        disabled={categoryPage === 0}
                        className="h-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Page {categoryPage + 1} of {categoryTotalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (categoryPage < categoryTotalPages - 1) fetchCategories(categoryPage + 1);
                        }}
                        disabled={categoryPage >= categoryTotalPages - 1}
                        className="h-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="followers-desc">Most Followed</SelectItem>
              <SelectItem value="followers-asc">Least Followed</SelectItem>
              <SelectItem value="rating-desc">Highest Rated</SelectItem>
              <SelectItem value="rating-asc">Lowest Rated</SelectItem>
              <SelectItem value="products-desc">Most Products</SelectItem>
              <SelectItem value="products-asc">Fewest Products</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count and Followed filter */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground h-5">
            {!loading && `Showing ${shops.length} of ${totalElements} stores`}
          </div>
          {isAuthenticated && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={followedOnly}
                onChange={(e) => handleFollowedOnlyChange(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">Stores I Follow</span>
            </label>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[300px] rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : /* Shop Grid */
      shops.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">
            {followedOnly
              ? "You are not following any stores yet. Start following stores to see them here!"
              : "No stores found matching your criteria"}
          </p>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {shops.map((shop) => (
              <Card
                key={shop.shopId}
                className="flex flex-col hover:shadow-lg transition-shadow duration-300"
              >
                {/* Shop Image */}
                <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-gray-100">
                  <Image
                    src={
                      shop.logoUrl ||
                      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop"
                    } // Fallback image
                    alt={shop.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {shop.status === "ACTIVE" && (
                    <Badge
                      variant="default"
                      className="absolute top-2 right-2 bg-primary"
                    >
                      Verified
                    </Badge>
                  )}
                  {shop.category && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm"
                    >
                      {shop.category}
                    </Badge>
                  )}
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1 line-clamp-1">
                        {shop.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          {renderStars(shop.rating)}
                        </div>
                        <span className="text-sm font-medium">
                          {shop.rating?.toFixed(1) || "0.0"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({shop.totalReviews?.toLocaleString() || 0})
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {truncateDescription(shop.description)}
                  </p>
                  
                  {/* Capability Badge */}
                  {shop.primaryCapability && (
                    <div className="mt-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          shop.primaryCapability === "PICKUP_ORDERS"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : shop.primaryCapability === "FULL_ECOMMERCE"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : shop.primaryCapability === "HYBRID"
                            ? "bg-orange-100 text-orange-700 border-orange-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {shop.primaryCapability === "PICKUP_ORDERS" && "Pickup Only"}
                        {shop.primaryCapability === "FULL_ECOMMERCE" && "Full E-commerce"}
                        {shop.primaryCapability === "HYBRID" && "Hybrid"}
                        {shop.primaryCapability === "VISUALIZATION_ONLY" && "Display Only"}
                      </Badge>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                  {/* Owner */}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Owner:</span>
                    <span className="font-medium">
                      {shop.ownerName || "Unknown"}
                    </span>
                  </div>

                  {/* Location */}
                  {shop.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground line-clamp-1">
                        {shop.address}
                      </span>
                    </div>
                  )}

                  {/* Product Count */}
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {shop.productCount?.toLocaleString() || 0} products
                    </span>
                  </div>

                  {/* Follower Count */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {shop.followerCount?.toLocaleString() || 0} followers
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2">
                  <div className="flex gap-2 w-full">
                    <Button
                      className="flex-1"
                      onClick={() => router.push(`/stores/${shop.shopId}`)}
                    >
                      Visit Store
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    {isAuthenticated && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={shop.isFollowing ? "outline" : "default"}
                              size="icon"
                              onClick={() => handleFollowToggle(shop.shopId, shop.isFollowing || false)}
                              className="flex-shrink-0"
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  shop.isFollowing ? "fill-red-500 text-red-500" : ""
                                }`}
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{shop.isFollowing ? "Unfollow store" : "Follow store"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <span className="px-2">...</span>
                        </PaginationItem>
                      );
                    }
                    return null;
                  }
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages)
                        handlePageChange(currentPage + 1);
                    }}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Unfollow Confirmation Dialog */}
      <Dialog open={unfollowDialogOpen} onOpenChange={setUnfollowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unfollow {shopToUnfollow?.name}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to unfollow this shop? You will no longer receive updates about their products and offers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setUnfollowDialogOpen(false);
                setShopToUnfollow(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleConfirmUnfollow}
            >
              Unfollow
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
