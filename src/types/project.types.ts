/**
 * Project-related TypeScript interfaces
 */

import { ScopeType } from './common.types';

export interface ProjectDto {
  id: number;
  key: string;
  name: string;
  description?: string;
  isFavorite?: boolean;
  itemTypeSet?: {
    id: number;
    name: string;
    scope: ScopeType;
    defaultItemTypeSet: boolean;
    itemTypeConfigurations?: Array<{
      id: number;
      category: string;
      scope: ScopeType;
      itemType?: {
        id: number;
        name: string;
      };
    }>;
  };
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

