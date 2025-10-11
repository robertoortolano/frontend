/**
 * Role-related TypeScript interfaces
 */

import { ScopeType } from './common.types';

export interface RoleDto {
  id: number;
  name: string;
  description?: string;
  scope: ScopeType;
  defaultRole: boolean;
}

export interface RoleCreateDto {
  name: string;
  description?: string;
}

export interface RoleUpdateDto {
  name: string;
  description?: string;
}

