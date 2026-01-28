"use client";

import { useState, useEffect } from "react";
import { MapPin, Truck, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { locationService, type DeliveryStatus as DeliveryStatusType } from "@/lib/services/locationService";
import { DeliveryCountriesDropdown } from "@/components/DeliveryCountriesDropdown";
import { shopDeliveryService } from "@/lib/services/shopDeliveryService";

interface DeliveryStatusProps {
  className?: string;
}

export function DeliveryStatus({ className = "" }: DeliveryStatusProps) {
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatusType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkDeliveryStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await locationService.checkDeliveryAvailability();
      setDeliveryStatus(status);
      
      // If we got a status but it shows as unavailable due to API issues, 
      // still show the country information
      if (status.country === 'Unknown') {
        setError('Location detection failed');
      }
    } catch (err) {
      setError('Failed to check delivery status');
      console.error('Delivery status check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkDeliveryStatus();
  }, []);

  const handleRefresh = () => {
    locationService.clearCache();
    checkDeliveryStatus();
  };

  const handleCountrySelect = async (country: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check delivery for the selected country
      const status = await locationService.checkDeliveryForCountry(country);
      
      // Check if shops deliver to this country
      try {
        const countries = await shopDeliveryService.getCountriesWithDelivery();
        const countryInfo = countries.find(c => c.country.toLowerCase() === country.toLowerCase());
        if (countryInfo) {
          setShopCount(countryInfo.shopCount);
          if (countryInfo.shopCount > 0) {
            status.available = true;
            status.message = `${countryInfo.shopCount} shop${countryInfo.shopCount > 1 ? 's' : ''} deliver${countryInfo.shopCount > 1 ? '' : 's'} to ${country}`;
          } else {
            status.available = false;
            status.message = `No shops currently deliver to ${country}`;
          }
        } else {
          status.available = false;
          status.message = `No shops currently deliver to ${country}`;
          setShopCount(0);
        }
      } catch (err) {
        console.error('Error checking shop delivery:', err);
      }
      
      setDeliveryStatus(status);
    } catch (err) {
      setError('Failed to check delivery for selected country');
      console.error('Country selection failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Checking delivery...</span>
      </div>
    );
  }

  if (error || !deliveryStatus) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className={`flex items-center gap-2 h-auto p-2 ${className}`}
            >
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Location unavailable</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to retry location detection</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2 h-auto p-2 hover:bg-accent/50"
            >
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {deliveryStatus.country}
              </span>
              {deliveryStatus.available ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Truck className="h-3 w-3 mr-1" />
                  We deliver
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  No delivery
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">{deliveryStatus.country}</p>
              <p className="text-sm text-muted-foreground">
                {deliveryStatus.message}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click to refresh location
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Countries Dropdown */}
      <DeliveryCountriesDropdown 
        currentCountry={deliveryStatus.country}
        onCountrySelect={handleCountrySelect}
      />
    </div>
  );
}
