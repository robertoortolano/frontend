/**
 * Workflow Node Utilities
 * 
 * Centralized utilities for working with workflow nodes
 */

/**
 * Gets statusId from a node by nodeId
 */
export function getStatusIdFromNode(nodes: any[], nodeId: string): number | null {
    const node = nodes.find((n: any) => n.id === nodeId);
    return node?.data?.statusId || null;
}

/**
 * Gets statusId from a node by nodeId, with fallback to parsing nodeId as number
 */
export function getStatusIdFromNodeWithFallback(nodes: any[], nodeId: string): number {
    const statusId = getStatusIdFromNode(nodes, nodeId);
    if (statusId !== null) {
        return statusId;
    }
    // Fallback: try to parse nodeId as number
    return Number.parseInt(nodeId);
}

/**
 * Gets node by nodeId
 */
export function getNodeById(nodes: any[], nodeId: string): any | null {
    return nodes.find((n: any) => n.id === nodeId) || null;
}

