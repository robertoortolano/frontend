/**
 * ItemType-related TypeScript interfaces
 */

export interface ItemTypeDto {
  id: number;
  name: string;
  description?: string;
  defaultItemType: boolean;
}

export interface ItemTypeCreateDto {
  name: string;
  description?: string;
}

export interface ItemTypeUpdateDto {
  name: string;
  description?: string;
}

