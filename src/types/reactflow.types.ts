/**
 * ReactFlow-specific type extensions
 * Custom node and edge data types for the workflow editor
 */

import { Node, Edge } from 'reactflow';
import { StatusCategory } from './common.types';

/**
 * Data structure for custom workflow nodes
 */
export interface CustomNodeData {
  id?: number | null;
  label: string;
  statusId: number;
  category: StatusCategory;
  categories: StatusCategory[];
  isInitial: boolean;
  onCategoryChange: (newCategory: StatusCategory) => void;
  onRemove: () => void;
  onSetInitial: () => void;
}

/**
 * Extended Node type for workflow nodes
 */
export type WorkflowFlowNode = Node<CustomNodeData>;

/**
 * Data structure for custom workflow edges
 */
export interface CustomEdgeData {
  label: string;
  transitionId?: number | null;
  transitionTempId?: string | null;
}

/**
 * Extended Edge type for workflow edges
 */
export type WorkflowFlowEdge = Edge<CustomEdgeData>;

/**
 * Props for CustomNode component
 */
export interface CustomNodeProps {
  id: string;
  data: CustomNodeData;
  selected?: boolean;
  statusCategories: StatusCategory[];
}

/**
 * Props for SelectableEdge component
 */
export interface SelectableEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: string;
  targetPosition: string;
  style?: React.CSSProperties;
  markerEnd?: string;
  selected?: boolean;
  data?: CustomEdgeData;
  setEdges: React.Dispatch<React.SetStateAction<any[]>>;
  onDelete: (edgeId: string) => void;
  onEdgeUpdate?: (oldEdge: WorkflowFlowEdge, newConnection: any) => void;
}

/**
 * Props for CategoryPopover component
 */
export interface CategoryPopoverProps {
  value: StatusCategory;
  onChange: (newCategory: StatusCategory) => void;
  categories: StatusCategory[];
  small?: boolean;
  children?: React.ReactNode;
  onRemove?: (() => void) | null;
  isInitial?: boolean;
  onSetInitial?: (() => void) | null;
}

/**
 * Props for WorkflowControls component
 */
export interface WorkflowControlsProps {
  workflowName: string;
  setWorkflowName: (name: string) => void;
  selectedStatusId: string;
  setSelectedStatusId: (id: string) => void;
  availableStatuses: Array<{ id: number; name: string }>;
  nodes: WorkflowFlowNode[];
  statusCategories: StatusCategory[];
  addState: () => void;
}

