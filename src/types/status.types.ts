/**
 * Status-related TypeScript interfaces
 * Mapped from Java DTOs in backend/src/main/java/com/example/demo/dto
 */

import { WorkflowSimpleDto } from './workflow.types';

/**
 * Status view DTO (already in common.types but re-export here)
 */
export interface StatusDto {
  id: number;
  name: string;
  defaultStatus: boolean;
}

/**
 * Status detail DTO - includes workflows
 */
export interface StatusDetailDto {
  id: number;
  name: string;
  defaultStatus: boolean;
  workflows: WorkflowSimpleDto[];
}

/**
 * Status create DTO
 */
export interface StatusCreateDto {
  name: string;
}

/**
 * Status update DTO
 */
export interface StatusUpdateDto {
  name: string;
}

