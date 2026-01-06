import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  X,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  PercentIcon,
  AlertCircle,
  Loader2,
  Clock,
  Search,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { FilterService, FilterOptions, FilterError } from "@/lib/filterService";
import { discountService, DiscountInfo } from "@/lib/discountService";
import CountdownTimer from "@/components/CountdownTimer";

interface ProductFiltersProps {
  filters: any;
  onFiltersChange: (filters: any | ((prevFilters: any) => any)) => void;
  customOptions?: FilterOptions;
  hideTitle?: boolean;
  shopId?: string;
}

const ProductFilters = ({
  filters,
  onFiltersChange,
  customOptions,
  hideTitle = false,
  shopId,
}: ProductFiltersProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null
  );
  const [filterErrors, setFilterErrors] = useState<FilterError[]>([]);
  const [isLoading, setIsLoading] = useState(!customOptions);
  const [retryCount, setRetryCount] = useState(0);
  const [localPriceRange, setLocalPriceRange] = useState(
    filters.priceRange || [0, 1000]
  );
  const priceRangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingPriceRef = useRef(false);

  // Discount state
  const [activeDiscounts, setActiveDiscounts] = useState<DiscountInfo[]>([]);
  const [discountsLoading, setDiscountsLoading] = useState(true);
  const [discountsError, setDiscountsError] = useState<string | null>(null);

  // Search state for categories and brands
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [searchedCategories, setSearchedCategories] = useState<any[]>([]);
  const [searchedBrands, setSearchedBrands] = useState<any[]>([]);
  const [categorySearchLoading, setCategorySearchLoading] = useState(false);
  const [brandSearchLoading, setBrandSearchLoading] = useState(false);
  const categorySearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const brandSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Attribute types state
  const [attributeTypes, setAttributeTypes] = useState<any[]>([]);
  const [attributeTypesLoading, setAttributeTypesLoading] = useState(false);
  const [attributeTypeSearch, setAttributeTypeSearch] = useState("");
  const [searchedAttributeTypes, setSearchedAttributeTypes] = useState<any[]>(
    []
  );
  const [attributeTypeSearchLoading, setAttributeTypeSearchLoading] =
    useState(false);
  const attributeTypeSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [expandedAttributeTypes, setExpandedAttributeTypes] = useState<
    number[]
  >([]);
  const [attributeValues, setAttributeValues] = useState<Record<number, any[]>>(
    {}
  );
  const [attributeValueSearch, setAttributeValueSearch] = useState<
    Record<number, string>
  >({});
  const [attributeValueSearchLoading, setAttributeValueSearchLoading] =
    useState<Record<number, boolean>>({});
  const attributeValueSearchTimeoutRefs = useRef<
    Record<number, NodeJS.Timeout | null>
  >({});

  // Load filter options from backend
  useEffect(() => {
    if (customOptions) {
      setFilterOptions(customOptions);
      setIsLoading(false);
    } else {
      loadFilterOptions(shopId);
    }
    loadActiveDiscounts(shopId);
  }, [customOptions, shopId]);

  useEffect(() => {
    if (!isUpdatingPriceRef.current && filters.priceRange) {
      setLocalPriceRange(filters.priceRange);
    }
  }, [filters.priceRange]);

  const loadFilterOptions = async (sid?: string) => {
    setIsLoading(true);
    try {
      // Fetch limited categories and brands with product counts (10 each)
      const [categoriesResult, brandsResult, attributesResult] =
        await Promise.allSettled([
          FilterService.fetchCategoriesWithProductCount(0, 10, sid),
          FilterService.fetchBrandsWithProductCount(0, 10, sid),
          FilterService.fetchAttributesWithValues(sid),
        ]);

      const errors: FilterError[] = [];
      let categories: any[] = [];
      let brands: any[] = [];
      let attributes: any[] = [];

      if (categoriesResult.status === "fulfilled") {
        categories = categoriesResult.value.content || [];
      } else {
        errors.push({
          type: "categories",
          message: "Failed to fetch categories",
          originalError: categoriesResult.reason,
        });
      }

      if (brandsResult.status === "fulfilled") {
        brands = brandsResult.value.content || [];
      } else {
        errors.push({
          type: "brands",
          message: "Failed to fetch brands",
          originalError: brandsResult.reason,
        });
      }

      if (attributesResult.status === "fulfilled") {
        attributes = attributesResult.value;
      } else {
        errors.push({
          type: "attributes",
          message: "Failed to fetch attributes",
          originalError: attributesResult.reason,
        });
      }

      setFilterOptions({
        categories,
        brands,
        attributes,
        priceRange: { min: 0, max: 2000 },
      });
      setFilterErrors(errors);

      if (errors.length > 0) {
        console.warn("Some filter options failed to load:", errors);
      }
    } catch (error) {
      console.error("Error loading filter options:", error);
      setFilterErrors([
        {
          type: "general",
          message: "Failed to load filter options. Please try again.",
          originalError: error,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveDiscounts = async (sid?: string) => {
    setDiscountsLoading(true);
    setDiscountsError(null);
    try {
      const discounts = await discountService.getActiveDiscounts(sid);
      setActiveDiscounts(discounts);
    } catch (error) {
      console.error("Error loading active discounts:", error);
      setDiscountsError("Failed to load active discounts");
      setActiveDiscounts([]);
    } finally {
      setDiscountsLoading(false);
    }
  };

  // Search categories handler
  const handleCategorySearch = useCallback(
    async (searchTerm: string) => {
      setCategorySearch(searchTerm);

      if (categorySearchTimeoutRef.current) {
        clearTimeout(categorySearchTimeoutRef.current);
      }

      if (!searchTerm.trim()) {
        setSearchedCategories([]);
        return;
      }

      categorySearchTimeoutRef.current = setTimeout(async () => {
        setCategorySearchLoading(true);
        try {
          const result = await FilterService.fetchCategoriesWithSearch(
            searchTerm,
            0,
            10,
            shopId
          );
          setSearchedCategories(result.content || []);
        } catch (error) {
          console.error("Error searching categories:", error);
          setSearchedCategories([]);
        } finally {
          setCategorySearchLoading(false);
        }
      }, 300);
    },
    [shopId]
  );

  // Search brands handler
  const handleBrandSearch = useCallback(
    async (searchTerm: string) => {
      setBrandSearch(searchTerm);

      if (brandSearchTimeoutRef.current) {
        clearTimeout(brandSearchTimeoutRef.current);
      }

      if (!searchTerm.trim()) {
        setSearchedBrands([]);
        return;
      }

      brandSearchTimeoutRef.current = setTimeout(async () => {
        setBrandSearchLoading(true);
        try {
          const result = await FilterService.fetchBrandsWithSearch(
            searchTerm,
            0,
            10,
            shopId
          );
          setSearchedBrands(result.content || []);
        } catch (error) {
          console.error("Error searching brands:", error);
          setSearchedBrands([]);
        } finally {
          setBrandSearchLoading(false);
        }
      }, 300);
    },
    [shopId]
  );

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setFilterErrors([]);
    loadFilterOptions(shopId);
    loadActiveDiscounts(shopId);
  };

  // Fallback data for when backend fails
  const fallbackData = {
    categories: [],
    brands: [],
    attributes: [],
    priceRange: { min: 0, max: 2000 },
  };

  // Get current data (backend or fallback)
  const currentData = filterOptions || fallbackData;

  // Colors and sizes are now handled through backend attributes

  const updateFilters = useCallback(
    (key: string, value: any) => {
      onFiltersChange((prevFilters: any) => {
        // Ensure prevFilters is not undefined and has proper structure
        const safePrevFilters = prevFilters || {
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
        };
        return { ...safePrevFilters, [key]: value };
      });
    },
    [onFiltersChange]
  );

  const updatePriceRange = useCallback(
    (value: number[]) => {
      isUpdatingPriceRef.current = true;
      setLocalPriceRange(value);
      if (priceRangeTimeoutRef.current) {
        clearTimeout(priceRangeTimeoutRef.current);
      }
      priceRangeTimeoutRef.current = setTimeout(() => {
        updateFilters("priceRange", value);
        setTimeout(() => {
          isUpdatingPriceRef.current = false;
        }, 100);
      }, 300);
    },
    [updateFilters]
  );

  useEffect(() => {
    return () => {
      if (priceRangeTimeoutRef.current) {
        clearTimeout(priceRangeTimeoutRef.current);
      }
    };
  }, []);

  const toggleCategory = useCallback((categoryName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  }, []);

  const toggleSection = useCallback((sectionName: string) => {
    setCollapsedSections((prev) =>
      prev.includes(sectionName)
        ? prev.filter((s) => s !== sectionName)
        : [...prev, sectionName]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
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
  }, [onFiltersChange]);

  // Load attribute types on mount
  useEffect(() => {
    loadAttributeTypes(shopId);
  }, [shopId]);

  const loadAttributeTypes = async (sid?: string) => {
    setAttributeTypesLoading(true);
    try {
      const result = await FilterService.fetchAttributeTypes(0, 10, sid);
      setAttributeTypes(result.content || []);
    } catch (error) {
      console.error("Error loading attribute types:", error);
      setAttributeTypes([]);
    } finally {
      setAttributeTypesLoading(false);
    }
  };

  const handleAttributeTypeSearch = useCallback(
    async (searchTerm: string) => {
      setAttributeTypeSearch(searchTerm);

      if (attributeTypeSearchTimeoutRef.current) {
        clearTimeout(attributeTypeSearchTimeoutRef.current);
      }

      if (!searchTerm.trim()) {
        setSearchedAttributeTypes([]);
        setAttributeTypeSearchLoading(false);
        return;
      }

      attributeTypeSearchTimeoutRef.current = setTimeout(async () => {
        setAttributeTypeSearchLoading(true);
        try {
          const result = await FilterService.searchAttributeTypes(
            searchTerm,
            0,
            10,
            shopId
          );
          setSearchedAttributeTypes(result.content || []);
        } catch (error) {
          console.error("Error searching attribute types:", error);
          setSearchedAttributeTypes([]);
        } finally {
          setAttributeTypeSearchLoading(false);
        }
      }, 300);
    },
    [shopId]
  );

  // Toggle attribute type expansion and load values
  const toggleAttributeType = useCallback(
    async (attributeTypeId: number) => {
      setExpandedAttributeTypes((prev) => {
        const isExpanding = !prev.includes(attributeTypeId);

        if (isExpanding && !attributeValues[attributeTypeId]) {
          // Load attribute values for this type
          loadAttributeValues(attributeTypeId, shopId);
        }

        return isExpanding
          ? [...prev, attributeTypeId]
          : prev.filter((id) => id !== attributeTypeId);
      });
    },
    [attributeValues, shopId]
  );

  // Load attribute values for a specific type
  const loadAttributeValues = async (attributeTypeId: number, sid?: string) => {
    try {
      const result = await FilterService.fetchAttributeValuesByType(
        attributeTypeId,
        0,
        10,
        sid
      );
      setAttributeValues((prev) => ({
        ...prev,
        [attributeTypeId]: result.content || [],
      }));
    } catch (error) {
      console.error("Error loading attribute values:", error);
      setAttributeValues((prev) => ({
        ...prev,
        [attributeTypeId]: [],
      }));
    }
  };

  // Handle attribute value search within a type
  const handleAttributeValueSearch = useCallback(
    async (attributeTypeId: number, searchTerm: string) => {
      setAttributeValueSearch((prev) => ({
        ...prev,
        [attributeTypeId]: searchTerm,
      }));

      if (attributeValueSearchTimeoutRefs.current[attributeTypeId]) {
        clearTimeout(attributeValueSearchTimeoutRefs.current[attributeTypeId]!);
      }

      if (!searchTerm.trim()) {
        // Reload default values
        loadAttributeValues(attributeTypeId, shopId);
        return;
      }

      attributeValueSearchTimeoutRefs.current[attributeTypeId] = setTimeout(
        async () => {
          setAttributeValueSearchLoading((prev) => ({
            ...prev,
            [attributeTypeId]: true,
          }));
          try {
            const result = await FilterService.searchAttributeValuesByType(
              searchTerm,
              attributeTypeId,
              0,
              10,
              shopId
            );
            setAttributeValues((prev) => ({
              ...prev,
              [attributeTypeId]: result.content || [],
            }));
          } catch (error) {
            console.error("Error searching attribute values:", error);
            setAttributeValues((prev) => ({
              ...prev,
              [attributeTypeId]: [],
            }));
          } finally {
            setAttributeValueSearchLoading((prev) => ({
              ...prev,
              [attributeTypeId]: false,
            }));
          }
        },
        300
      );
    },
    []
  );

  const hasActiveFilters =
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 1000 ||
    filters.categories.length > 0 ||
    filters.brands?.length > 0 ||
    filters.selectedDiscounts?.length > 0 ||
    (filters.attributes && Object.keys(filters.attributes).length > 0) ||
    filters.rating !== null ||
    filters.inStock === false ||
    filters.isBestseller === true ||
    filters.isFeatured === true ||
    (filters.searchTerm && filters.searchTerm.trim() !== "");

  const renderCategory = (category: any, level: number = 0) => {
    const isExpanded = expandedCategories.includes(category.name);
    const hasSubcategories =
      category.subcategories && category.subcategories.length > 0;

    return (
      <div
        key={category.name || category.categoryId}
        style={{ marginLeft: `${level * 16}px` }}
      >
        <div className="flex items-center space-x-2 py-1">
          {hasSubcategories && (
            <button
              onClick={() => toggleCategory(category.name)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasSubcategories && <div className="w-5" />}
          <Checkbox
            id={`category-${category.categoryId || category.name}`}
            checked={filters.categories.includes(category.name)}
            onCheckedChange={(checked) => {
              const newCategories = checked
                ? [...filters.categories, category.name]
                : filters.categories.filter((c: string) => c !== category.name);
              updateFilters("categories", newCategories);
            }}
          />
          <label
            htmlFor={`category-${category.categoryId || category.name}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
          >
            {category.name}
          </label>
          <span className="text-xs text-gray-500">
            ({category.productCount || category.count || 0})
          </span>
        </div>

        {hasSubcategories && isExpanded && (
          <div className="mt-1">
            {category.subcategories.map((subcategory: any) =>
              renderCategory(subcategory, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFilterSection = (title: string, content: React.ReactNode) => {
    const isCollapsed = collapsedSections.includes(title);

    return (
      <Card className="border shadow-sm">
        <CardHeader
          className="py-3 cursor-pointer"
          onClick={() => toggleSection(title)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{title}</CardTitle>
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </CardHeader>
        {!isCollapsed && <CardContent>{content}</CardContent>}
      </Card>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-150px)] overflow-y-auto pr-2 space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-gray-600">Loading filters...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-150px)] overflow-y-auto pr-2 space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center justify-between sticky top-0 bg-white z-10 py-2">
        {!hideTitle && <h3 className="text-sm font-medium">Product Filters</h3>}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs h-8 px-2 py-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset All
          </Button>
        )}
      </div>

      {/* Error Messages */}
      {filterErrors.length > 0 && (
        <Card className="border border-red-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <CardTitle className="text-sm text-red-700">
                Filter Loading Issues
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filterErrors.map((error, index) => (
              <div
                key={index}
                className="text-sm text-red-600 bg-red-50 p-2 rounded"
              >
                <strong>{error.type}:</strong> {error.message}
              </div>
            ))}
            <Button
              onClick={handleRetry}
              size="sm"
              variant="outline"
              className="mt-2 w-full"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry Loading (
              {retryCount > 0 ? `Attempt ${retryCount + 1}` : "Retry"})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Filters */}
      {hasActiveFilters && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Active Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {filters.categories.map((category: string) => (
                <Badge
                  key={`cat-${category}`}
                  variant="secondary"
                  className="text-xs"
                >
                  {category}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() =>
                      updateFilters(
                        "categories",
                        filters.categories.filter((c: string) => c !== category)
                      )
                    }
                  />
                </Badge>
              ))}
              {filters.brands?.map((brand: string) => (
                <Badge
                  key={`brand-${brand}`}
                  variant="secondary"
                  className="text-xs"
                >
                  {brand}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() =>
                      updateFilters(
                        "brands",
                        (filters.brands || []).filter(
                          (b: string) => b !== brand
                        )
                      )
                    }
                  />
                </Badge>
              ))}
              {filters.attributes &&
                Object.entries(filters.attributes).map(([type, values]) =>
                  (values as string[]).map((value: string) => (
                    <Badge
                      key={`attr-${type}-${value}`}
                      variant="secondary"
                      className="text-xs"
                    >
                      {type}: {value}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => {
                          const currentAttributes = { ...filters.attributes };
                          const updatedValues = currentAttributes[type].filter(
                            (v: string) => v !== value
                          );
                          if (updatedValues.length === 0) {
                            delete currentAttributes[type];
                          } else {
                            currentAttributes[type] = updatedValues;
                          }
                          updateFilters("attributes", currentAttributes);
                        }}
                      />
                    </Badge>
                  ))
                )}
              {filters.selectedDiscounts?.map((discountId: string) => {
                const discount = activeDiscounts.find(
                  (d) => d.discountId === discountId
                );
                return (
                  <Badge
                    key={`discount-${discountId}`}
                    variant="secondary"
                    className="text-xs"
                  >
                    {discount?.name || discountId}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() =>
                        updateFilters(
                          "selectedDiscounts",
                          filters.selectedDiscounts.filter(
                            (d: string) => d !== discountId
                          )
                        )
                      }
                    />
                  </Badge>
                );
              })}
              {filters.inStock === false && (
                <Badge key="inStock" variant="secondary" className="text-xs">
                  Include Out of Stock
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => updateFilters("inStock", true)}
                  />
                </Badge>
              )}
              {filters.isBestseller && (
                <Badge
                  key="isBestseller"
                  variant="secondary"
                  className="text-xs"
                >
                  Bestseller
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => updateFilters("isBestseller", false)}
                  />
                </Badge>
              )}
              {filters.isFeatured && (
                <Badge key="isFeatured" variant="secondary" className="text-xs">
                  Featured
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => updateFilters("isFeatured", false)}
                  />
                </Badge>
              )}
              {filters.rating && (
                <Badge key="rating" variant="secondary" className="text-xs">
                  {filters.rating}+ Stars
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => updateFilters("rating", null)}
                  />
                </Badge>
              )}
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) && (
                <Badge key="price" variant="secondary" className="text-xs">
                  ${filters.priceRange[0]} - ${filters.priceRange[1]}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => updateFilters("priceRange", [0, 1000])}
                  />
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Range Filter */}
      {renderFilterSection(
        "Price Range",
        <div className="space-y-4">
          <Slider
            value={localPriceRange || [0, 1000]}
            onValueChange={updatePriceRange}
            max={1000}
            step={10}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${(localPriceRange || [0, 1000])[0]}</span>
            <span>
              ${(localPriceRange || [0, 1000])[1]}
              {(localPriceRange || [0, 1000])[1] === 1000 && "+"}
            </span>
          </div>
        </div>
      )}

      {/* Categories Filter */}
      {renderFilterSection(
        "Categories",
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => handleCategorySearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {categorySearchLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>

          {/* Categories List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categorySearch.trim() ? (
              // Show search results
              categorySearchLoading ? (
                <div className="text-center py-4 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Searching...</p>
                </div>
              ) : searchedCategories.length > 0 ? (
                searchedCategories.map((category) => renderCategory(category))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">
                    No categories found for "{categorySearch}"
                  </p>
                </div>
              )
            ) : // Show default categories
            currentData.categories.length > 0 ? (
              currentData.categories.map((category) => renderCategory(category))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No categories available</p>
                {filterErrors.some((e) => e.type === "categories") && (
                  <p className="text-xs mt-1">Failed to load categories</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Brands Filter */}
      {renderFilterSection(
        "Brands",
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search brands..."
              value={brandSearch}
              onChange={(e) => handleBrandSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {brandSearchLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>

          {/* Brands List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {brandSearch.trim() ? (
              // Show search results
              brandSearchLoading ? (
                <div className="text-center py-4 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Searching...</p>
                </div>
              ) : searchedBrands.length > 0 ? (
                searchedBrands.map((brand) => (
                  <div
                    key={brand.brandId}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`brand-${brand.brandId}`}
                      checked={
                        filters.brands?.includes(brand.brandName) || false
                      }
                      onCheckedChange={(checked) => {
                        const newBrands = checked
                          ? [...(filters.brands || []), brand.brandName]
                          : (filters.brands || []).filter(
                              (b: string) => b !== brand.brandName
                            );
                        updateFilters("brands", newBrands);
                      }}
                    />
                    <label
                      htmlFor={`brand-${brand.brandId}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                    >
                      {brand.brandName}
                    </label>
                    <span className="text-xs text-gray-500">
                      ({brand.productCount || 0})
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No brands found for "{brandSearch}"</p>
                </div>
              )
            ) : // Show default brands
            currentData.brands.length > 0 ? (
              currentData.brands.map((brand) => (
                <div
                  key={brand.brandId}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`brand-${brand.brandId}`}
                    checked={filters.brands?.includes(brand.brandName) || false}
                    onCheckedChange={(checked) => {
                      const newBrands = checked
                        ? [...(filters.brands || []), brand.brandName]
                        : (filters.brands || []).filter(
                            (b: string) => b !== brand.brandName
                          );
                      updateFilters("brands", newBrands);
                    }}
                  />
                  <label
                    htmlFor={`brand-${brand.brandId}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                  >
                    {brand.brandName}
                  </label>
                  <span className="text-xs text-gray-500">
                    ({brand.productCount || 0})
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No brands available</p>
                {filterErrors.some((e) => e.type === "brands") && (
                  <p className="text-xs mt-1">Failed to load brands</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Attributes Filter - New Implementation */}
      {renderFilterSection(
        "Product Attributes",
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search attributes..."
              value={attributeTypeSearch}
              onChange={(e) => handleAttributeTypeSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {attributeTypeSearchLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>

          {/* Attribute Types List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {attributeTypesLoading ? (
              <div className="text-center py-4 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading attributes...</p>
              </div>
            ) : attributeTypeSearch.trim() ? (
              // Show search results
              attributeTypeSearchLoading ? (
                <div className="text-center py-4 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Searching...</p>
                </div>
              ) : searchedAttributeTypes.length > 0 ? (
                searchedAttributeTypes.map((attrType) => (
                  <div
                    key={attrType.attributeTypeId}
                    className="border rounded-lg"
                  >
                    {/* Attribute Type Header */}
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        toggleAttributeType(attrType.attributeTypeId)
                      }
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        {expandedAttributeTypes.includes(
                          attrType.attributeTypeId
                        ) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm font-medium">
                          {attrType.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        ({attrType.productCount || 0})
                      </span>
                    </div>

                    {/* Attribute Values (Expanded) */}
                    {expandedAttributeTypes.includes(
                      attrType.attributeTypeId
                    ) && (
                      <div className="px-3 pb-3 space-y-2">
                        {/* Search bar for values */}
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search values..."
                            value={
                              attributeValueSearch[attrType.attributeTypeId] ||
                              ""
                            }
                            onChange={(e) =>
                              handleAttributeValueSearch(
                                attrType.attributeTypeId,
                                e.target.value
                              )
                            }
                            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {attributeValueSearchLoading[
                            attrType.attributeTypeId
                          ] && (
                            <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 animate-spin text-gray-400" />
                          )}
                        </div>

                        {/* Values list */}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {attributeValues[attrType.attributeTypeId]?.map(
                            (value) => (
                              <div
                                key={value.attributeValueId}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`attr-${value.attributeValueId}`}
                                  checked={
                                    filters.attributes?.[
                                      attrType.name
                                    ]?.includes(value.value) || false
                                  }
                                  onCheckedChange={(checked) => {
                                    const currentAttributes =
                                      filters.attributes || {};
                                    const currentTypeValues =
                                      currentAttributes[attrType.name] || [];
                                    const newTypeValues = checked
                                      ? [...currentTypeValues, value.value]
                                      : currentTypeValues.filter(
                                          (v: string) => v !== value.value
                                        );

                                    const newAttributes = {
                                      ...currentAttributes,
                                      [attrType.name]:
                                        newTypeValues.length > 0
                                          ? newTypeValues
                                          : undefined,
                                    };

                                    // Remove empty arrays
                                    Object.keys(newAttributes).forEach(
                                      (key) => {
                                        if (
                                          !newAttributes[key] ||
                                          newAttributes[key].length === 0
                                        ) {
                                          delete newAttributes[key];
                                        }
                                      }
                                    );

                                    updateFilters("attributes", newAttributes);
                                  }}
                                />
                                <label
                                  htmlFor={`attr-${value.attributeValueId}`}
                                  className="text-xs font-medium leading-none cursor-pointer flex-1"
                                >
                                  {value.value}
                                </label>
                                <span className="text-xs text-gray-500">
                                  ({value.productCount || 0})
                                </span>
                              </div>
                            )
                          )}
                          {!attributeValues[attrType.attributeTypeId] ||
                          attributeValues[attrType.attributeTypeId].length ===
                            0 ? (
                            <p className="text-xs text-gray-500 text-center py-2">
                              No values available
                            </p>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">
                    No attributes found for "{attributeTypeSearch}"
                  </p>
                </div>
              )
            ) : // Show default attribute types
            attributeTypes.length > 0 ? (
              attributeTypes.map((attrType) => (
                <div
                  key={attrType.attributeTypeId}
                  className="border rounded-lg"
                >
                  {/* Attribute Type Header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      toggleAttributeType(attrType.attributeTypeId)
                    }
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      {expandedAttributeTypes.includes(
                        attrType.attributeTypeId
                      ) ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="text-sm font-medium">
                        {attrType.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      ({attrType.productCount || 0})
                    </span>
                  </div>

                  {/* Attribute Values (Expanded) */}
                  {expandedAttributeTypes.includes(
                    attrType.attributeTypeId
                  ) && (
                    <div className="px-3 pb-3 space-y-2">
                      {/* Search bar for values */}
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search values..."
                          value={
                            attributeValueSearch[attrType.attributeTypeId] || ""
                          }
                          onChange={(e) =>
                            handleAttributeValueSearch(
                              attrType.attributeTypeId,
                              e.target.value
                            )
                          }
                          className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {attributeValueSearchLoading[
                          attrType.attributeTypeId
                        ] && (
                          <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 animate-spin text-gray-400" />
                        )}
                      </div>

                      {/* Values list */}
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {attributeValues[attrType.attributeTypeId]?.map(
                          (value) => (
                            <div
                              key={value.attributeValueId}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`attr-${value.attributeValueId}`}
                                checked={
                                  filters.attributes?.[attrType.name]?.includes(
                                    value.value
                                  ) || false
                                }
                                onCheckedChange={(checked) => {
                                  const currentAttributes =
                                    filters.attributes || {};
                                  const currentTypeValues =
                                    currentAttributes[attrType.name] || [];
                                  const newTypeValues = checked
                                    ? [...currentTypeValues, value.value]
                                    : currentTypeValues.filter(
                                        (v: string) => v !== value.value
                                      );

                                  const newAttributes = {
                                    ...currentAttributes,
                                    [attrType.name]:
                                      newTypeValues.length > 0
                                        ? newTypeValues
                                        : undefined,
                                  };

                                  // Remove empty arrays
                                  Object.keys(newAttributes).forEach((key) => {
                                    if (
                                      !newAttributes[key] ||
                                      newAttributes[key].length === 0
                                    ) {
                                      delete newAttributes[key];
                                    }
                                  });

                                  updateFilters("attributes", newAttributes);
                                }}
                              />
                              <label
                                htmlFor={`attr-${value.attributeValueId}`}
                                className="text-xs font-medium leading-none cursor-pointer flex-1"
                              >
                                {value.value}
                              </label>
                              <span className="text-xs text-gray-500">
                                ({value.productCount || 0})
                              </span>
                            </div>
                          )
                        )}
                        {!attributeValues[attrType.attributeTypeId] ||
                        attributeValues[attrType.attributeTypeId].length ===
                          0 ? (
                          <p className="text-xs text-gray-500 text-center py-2">
                            No values available
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No attributes available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Discounts Filter */}
      {activeDiscounts.length > 0 &&
        renderFilterSection(
          "Active Discounts",
          <div className="space-y-4">
            {discountsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="ml-2 text-sm text-gray-600">
                  Loading discounts...
                </span>
              </div>
            ) : discountsError ? (
              <div className="text-center py-4 text-red-500">
                <p className="text-sm">{discountsError}</p>
                <Button
                  onClick={() => loadActiveDiscounts(shopId)}
                  size="sm"
                  variant="outline"
                  className="mt-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            ) : (
              activeDiscounts.map((discount) => (
                <div
                  key={discount.discountId}
                  className="border rounded-md p-3 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`discount-${discount.discountId}`}
                      checked={
                        filters.selectedDiscounts?.includes(
                          discount.discountId
                        ) || false
                      }
                      onCheckedChange={(checked) => {
                        const newSelectedDiscounts = checked
                          ? [
                              ...(filters.selectedDiscounts || []),
                              discount.discountId,
                            ]
                          : (filters.selectedDiscounts || []).filter(
                              (d: string) => d !== discount.discountId
                            );
                        updateFilters(
                          "selectedDiscounts",
                          newSelectedDiscounts
                        );
                      }}
                    />
                    <label
                      htmlFor={`discount-${discount.discountId}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <PercentIcon className="h-3 w-3 text-red-500" />
                        <span className="font-semibold">{discount.name}</span>
                        <Badge variant="destructive" className="text-xs">
                          {discount.percentage}% OFF
                        </Badge>
                      </div>
                    </label>
                  </div>

                  {discount.description && (
                    <p className="text-xs text-gray-600 ml-6">
                      {discount.description}
                    </p>
                  )}

                  <div className="ml-6 space-y-2">
                    {/* Countdown Timer */}
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-3 w-3 text-red-500" />
                        <div className="text-center">
                          <p className="text-red-600 text-xs font-medium mb-1">
                            Ends in
                          </p>
                          <CountdownTimer
                            endDate={discount.endDate}
                            onExpired={() => {
                              console.log(`Discount ${discount.name} expired`);
                              // Optionally refresh discounts when one expires
                              loadActiveDiscounts(shopId);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Discount Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">Products:</span>{" "}
                        {discount.productCount}
                      </div>
                      <div>
                        <span className="font-medium">Code:</span>{" "}
                        {discount.discountCode}
                      </div>
                      <div>
                        <span className="font-medium">Used:</span>{" "}
                        {discount.usedCount}/{discount.usageLimit}
                      </div>
                      <div>
                        <span className="font-medium">Remaining:</span>{" "}
                        {discount.remainingCount}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      {/* Colors and Sizes are now handled through Product Attributes above */}

      {/* Rating Filter */}
      {renderFilterSection(
        "Customer Rating",
        <div className="space-y-3">
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={filters.rating === rating}
                onCheckedChange={(checked) => {
                  updateFilters("rating", checked ? rating : null);
                }}
              />
              <label
                htmlFor={`rating-${rating}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer flex items-center gap-1"
              >
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < rating
                          ? "fill-rating-star text-rating-star"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span>& up</span>
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Product Status Filters */}
      {renderFilterSection(
        "Product Status",
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inStock"
              checked={filters.inStock !== false}
              onCheckedChange={(checked) => updateFilters("inStock", checked)}
            />
            <label
              htmlFor="inStock"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              In Stock Only
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isBestseller"
              checked={filters.isBestseller || false}
              onCheckedChange={(checked) =>
                updateFilters("isBestseller", checked)
              }
            />
            <label
              htmlFor="isBestseller"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Bestseller
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFeatured"
              checked={filters.isFeatured || false}
              onCheckedChange={(checked) =>
                updateFilters("isFeatured", checked)
              }
            />
            <label
              htmlFor="isFeatured"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Featured
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
