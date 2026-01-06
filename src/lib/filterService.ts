// Filter service for fetching filter options from backend
import { API_ENDPOINTS } from "./api";

// DTOs based on backend responses
export interface CategoryDTO {
  categoryId: number;
  name: string;
  description?: string;
  parentId?: number;
  subcategories?: CategoryDTO[];
  productCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDTO {
  brandId: string;
  brandName: string;
  description?: string;
  isActive: boolean;
  isFeatured: boolean;
  logoUrl?: string;
  websiteUrl?: string;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAttributeTypeDTO {
  attributeTypeId: number;
  name: string;
  isRequired: boolean;
  productCount?: number;
}

export interface ProductAttributeValueDTO {
  attributeValueId: number;
  value: string;
  attributeTypeId: number;
  attributeTypeName?: string;
  productCount?: number;
}

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface FilterOptions {
  categories: CategoryDTO[];
  brands: BrandDTO[];
  attributes: {
    type: ProductAttributeTypeDTO;
    values: ProductAttributeValueDTO[];
  }[];
  priceRange: {
    min: number;
    max: number;
  };
}

export interface FilterError {
  type: "categories" | "brands" | "attributes" | "general";
  message: string;
  originalError?: any;
}

/**
 * Service for fetching filter options from backend
 */
export const FilterService = {
  /**
   * Fetch all filter options in parallel
   */
  fetchAllFilterOptions: async (
    shopId?: string
  ): Promise<{
    data: FilterOptions | null;
    errors: FilterError[];
  }> => {
    const errors: FilterError[] = [];
    let categories: CategoryDTO[] = [];
    let brands: BrandDTO[] = [];
    let attributes: {
      type: ProductAttributeTypeDTO;
      values: ProductAttributeValueDTO[];
    }[] = [];

    // Fetch all data in parallel for better performance
    const results = await Promise.allSettled([
      FilterService.fetchHierarchicalCategories(shopId),
      FilterService.fetchActiveBrands(shopId),
      FilterService.fetchAttributesWithValues(shopId),
    ]);

    // Process categories result
    if (results[0].status === "fulfilled") {
      categories = results[0].value;
    } else {
      errors.push({
        type: "categories",
        message: "Failed to fetch categories",
        originalError: results[0].reason,
      });
    }

    // Process brands result
    if (results[1].status === "fulfilled") {
      brands = results[1].value;
    } else {
      errors.push({
        type: "brands",
        message: "Failed to fetch brands",
        originalError: results[1].reason,
      });
    }

    // Process attributes result
    if (results[2].status === "fulfilled") {
      attributes = results[2].value;
    } else {
      errors.push({
        type: "attributes",
        message: "Failed to fetch product attributes",
        originalError: results[2].reason,
      });
    }

    // Build filter options
    const filterOptions: FilterOptions = {
      categories,
      brands,
      attributes,
      priceRange: {
        min: 0,
        max: 2000, // Default max, could be dynamic based on products
      },
    };

    return {
      data: errors.length === 3 ? null : filterOptions, // Only return null if all failed
      errors,
    };
  },

  /**
   * Fetch hierarchical categories (top-level with subcategories)
   */
  fetchHierarchicalCategories: async (
    shopId?: string
  ): Promise<CategoryDTO[]> => {
    try {
      // First get top-level categories
      let url = `${API_ENDPOINTS.CATEGORIES}/top-level`;
      if (shopId) {
        url += `?shopId=${shopId}`;
      }

      const topLevelResponse = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!topLevelResponse.ok) {
        throw new Error(
          `Failed to fetch top-level categories: ${topLevelResponse.status}`
        );
      }

      const topLevelCategories: CategoryDTO[] = await topLevelResponse.json();

      // Fetch subcategories for each top-level category
      const categoriesWithSubcategories = await Promise.all(
        topLevelCategories.map(async (category) => {
          try {
            const subcategoriesResponse = await fetch(
              `${API_ENDPOINTS.CATEGORIES}/sub-categories/${category.categoryId}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (subcategoriesResponse.ok) {
              const subcategories: CategoryDTO[] =
                await subcategoriesResponse.json();
              return {
                ...category,
                subcategories,
              };
            } else {
              // If subcategories fail to load, just return the category without subcategories
              console.warn(
                `Failed to fetch subcategories for ${category.name}`
              );
              return category;
            }
          } catch (error) {
            console.warn(
              `Error fetching subcategories for ${category.name}:`,
              error
            );
            return category;
          }
        })
      );

      return categoriesWithSubcategories;
    } catch (error) {
      console.error("Error fetching hierarchical categories:", error);
      throw error;
    }
  },

  /**
   * Fetch active brands
   */
  fetchActiveBrands: async (shopId?: string): Promise<BrandDTO[]> => {
    try {
      let url = `${API_ENDPOINTS.BRANDS}/active`;
      if (shopId) {
        url += `?shopId=${shopId}`;
      }
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch active brands: ${response.status}`);
      }

      const brands: BrandDTO[] = await response.json();
      return brands;
    } catch (error) {
      console.error("Error fetching active brands:", error);
      throw error;
    }
  },

  /**
   * Fetch all attributes with their values
   */
  fetchAttributesWithValues: async (
    shopId?: string
  ): Promise<
    {
      type: ProductAttributeTypeDTO;
      values: ProductAttributeValueDTO[];
    }[]
  > => {
    try {
      // First get all attribute types
      let url = `${API_ENDPOINTS.ATTRIBUTE_TYPES}`;
      if (shopId) {
        url += `?shopId=${shopId}`;
      }
      const typesResponse = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!typesResponse.ok) {
        throw new Error(
          `Failed to fetch attribute types: ${typesResponse.status}`
        );
      }

      const attributeTypes: ProductAttributeTypeDTO[] =
        await typesResponse.json();

      // Fetch values for each attribute type
      const attributesWithValues = await Promise.all(
        attributeTypes.map(async (type) => {
          try {
            const valuesResponse = await fetch(
              `${API_ENDPOINTS.ATTRIBUTE_VALUES}/type/${type.attributeTypeId}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (valuesResponse.ok) {
              const values: ProductAttributeValueDTO[] =
                await valuesResponse.json();
              return {
                type,
                values,
              };
            } else {
              // If values fail to load, return type with empty values
              console.warn(
                `Failed to fetch values for attribute type ${type.name}`
              );
              return {
                type,
                values: [],
              };
            }
          } catch (error) {
            console.warn(
              `Error fetching values for attribute type ${type.name}:`,
              error
            );
            return {
              type,
              values: [],
            };
          }
        })
      );

      return attributesWithValues;
    } catch (error) {
      console.error("Error fetching attributes with values:", error);
      throw error;
    }
  },

  /**
   * Fetch categories with pagination
   */
  fetchCategories: async (page = 0, size = 50): Promise<Page<CategoryDTO>> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.CATEGORIES}?page=${page}&size=${size}&sortBy=name&sortDir=asc`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const categoriesPage: Page<CategoryDTO> = await response.json();
      return categoriesPage;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  /**
   * Fetch brands with pagination
   */
  fetchBrands: async (page = 0, size = 50): Promise<Page<BrandDTO>> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.BRANDS}?page=${page}&size=${size}&sortBy=brandName&sortDir=asc`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch brands: ${response.status}`);
      }

      const brandsPage: Page<BrandDTO> = await response.json();
      return brandsPage;
    } catch (error) {
      console.error("Error fetching brands:", error);
      throw error;
    }
  },

  /**
   * Search categories by name using POST with search DTO
   */
  fetchCategoriesWithSearch: async (
    searchTerm: string,
    page = 0,
    size = 10,
    shopId?: string
  ): Promise<Page<CategoryDTO>> => {
    try {
      const searchDTO = {
        name: searchTerm,
        page: page,
        size: size,
        sortBy: "name",
        sortDirection: "asc",
        shopId: shopId,
      };

      const response = await fetch(`${API_ENDPOINTS.CATEGORIES}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchDTO),
      });

      if (!response.ok) {
        throw new Error(`Failed to search categories: ${response.status}`);
      }

      const categoriesPage: Page<CategoryDTO> = await response.json();
      return categoriesPage;
    } catch (error) {
      console.error("Error searching categories:", error);
      throw error;
    }
  },

  /**
   * Search brands by name using POST with search DTO
   */
  fetchBrandsWithSearch: async (
    searchTerm: string,
    page = 0,
    size = 10,
    shopId?: string
  ): Promise<Page<BrandDTO>> => {
    try {
      const searchDTO = {
        brandName: searchTerm,
        page: page,
        size: size,
        sortBy: "brandName",
        sortDir: "asc",
        shopId: shopId,
      };

      const response = await fetch(`${API_ENDPOINTS.BRANDS}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchDTO),
      });

      if (!response.ok) {
        throw new Error(`Failed to search brands: ${response.status}`);
      }

      const brandsPage: Page<BrandDTO> = await response.json();
      return brandsPage;
    } catch (error) {
      console.error("Error searching brands:", error);
      throw error;
    }
  },

  /**
   * Fetch categories with product count sorted by product count
   */
  fetchCategoriesWithProductCount: async (
    page = 0,
    size = 10,
    shopId?: string
  ): Promise<Page<CategoryDTO>> => {
    try {
      const searchDTO = {
        isActive: true,
        page: page,
        size: size,
        sortBy: "name",
        sortDirection: "desc",
        sortByProductCount: true,
        shopId: shopId,
      };

      const response = await fetch(`${API_ENDPOINTS.CATEGORIES}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchDTO),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch categories with product count: ${response.status}`
        );
      }

      const categoriesPage: Page<CategoryDTO> = await response.json();
      return categoriesPage;
    } catch (error) {
      console.error("Error fetching categories with product count:", error);
      throw error;
    }
  },

  /**
   * Fetch brands with product count
   */
  fetchBrandsWithProductCount: async (
    page = 0,
    size = 10,
    shopId?: string
  ): Promise<Page<BrandDTO>> => {
    try {
      const searchDTO = {
        isActive: true,
        page: page,
        size: size,
        sortBy: "brandName",
        sortDir: "asc",
        shopId: shopId,
      };

      const response = await fetch(`${API_ENDPOINTS.BRANDS}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchDTO),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch brands with product count: ${response.status}`
        );
      }

      const brandsPage: Page<BrandDTO> = await response.json();
      return brandsPage;
    } catch (error) {
      console.error("Error fetching brands with product count:", error);
      throw error;
    }
  },

  /**
   * Fetch attribute types with pagination and product counts
   */
  fetchAttributeTypes: async (
    page = 0,
    size = 10,
    shopId?: string
  ): Promise<Page<ProductAttributeTypeDTO>> => {
    try {
      let url = `${API_ENDPOINTS.ATTRIBUTE_TYPES}?page=${page}&size=${size}&sort=name&direction=ASC`;
      if (shopId) {
        url += `&shopId=${shopId}`;
      }
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch attribute types: ${response.status}`);
      }

      const attributeTypesPage: Page<ProductAttributeTypeDTO> =
        await response.json();
      return attributeTypesPage;
    } catch (error) {
      console.error("Error fetching attribute types:", error);
      throw error;
    }
  },

  /**
   * Search attribute types by name with pagination
   */
  searchAttributeTypes: async (
    searchTerm: string,
    page = 0,
    size = 10,
    shopId?: string
  ): Promise<Page<ProductAttributeTypeDTO>> => {
    try {
      let url = `${
        API_ENDPOINTS.ATTRIBUTE_TYPES
      }/search?name=${encodeURIComponent(
        searchTerm
      )}&page=${page}&size=${size}&sort=name&direction=ASC`;
      if (shopId) {
        url += `&shopId=${shopId}`;
      }
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search attribute types: ${response.status}`);
      }

      const attributeTypesPage: Page<ProductAttributeTypeDTO> =
        await response.json();
      return attributeTypesPage;
    } catch (error) {
      console.error("Error searching attribute types:", error);
      throw error;
    }
  },

  /**
   * Fetch attribute values for a specific type with pagination
   */
  fetchAttributeValuesByType: async (
    attributeTypeId: number,
    page = 0,
    size = 10,
    shopId?: string
  ): Promise<Page<ProductAttributeValueDTO>> => {
    try {
      let url = `${API_ENDPOINTS.ATTRIBUTE_VALUES}/type/${attributeTypeId}?page=${page}&size=${size}&sort=value&direction=ASC`;
      if (shopId) {
        url += `&shopId=${shopId}`;
      }
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch attribute values: ${response.status}`);
      }

      const attributeValuesPage: Page<ProductAttributeValueDTO> =
        await response.json();
      return attributeValuesPage;
    } catch (error) {
      console.error("Error fetching attribute values:", error);
      throw error;
    }
  },

  /**
   * Search attribute values by value and type with pagination
   */
  searchAttributeValuesByType: async (
    searchTerm: string,
    attributeTypeId: number,
    page = 0,
    size = 10,
    shopId?: string
  ): Promise<Page<ProductAttributeValueDTO>> => {
    try {
      let url = `${
        API_ENDPOINTS.ATTRIBUTE_VALUES
      }/search/type/${attributeTypeId}?value=${encodeURIComponent(
        searchTerm
      )}&page=${page}&size=${size}&sort=value&direction=ASC`;
      if (shopId) {
        url += `&shopId=${shopId}`;
      }
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to search attribute values: ${response.status}`
        );
      }

      const attributeValuesPage: Page<ProductAttributeValueDTO> =
        await response.json();
      return attributeValuesPage;
    } catch (error) {
      console.error("Error searching attribute values:", error);
      throw error;
    }
  },
};

export default FilterService;
