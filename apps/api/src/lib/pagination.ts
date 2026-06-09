import type { PaginatedResponse, PaginationMeta, PaginationParams, SortParams } from "@trae/shared";
import { errorFactory } from "./errors";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;
export const MIN_PAGE = 1;

export function parsePagination(params: Record<string, unknown>): PaginationParams {
  const page = params.page != null ? parseInt(String(params.page), 10) : MIN_PAGE;
  const pageSize = params.pageSize != null ? parseInt(String(params.pageSize), 10) : DEFAULT_PAGE_SIZE;

  const validatedPage = Math.max(MIN_PAGE, page);
  const validatedPageSize = Math.min(Math.max(MIN_PAGE_SIZE, pageSize), MAX_PAGE_SIZE);

  return { page: validatedPage, pageSize: validatedPageSize };
}

export function parseSort(params: Record<string, unknown>): SortParams {
  const sortBy = params.sortBy != null ? String(params.sortBy) : undefined;
  const sortOrder = params.sortOrder != null ? String(params.sortOrder) : undefined;

  if (sortOrder && !["asc", "desc"].includes(sortOrder)) {
    throw errorFactory.validation.error("无效的排序方向，应为 'asc' 或 'desc'");
  }

  return {
    sortBy,
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : undefined
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages
    }
  };
}

export function paginateArray<T>(
  array: T[],
  page: number,
  pageSize: number
): { data: T[]; total: number } {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    data: array.slice(startIndex, endIndex),
    total: array.length
  };
}

export function sortArray<T>(
  array: T[],
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc"
): T[] {
  if (!sortBy) {
    return array;
  }

  const sorted = [...array].sort((a, b) => {
    const valueA = getNestedValue(a, sortBy);
    const valueB = getNestedValue(b, sortBy);

    if (valueA === null || valueA === undefined) return sortOrder === "asc" ? -1 : 1;
    if (valueB === null || valueB === undefined) return sortOrder === "asc" ? 1 : -1;

    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortOrder === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    }

    if (typeof valueA === "number" && typeof valueB === "number") {
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    }

    if (typeof valueA === "boolean" && typeof valueB === "boolean") {
      return sortOrder === "asc" ? (valueA ? 1 : -1) : (valueA ? -1 : 1);
    }

    if (valueA instanceof Date && valueB instanceof Date) {
      return sortOrder === "asc" ? valueA.getTime() - valueB.getTime() : valueB.getTime() - valueA.getTime();
    }

    return 0;
  });

  return sorted;
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function applyFilters<T>(
  array: T[],
  filters: Record<string, unknown>
): T[] {
  return array.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      const itemValue = getNestedValue(item, key);

      if (itemValue === undefined || itemValue === null) {
        return false;
      }

      if (typeof value === "string") {
        if (!String(itemValue).toLowerCase().includes(value.toLowerCase())) {
          return false;
        }
      } else if (Array.isArray(value)) {
        if (!value.includes(itemValue)) {
          return false;
        }
      } else {
        if (itemValue !== value) {
          return false;
        }
      }
    }
    return true;
  });
}

export interface QueryResult<T> {
  data: T[];
  total: number;
}

export function queryArray<T>(
  array: T[],
  options: {
    pagination?: PaginationParams;
    sort?: SortParams;
    filters?: Record<string, unknown>;
  } = {}
): QueryResult<T> {
  let result = [...array];

  if (options.filters) {
    result = applyFilters(result, options.filters);
  }

  const total = result.length;

  if (options.sort) {
    result = sortArray(result, options.sort.sortBy, options.sort.sortOrder);
  }

  const page = options.pagination?.page ?? MIN_PAGE;
  const pageSize = options.pagination?.pageSize ?? DEFAULT_PAGE_SIZE;

  const paginated = paginateArray(result, page, pageSize);

  return {
    data: paginated.data,
    total
  };
}

export function buildPaginationLinks(
  baseUrl: string,
  page: number,
  pageSize: number,
  totalPages: number
): {
  first: string;
  last: string;
  prev?: string;
  next?: string;
} {
  const buildUrl = (pageNum: number) => {
    const url = new URL(baseUrl, "http://localhost");
    url.searchParams.set("page", String(pageNum));
    url.searchParams.set("pageSize", String(pageSize));
    return url.toString().replace("http://localhost", "");
  };

  return {
    first: buildUrl(1),
    last: buildUrl(totalPages),
    prev: page > 1 ? buildUrl(page - 1) : undefined,
    next: page < totalPages ? buildUrl(page + 1) : undefined
  };
}
