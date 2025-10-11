/**
 * Project-related TypeScript interfaces
 */

export interface ProjectDto {
  id: number;
  key: string;
  name: string;
  description?: string;
  itemTypeSet?: any;
}

export interface ProjectCreateDto {
  key: string;
  name: string;
  description?: string;
}

export interface ProjectUpdateDto {
  key: string;
  name: string;
  description?: string;
}

