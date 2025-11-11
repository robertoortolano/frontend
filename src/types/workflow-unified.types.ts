/**
 * Unified Workflow Types - Refactored Version
 * 
 * This file contains unified types that solve the inconsistencies
 * between WorkflowNodeDto and WorkflowStatusViewDto
 */

import type { Edge, Node } from 'reactflow';
import { StatusCategory } from './common.types';
import { StatusViewDto } from './workflow.types';
import { StatusRemovalImpactDto } from './status-impact.types';
import { TransitionRemovalImpactDto } from './transition-impact.types';

/**
 * Unified Node Data - Combines WorkflowNodeDto + WorkflowStatusViewDto
 * This eliminates the need for complex matching logic
 */
export interface WorkflowNodeData {
  // From WorkflowNodeDto
  nodeId: number | null;           // WorkflowNode.id (can be null for new nodes)
  statusId: number;                // Status.id (always present)
  positionX: number;
  positionY: number;
  
  // From WorkflowStatusViewDto
  workflowStatusId: number;        // WorkflowStatus.id (always present for existing nodes)
  workflowId: number;
  workflowName: string;
  statusName: string;
  statusCategory: StatusCategory;
  isInitial: boolean;
  
  // Computed fields
  isNew: boolean;                   // true if nodeId is null
  isExisting: boolean;              // true if workflowStatusId is present
}

/**
 * Unified Edge Data - Simplified edge representation
 */
export interface WorkflowEdgeData {
  edgeId: number | null;           // WorkflowEdge.id (can be null for new edges)
  transitionId: number | null;      // Transition.id (can be null for temp edges)
  transitionTempId?: string | null; // Temporary ID for new transitions
  sourceStatusId: number;           // Status.id of source node
  targetStatusId: number;           // Status.id of target node
  sourcePosition: string | null;
  targetPosition: string | null;
  transitionName: string;
  
  // Computed fields
  isNew: boolean;                   // true if edgeId is null
  isTransitionNew: boolean;        // true if transitionId is null
}

/**
 * Unified Workflow State - Single source of truth
 */
export interface WorkflowState {
  // Core workflow data
  workflow: {
    id: number;
    name: string;
    initialStatusId: number | null;
    scope: 'TENANT' | 'PROJECT';
    defaultWorkflow: boolean;
  } | null;
  
  // Visual representation
  nodes: WorkflowNodeData[];
  edges: WorkflowEdgeData[];
  
  // UI state
  ui: {
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    showImpactReport: boolean;
    impactReportType: 'status' | 'transition' | 'fieldset' | null;
    analyzingImpact: boolean;
    saving: boolean;
    pendingSave: boolean; // True when waiting for summary report confirmation before saving
  };
  
  // Pending changes
  pendingChanges: {
    removedNodes: WorkflowNodeData[];
    removedEdges: WorkflowEdgeData[];
    addedNodes: WorkflowNodeData[];
    addedEdges: WorkflowEdgeData[];
    modifiedNodes: WorkflowNodeData[];
    modifiedEdges: WorkflowEdgeData[];
  };
}

/**
 * Impact Report Data - Unified for all types
 */
export interface ImpactReportData {
  type: 'status' | 'transition' | 'fieldset';
  workflowId: number;
  workflowName: string;
  removedItems: {
    ids: number[];
    names: string[];
  };
  affectedItemTypeSets: {
    id: number;
    name: string;
    projectName: string | null;
  }[];
  permissions: {
    type: 'statusOwner' | 'executor' | 'fieldOwner';
    items: {
      itemTypeSetId: number;
      itemTypeSetName: string;
      itemName: string;
      itemCategory: string;
      assignedRoles: string[];
      hasAssignments: boolean;
    }[];
  }[];
  totals: {
    affectedItemTypeSets: number;
    totalPermissions: number;
    totalRoleAssignments: number;
  };
}

/**
 * Removal Operation - Unified removal handling
 */
export interface RemovalOperation {
  type: 'node' | 'edge';
  id: string;                      // React Flow ID
  data: WorkflowNodeData | WorkflowEdgeData;
  impactReport: ImpactReportData | null;
  confirmed: boolean;
}

/**
 * Workflow Editor Actions
 */
export interface WorkflowEditorActions {
  // Node operations
  addNode: (statusId: number, position: { x: number; y: number }) => void;
  removeNode: (nodeId: string) => Promise<void>;
  updateNode: (nodeId: string, updates: Partial<WorkflowNodeData>) => void;
  
  // Edge operations
  addEdge: (sourceId: string, targetId: string, transitionName?: string, sourceHandle?: string, targetHandle?: string) => void;
  removeEdge: (edgeId: string) => Promise<void>;
  updateEdge: (edgeId: string, updates: Partial<WorkflowEdgeData>) => void;
  updateEdgeConnection: (oldEdge: any, newConnection: any) => void;
  
  // Workflow operations
  updateWorkflowName: (name: string) => void;
  saveWorkflow: () => Promise<void>;
  cancelChanges: () => void;
  
  // Impact operations
  analyzeImpact: (operations: RemovalOperation[]) => Promise<ImpactReportData>;
  confirmRemoval: (operations: RemovalOperation[]) => Promise<void>;
  cancelRemoval: () => void;
}

export type WorkflowReactFlowNodeData = WorkflowNodeData & {
  label: string;
  category: StatusCategory;
  onCategoryChange: (newCategory: StatusCategory) => void;
  onRemove: () => void;
  onSetInitial: () => void;
  categories: StatusCategory[];
};

export type WorkflowReactFlowEdgeData = WorkflowEdgeData & {
  label?: string;
  onDelete: () => void;
  onUpdateLabel?: (label: string) => void;
};

export type ReactFlowNode = Node<WorkflowReactFlowNodeData>;
export type ReactFlowEdge = Edge<WorkflowReactFlowEdgeData>;

/**
 * Workflow Editor Props
 */
export interface WorkflowEditorProps {
  mode: 'create' | 'edit';
  workflowId?: number;
  onSave?: (workflow: WorkflowState['workflow']) => void;
  onCancel?: () => void;
}

/**
 * Workflow Editor Hook Return
 */
export interface UseWorkflowEditorReturn {
  // State
  state: WorkflowState;
  
  // Actions
  actions: WorkflowEditorActions;
  
  // React Flow data
  reactFlowNodes: ReactFlowNode[];
  reactFlowEdges: ReactFlowEdge[];
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Impact report
  impactReport: ImpactReportData | null;
  enhancedImpactDto: StatusRemovalImpactDto | TransitionRemovalImpactDto | null;
  showImpactReport: boolean;
  
  // Additional data
  availableStatuses: StatusViewDto[];
  statusCategories: StatusCategory[];
  
  // React Flow handlers
  onNodesChange: any;
  onEdgesChange: any;
}
