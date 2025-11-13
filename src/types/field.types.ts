/**
 * Field-related TypeScript interfaces
 * Mapped from Java DTOs in backend/src/main/java/com/example/demo/dto
 */

import { ScopeType } from './common.types';

/**
 * Field view DTO - basic field information
 * Maps to: FieldViewDto.java
 */
export interface FieldViewDto {
  id: number;
  name: string;
  defaultField: boolean;
}

/**
 * Field create DTO
 * Maps to: FieldCreateDto.java
 */
export interface FieldCreateDto {
  name: string;
}

/**
 * Field option view DTO
 * Maps to: FieldOptionViewDto.java
 */
export interface FieldOptionViewDto {
  id: number | string;
  value: string;
  label: string;
  enabled?: boolean;
  orderIndex?: number;
}

/**
 * Field option create/update DTO
 */
export interface FieldOptionDto {
  id?: string;
  label: string;
  value: string;
  enabled?: boolean;
  orderIndex?: number;
}

/**
 * Field set entry view DTO
 * Maps to: FieldSetEntryViewDto.java
 */
export interface FieldSetEntryViewDto {
  id: number | null;
  fieldConfiguration: FieldConfigurationDto;  // Backend returns full object
  orderIndex: number;
  // Legacy fields for backward compatibility
  fieldConfigurationId?: number;
  fieldConfigurationName?: string;
}

/**
 * Simple field set DTO (used in nested views)
 */
export interface SimpleFieldSetDto {
  id: number;
  name: string;
  scope: ScopeType;
}

/**
 * Simple ItemTypeSet DTO (used in nested views)
 */
export interface SimpleItemTypeSetDto {
  id: number;
  name: string;
}

/**
 * Field set view DTO
 * Maps to: FieldSetViewDto.java
 */
export interface FieldSetViewDto {
  id: number;
  name: string;
  description?: string;
  scope: ScopeType;
  defaultFieldSet: boolean;
  fieldSetEntries: FieldSetEntryViewDto[];
  usedInItemTypeSets?: SimpleItemTypeSetDto[]; // Opzionale: backend potrebbe non fornire questa informazione
}

/**
 * Field type descriptor
 */
export interface FieldTypeDescriptor {
  name: string;
  displayName: string;
  label?: string;
  hasOptions?: boolean;
  supportsOptions?: boolean;
}

/**
 * Field configuration DTO (simple)
 */
export interface FieldConfigurationDto {
  id: number;
  name: string;
  fieldId: number;
  fieldName: string;
  alias?: string;
}

/**
 * Field configuration view DTO (full)
 * Maps to: FieldConfigurationViewDto.java
 */
export interface FieldConfigurationViewDto {
  id: number;
  name: string;
  description?: string;
  fieldId: number;
  fieldName: string;
  alias?: string;
  defaultFieldConfiguration: boolean;
  fieldType: FieldTypeDescriptor;
  scope: ScopeType;
  options?: FieldOptionViewDto[];
  usedInFieldSets?: SimpleFieldSetDto[];
}

/**
 * Field detail DTO - includes related configurations and sets
 * Maps to: FieldDetailDto.java
 */
export interface FieldDetailDto {
  id: number;
  name: string;
  defaultField: boolean;
  fieldConfigurations: FieldConfigurationDto[];
  fieldSets: FieldSetViewDto[];
}

/**
 * Field option create DTO
 */
export interface FieldOptionCreateDto {
  label: string;
  value: string;
  orderIndex: number;
}

/**
 * Field configuration create DTO
 */
export interface FieldConfigurationCreateDto {
  name: string;
  alias?: string | null;
  fieldId: number | string | null;
  fieldType: string;
  description?: string;
  options?: FieldOptionCreateDto[];
}

/**
 * Field option update DTO
 */
export interface FieldOptionUpdateDto {
  id: number | null;
  label: string;
  value: string;
  enabled: boolean;
  orderIndex: number;
}

/**
 * Field configuration update DTO
 */
export interface FieldConfigurationUpdateDto {
  name: string;
  alias?: string;
  description?: string;
  fieldId?: number | null;
  fieldType: string;
  options?: FieldOptionUpdateDto[];
}

/**
 * Field types map (from API)
 */
export type FieldTypesMap = Record<string, FieldTypeDescriptor>;

/**
 * Field set create DTO
 */
export interface FieldSetCreateDto {
  name: string;
  description?: string;
  entries: Array<{
    fieldConfigurationId: number;
    orderIndex: number;
  }>;
}

/**
 * Field set entry create DTO
 */
export interface FieldSetEntryCreateDto {
  fieldConfigurationId: number;
  orderIndex: number;
}

/**
 * Field set create/update DTO (same DTO used for both operations)
 */
export interface FieldSetCreateDto {
  name: string;
  description?: string;
  entries: FieldSetEntryCreateDto[];
}

