/**
 * Workflow utilities - pure functions for workflow manipulation
 */

import { StatusCategory } from '../../../types/common.types';
import { WorkflowStatusUpdateDto } from '../../../types/workflow.types';
import { WorkflowFlowNode, WorkflowFlowEdge } from '../../../types/reactflow.types';

/**
 * Get color for a given status category
 */
export const getCategoryColor = (cat: StatusCategory): string => {
  switch (cat) {
    case "TODO":
      return "rgba(108, 117, 125, 0.5)";
    case "PROGRESS":
      return "rgba(13, 110, 253, 0.5)";
    case "COMPLETED":
      return "rgba(25, 135, 84, 0.5)";
    default:
      return "rgba(108, 117, 125, 0.3)";
  }
};

/**
 * Build WorkflowStatus DTOs from ReactFlow nodes and edges
 * This constructs the DTO structure needed by the backend
 */
export function buildWorkflowStatusesFromFlow(
  nodes: WorkflowFlowNode[],
  edges: WorkflowFlowEdge[]
): WorkflowStatusUpdateDto[] {
  return nodes.map((node) => {
    // Find all outgoing transitions: edges that start from this node
    const outgoingTransitions = edges
      .filter((e) => e.source === node.id)
      .map((e) => ({
        id: e.data?.transitionId ?? null,
        tempId: e.data?.transitionTempId ?? null,
        name: e.data?.label || "",
        fromStatusId: Number.parseInt(e.source),
        toStatusId: Number.parseInt(e.target),
      }));

    return {
      id: node.data.id ?? null,
      statusId: node.data.statusId,
      isInitial: node.data.isInitial,
      statusCategory: node.data.category,
      outgoingTransitions,
    };
  });
}

