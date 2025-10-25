/**
 * ItemType-related TypeScript interfaces
 */

export interface ItemTypeDto {
  id: number;
  name: string;
  description?: string;
  defaultItemType: boolean;
}

export interface ItemTypeDetailDto {
  id: number;
  name: string;
  description?: string;
  defaultItemType: boolean;
  itemTypeConfigurations: ItemTypeConfigurationViewDto[];
}

export interface ItemTypeConfigurationViewDto {
  id: number;
  itemType: ItemTypeDto;
  category: string;
  defaultItemTypeConfiguration: boolean;
  scope: string;
  workers: any[];
  workflow: any;
  fieldSet: any;
}

export interface ItemTypeCreateDto {
  name: string;
  description?: string;
}

export interface ItemTypeUpdateDto {
  name: string;
  description?: string;
}

