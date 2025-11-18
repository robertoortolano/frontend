/**
 * Workflow-related TypeScript interfaces
 * Mapped from Java DTOs in backend/src/main/java/com/example/demo/dto
 */

import { StatusCategory, ScopeType } from './common.types';

/**
 * Base Status DTO (re-exported for convenience)
 */
export interface StatusViewDto {
  id: number;
  name: string;
  defaultStatus: boolean;
}

/**
 * WorkflowNode metadata - positional data for visual editor
 * Maps to: WorkflowNodeDto.java
 */
export interface WorkflowNodeDto {
  id: number | null;
  statusId: number;
  positionX: number;
  positionY: number;
}

/**
 * WorkflowEdge metadata - connection data for visual editor
 * Maps to: WorkflowEdgeDto.java
 */
export interface WorkflowEdgeDto {
  id: number | null;
  transitionId: number | null;
  transitionTempId?: string | null;
  sourceId: number;
  targetId: number;
  sourcePosition: string | null;
  targetPosition: string | null;
}

/**
 * Transition view - simple transition representation
 * Maps to: TransitionViewDto.java
 */
export interface TransitionViewDto {
  id: number;
  name: string;
}

/**
 * Transition create DTO
 */
export interface TransitionCreateDto {
  tempId?: string | null;
  name: string;
  fromStatusId: number;
  toStatusId: number;
}

/**
 * Transition update DTO
 */
export interface TransitionUpdateDto {
  id?: number | null;
  tempId?: string | null;
  name: string;
  fromStatusId: number;
  toStatusId: number;
}

/**
 * WorkflowStatus view - represents a status within a workflow
 * Maps to: WorkflowStatusViewDto.java
 */
export interface WorkflowStatusViewDto {
  id: number;
  workflowId: number;
  workflowName: string;
  status: StatusViewDto;
  initial: boolean;
  statusCategory: StatusCategory;
  outgoingTransitions?: TransitionViewDto[];
}

/**
 * WorkflowStatus create DTO
 * Maps to: WorkflowStatusCreateDto.java
 */
export interface WorkflowStatusCreateDto {
  statusId: number;
  statusCategory: StatusCategory;
  isInitial: boolean;
  outgoingTransitions?: TransitionCreateDto[];
}

/**
 * WorkflowStatus update DTO
 * Maps to: WorkflowStatusUpdateDto.java
 */
export interface WorkflowStatusUpdateDto {
  id: number | null;
  statusId: number;
  isInitial: boolean;
  statusCategory: StatusCategory;
  outgoingTransitions?: TransitionUpdateDto[];
}

/**
 * Workflow view - full workflow representation
 * Maps to: WorkflowViewDto.java
 */
export interface WorkflowViewDto {
  id: number;
  name: string;
  initialStatus: StatusViewDto | null;
  initialStatusId?: number | null;
  scope: 'TENANT' | 'PROJECT';
  defaultWorkflow: boolean;
  statuses: WorkflowStatusViewDto[];
  workflowNodes?: WorkflowNodeDto[];
  workflowEdges?: WorkflowEdgeDto[];
  transitions?: TransitionViewDto[];
}

/**
 * Workflow create DTO
 * Maps to: WorkflowCreateDto.java
 */
export interface WorkflowCreateDto {
  name: string;
  initialStatusId: number | null;
  workflowStatuses: WorkflowStatusCreateDto[];
  workflowNodes: WorkflowNodeDto[];
  transitions: TransitionCreateDto[];
  workflowEdges: WorkflowEdgeDto[];
}

/**
 * Workflow update DTO
 * Maps to: WorkflowUpdateDto.java
 */
export interface WorkflowUpdateDto {
  id: number;
  name: string;
  initialStatusId: number | null;
  workflowStatuses: WorkflowStatusUpdateDto[];
  workflowNodes: WorkflowNodeDto[];
  transitions: TransitionUpdateDto[];
  workflowEdges: WorkflowEdgeDto[];
}

/**
 * Simple workflow DTO for list views
 */
export interface WorkflowSimpleDto {
  id: number;
  name: string;
  defaultWorkflow: boolean;
  scope: ScopeType;
  projectName?: string; // Nome del progetto quando scope è PROJECT
  projects?: Array<{ id: number; projectKey: string; name: string; description?: string }>; // Progetti a cui è applicato tramite ITS
}

/**
 * Workflow detail DTO with usage information
 */
export interface WorkflowDetailDto {
  id: number;
  name: string;
  defaultWorkflow: boolean;
  usedInItemTypeConfigurations: ItemTypeConfigurationViewDto[];
}

/**
 * ItemTypeConfiguration DTO for workflow usage
 */
export interface ItemTypeConfigurationViewDto {
  id: number;
  itemType: any;
  category: string;
  defaultItemTypeConfiguration: boolean;
  scope: string;
  workers: any[];
  workflow: any;
  fieldSet: any;
}

