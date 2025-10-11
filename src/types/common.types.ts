/**
 * Common types used across the application
 * These mirror the backend enums and common DTOs
 */

export type ScopeType = 'TENANT' | 'PROJECT';

export type StatusCategory = 'BACKLOG' | 'PROGRESS' | 'COMPLETED' | 'TODO';

/**
 * Base Status DTO
 */
export interface StatusViewDto {
  id: number;
  name: string;
  defaultStatus: boolean;
}

/**
 * Role information
 */
export interface Role {
  id: number;
  name: string;
  scope?: ScopeType;
}

