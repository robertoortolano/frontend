// workflowUtils.js
export const getCategoryColor = (cat) => {
  switch (cat) {
    case "TODO": return "rgba(108, 117, 125, 0.5)";
    case "PROGRESS": return "rgba(13, 110, 253, 0.5)";
    case "COMPLETED": return "rgba(25, 135, 84, 0.5)";
    default: return "rgba(108, 117, 125, 0.3)";
  }
};

// Costruisce DTO aggiornato per il backend
export function buildWorkflowStatusesFromFlow(nodes, edges) {
  return nodes.map((node) => {
    // Consideriamo solo le outgoing transitions: ogni edge parte da questo nodo
    const outgoingTransitions = edges
      .filter((e) => e.source === node.id)
      .map((e) => ({
        id: e.data?.transitionId ?? null,   // null se nuova transizione
        name: e.data?.label || "",
        toStatusId: parseInt(e.target),     // id del nodo di destinazione
        sourcePosition: e.sourceHandle || null,
        targetPosition: e.targetHandle || null,
      }));

    return {
      id: node.data.id ?? null,             // id del WorkflowStatus se esiste, null se nuovo
      statusId: node.data.statusId,
      isInitial: node.data.isInitial,      // ora incluso nel DTO
      statusCategory: node.data.category,
      outgoingTransitions,
    };
  });
}

// Funzione per costruire i nodi con id e isInitial
export function buildNodes(onCategoryChange, onRemoveNode, setInitialNode, wfNodes = [], wfStatuses = [], categories = [], wf = {}) {
  return wfNodes.map((meta) => {
    const ws = wf.statuses?.find(s => s.status.id === meta.statusId);
    const label = ws?.status?.name ?? `Nodo ${meta.statusId}`;
    const category = ws?.statusCategory ?? (categories[0] ?? "Default");
    const isInitial = ws?.isInitial ?? (meta.statusId === wf.initialStatus?.id);

    return {
      id: String(meta.statusId),
      data: {
        id: ws?.id ?? null,       // id del WorkflowStatus se già esistente
        label,
        statusId: meta.statusId,
        category,
        isInitial,
        onCategoryChange: (newCat) => onCategoryChange(meta.statusId, newCat),
        categories,
        onRemove: () => onRemoveNode(meta.statusId),
        onSetInitial: () => setInitialNode(meta.statusId),
      },
      position: { x: meta.positionX ?? 100, y: meta.positionY ?? 100 },
      type: "customNode",
      style: {
        background: getCategoryColor(category),
        borderRadius: 8,
        opacity: 0.9,
      },
    };
  });
}
