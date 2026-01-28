"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, Search, MapPin, Truck, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { shopDeliveryService, type CountryDeliveryInfo } from "@/lib/services/shopDeliveryService";
import { ShopsDeliveryDialog } from "@/components/ShopsDeliveryDialog";

interface DeliveryCountriesDropdownProps {
  className?: string;
  currentCountry?: string;
  onCountrySelect?: (country: string) => void;
}

const ITEMS_PER_PAGE = 8;

export function DeliveryCountriesDropdown({ 
  className = "", 
  currentCountry,
  onCountrySelect 
}: DeliveryCountriesDropdownProps) {
  const [countries, setCountries] = useState<CountryDeliveryInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountryForShops, setSelectedCountryForShops] = useState<string | null>(null);
  const [showShopsDialog, setShowShopsDialog] = useState(false);

  // Fetch available countries with shop counts
  const fetchCountries = async () => {
    try {
      setIsLoading(true);
      const countriesData = await shopDeliveryService.getCountriesWithDelivery();
      // Sort alphabetically by country name
      const sortedCountries = countriesData.sort((a, b) => 
        a.country.localeCompare(b.country)
      );
      setCountries(sortedCountries);
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && countries.length === 0) {
      fetchCountries();
    }
  }, [isOpen, countries.length]);

  // Filter countries based on search term
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return countries;
    return countries.filter(countryInfo =>
      countryInfo.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [countries, searchTerm]);

  // Paginate filtered countries
  const paginatedCountries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCountries.slice(startIndex, endIndex);
  }, [filteredCountries, currentPage]);

  const totalPages = Math.ceil(filteredCountries.length / ITEMS_PER_PAGE);

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleCountrySelect = (country: string) => {
    onCountrySelect?.(country);
    setIsOpen(false);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleShopCountClick = (e: React.MouseEvent, country: string) => {
    e.stopPropagation();
    setSelectedCountryForShops(country);
    setShowShopsDialog(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 h-auto p-2 hover:bg-accent/50 ${className}`}
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {currentCountry || "Select Country"}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0"
        sideOffset={8}
      >
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Delivery Countries</h3>
            </div>
            <Badge variant="secondary" className="ml-auto text-xs">
              {isLoading ? (
                <div className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading...
                </div>
              ) : (
                `${countries.length} ${countries.length === 1 ? 'country' : 'countries'}`
              )}
            </Badge>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <Separator />

        {/* Countries List */}
        <ScrollArea className="h-64">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading countries...
                </span>
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "No countries found" : "No delivery countries available"}
                </p>
                {searchTerm && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Try adjusting your search
                  </p>
                )}
              </div>
            ) : (
              <>
                {paginatedCountries.map((countryInfo) => (
                  <div
                    key={countryInfo.country}
                    className={`w-full mb-1 border rounded-lg transition-all duration-200 ${
                      currentCountry === countryInfo.country ? 'bg-accent border-primary/20 shadow-sm' : 'border-transparent'
                    }`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCountrySelect(countryInfo.country)}
                      className="w-full justify-start h-auto p-3 hover:bg-accent/50"
                    >
                      <div className="flex items-center w-full">
                        <MapPin className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium text-left flex-1">
                          {countryInfo.country}
                        </span>
                        <div className="flex items-center gap-2 ml-2">
                          {currentCountry === countryInfo.country && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Button>
                    <div className="px-3 pb-2 flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleShopCountClick(e, countryInfo.country)}
                        className="h-6 px-2 text-xs hover:bg-primary/10 text-primary"
                      >
                        <Truck className="h-3 w-3 mr-1" />
                        {countryInfo.shopCount} shop{countryInfo.shopCount !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Pagination */}
        {!isLoading && filteredCountries.length > ITEMS_PER_PAGE && (
          <>
            <Separator />
            <div className="p-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages} 
                <span className="ml-1">
                  ({filteredCountries.length} countries)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="h-7 px-2"
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-7 px-2"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <Separator />
        <div className="p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            We're constantly expanding our delivery network
          </p>
        </div>
      </DropdownMenuContent>
      
      {/* Shops Dialog */}
      {selectedCountryForShops && (
        <ShopsDeliveryDialog
          country={selectedCountryForShops}
          open={showShopsDialog}
          onOpenChange={setShowShopsDialog}
        />
      )}
    </DropdownMenu>
  );
}
