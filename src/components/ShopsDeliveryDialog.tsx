"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Loader2, MapPin, Store, ChevronLeft, ChevronRight, X } from "lucide-react";
import { shopDeliveryService, type ShopDeliveryInfo } from "@/lib/services/shopDeliveryService";
import Link from "next/link";
import Image from "next/image";

interface ShopsDeliveryDialogProps {
  country: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHOPS_PER_PAGE = 10;

export function ShopsDeliveryDialog({
  country,
  open,
  onOpenChange,
}: ShopsDeliveryDialogProps) {
  const [shops, setShops] = useState<ShopDeliveryInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchShops = async (page: number = 0, search?: string) => {
    try {
      setIsLoading(true);
      const response = await shopDeliveryService.getShopsDeliveringToCountry(
        country,
        page,
        SHOPS_PER_PAGE,
        search
      );
      setShops(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Error fetching shops:", error);
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && country) {
      setSearchTerm("");
      setCurrentPage(0);
      fetchShops(0);
    }
  }, [open, country]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
    fetchShops(0, value);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchShops(newPage, searchTerm || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <DialogTitle>Shops Delivering to {country}</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {totalElements > 0
              ? `${totalElements} shop${totalElements !== 1 ? "s" : ""} deliver${totalElements !== 1 ? "" : "s"} to ${country}`
              : `No shops currently deliver to ${country}`}
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shops..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Separator />

        {/* Shops List */}
        <ScrollArea className="flex-1 min-h-[300px] max-h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading shops...
              </span>
            </div>
          ) : shops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Store className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {searchTerm
                  ? "No shops found matching your search"
                  : `No shops currently deliver to ${country}`}
              </p>
              {searchTerm && (
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search terms
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 p-2">
              {shops.map((shop) => (
                <Link
                  key={shop.shopId}
                  href={`/stores/${shop.shopSlug || shop.shopId}`}
                  className="block"
                >
                  <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="h-16 w-16 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                      {shop.logoUrl ? (
                        <Image
                          src={shop.logoUrl}
                          alt={shop.shopName}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Store className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm line-clamp-1">
                          {shop.shopName}
                        </h4>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            shop.capability === "HYBRID"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {shop.capability === "HYBRID" ? "Hybrid" : "Full E-commerce"}
                        </Badge>
                      </div>
                      {shop.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {shop.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-between px-2 py-3">
              <div className="text-xs text-muted-foreground">
                Page {currentPage + 1} of {totalPages} ({totalElements} shops)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="h-8"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
