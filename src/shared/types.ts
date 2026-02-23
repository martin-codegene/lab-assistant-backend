// Shared types and interfaces for the application

export type UUID = string;

export interface BaseEntity {
  id: UUID;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pagination {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type ApiResponse<T> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: string; message?: string };

// Result type for use cases
export type Result<T = void> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: string; message?: string }
  | { success: true; message: string };

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}