/**
 * ItemTypeSet-related TypeScript interfaces
 */

import { ItemTypeDto } from './itemtype.types';
import { FieldSetViewDto } from './field.types';
import { WorkflowSimpleDto } from './workflow.types';
import { ScopeType } from './common.types';

export interface ItemTypeConfigurationDto {
  id?: number;
  itemTypeId: number;
  itemType?: ItemTypeDto;
  category: string;
  fieldSetId?: number | null;
  fieldSet?: FieldSetViewDto | null;
  workflowId?: number | null;
  workflow?: WorkflowSimpleDto | null;
}

export interface ItemTypeSetDto {
  id: number;
  name: string;
  description?: string;
  scope: ScopeType;
  defaultItemTypeSet: boolean;
  itemTypeConfigurations: ItemTypeConfigurationDto[];
  projectsAssociation?: Array<{ id: number; name: string; projectKey: string }>; // Progetti che usano questo ItemTypeSet
}

export interface ItemTypeSetCreateDto {
  name: string;
  description?: string;
  itemTypeConfigurations: Array<{
    itemTypeId: number;
    category: string;
    fieldSetId?: number | null;
    workflowId?: number | null;
  }>;
}

export interface ItemTypeSetUpdateDto {
  name: string;
  description?: string;
  itemTypeConfigurations: Array<{
    id?: number;
    itemTypeId: number;
    category: string;
    fieldSetId?: number | null;
    workflowId?: number | null;
  }>;
}

