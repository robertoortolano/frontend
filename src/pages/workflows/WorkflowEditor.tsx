/**
 * WorkflowEditor Component
 * 
 * Unified component that replaces both WorkflowCreate.tsx and WorkflowEdit.tsx
 * Uses the new useWorkflowEditor hook for centralized state management
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  MarkerType,
  NodeTypes,
  EdgeTypes,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowEditor } from '../../hooks/useWorkflowEditor';
import { WorkflowEditorControls } from './components/WorkflowEditorControls';
import { WorkflowImpactManager } from './components/WorkflowImpactManager';
import CustomNode from './components/CustomNode';
import SelectableEdge from './components/SelectableEdge';
import { getCategoryColor } from './components/workflowUtils';

import board from '../../styles/common/WorkflowBoard.module.css';

// Memoized node and edge types to prevent React Flow warnings
const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

// Create SelectableEdge wrapper with necessary props
function createSelectableEdgeWrapper(
  onDelete: (edgeId: string) => void,
  onUpdateLabel: (edgeId: string, label: string) => void,
  setEdges: React.Dispatch<React.SetStateAction<any[]>>
) {
  return function SelectableEdgeWrapper(props: any) {
    return <SelectableEdge {...props} onDelete={onDelete} onUpdateLabel={onUpdateLabel} setEdges={setEdges} />;
  };
}

export default function WorkflowEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const mode: 'create' | 'edit' = id ? 'edit' : 'create';
  const workflowId = id ? Number(id) : undefined;

  // All hooks must be called at the top level, before any conditional returns
  const [localEdges, setLocalEdges] = useState<any[]>([]);

  const workflowEditor = useWorkflowEditor({
    mode,
    workflowId,
    onSave: (workflow) => {
      console.log('Workflow saved:', workflow);
      navigate('/workflows');
    },
    onCancel: () => {
      navigate('/workflows');
    },
  });

  const { state, actions, reactFlowNodes, reactFlowEdges, onEdgesChange, onNodesChange, loading, error } = workflowEditor;

  // Update local edges when React Flow edges change
  // Only update if the edges have actually changed (by reference count)
  useEffect(() => {
    if (reactFlowEdges.length !== localEdges.length) {
      setLocalEdges(reactFlowEdges);
    }
  }, [reactFlowEdges.length]);

  // Create edge types with proper handlers - must be before conditional returns
  const handleDeleteEdge = useCallback((edgeId: string) => {
    // Call the remove edge action from the hook
    actions.removeEdge(edgeId);
  }, [actions]);

  const handleUpdateLabel = useCallback((edgeId: string, label: string) => {
    // Update the edge label in the unified state
    actions.updateEdge(edgeId, { transitionName: label });
  }, [actions]);

  const edgeTypesWithHandlers: EdgeTypes = useMemo(() => ({
    selectableEdge: createSelectableEdgeWrapper(handleDeleteEdge, handleUpdateLabel, setLocalEdges),
  }), [handleDeleteEdge, handleUpdateLabel]);

  // Handle node addition
  const handleAddNode = useCallback((statusId: number, position: { x: number; y: number }) => {
    console.log('handleAddNode in WorkflowEditor called, statusId:', statusId, 'actions:', actions);
    console.log('actions.addNode exists?', !!actions.addNode);
    if (actions.addNode) {
      actions.addNode(statusId, position);
    } else {
      console.error('actions.addNode is not defined!');
    }
  }, [actions]);

  // Handle edge connection
  const handleConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return;
    
    console.log('handleConnect called with:', params);
    
    // Check if edge already exists
    const existingEdge = state.edges.find(edge => 
      edge.sourceStatusId === Number(params.source) && 
      edge.targetStatusId === Number(params.target)
    );
    
    if (existingEdge) {
      console.warn('Edge already exists between these nodes');
      return;
    }

    // Add edge with source and target handles
    actions.addEdge(params.source, params.target, '', params.sourceHandle, params.targetHandle);
  }, [actions, state.edges]);

  // Handle impact report confirmation
  const handleConfirmRemoval = useCallback(async () => {
    try {
      // Get pending removal operations from state
      const nodeRemovals = state.pendingChanges.removedNodes.map(node => ({
        type: 'node' as const,
        id: String(node.statusId),
        data: node,
        impactReport: workflowEditor.impactReport,
        confirmed: false,
      }));

      const edgeRemovals = state.pendingChanges.removedEdges.map(edge => ({
        type: 'edge' as const,
        id: String(edge.transitionId || edge.transitionTempId),
        data: edge,
        impactReport: workflowEditor.impactReport,
        confirmed: false,
      }));

      await actions.confirmRemoval([...nodeRemovals, ...edgeRemovals]);
    } catch (err: any) {
      console.error('Error confirming removal:', err);
      // TODO: Show error message to user
    }
  }, [actions, state.pendingChanges, workflowEditor.impactReport]);

  // Handle impact report cancellation
  const handleCancelRemoval = useCallback(() => {
    actions.cancelRemoval();
  }, [actions]);

  // Handle CSV export
  const handleExportReport = useCallback(() => {
    if (!workflowEditor.impactReport) return;

    try {
      // Create CSV content
      const csvContent = generateCSVContent(workflowEditor.impactReport);
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workflow_impact_${workflowEditor.impactReport.type}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting report:', err);
      // TODO: Show error message to user
    }
  }, [workflowEditor.impactReport]);

  // Generate CSV content for impact report
  const generateCSVContent = (report: any) => {
    const headers = [
      'Workflow',
      'Tipo Rimozione',
      'Item Rimosso',
      'ItemTypeSet',
      'Progetto',
      'Permission Type',
      'Ruoli Assegnati',
      'Ha Assegnazioni'
    ];

    const rows = [headers.join(',')];

    report.permissions.forEach((permission: any) => {
      permission.items.forEach((item: any) => {
        const row = [
          report.workflowName,
          report.type,
          item.itemName,
          item.itemTypeSetName,
          item.projectName || 'N/A',
          permission.type,
          item.assignedRoles.join(';'),
          item.hasAssignments ? 'Sì' : 'No'
        ].map(field => `"${field}"`).join(',');
        
        rows.push(row);
      });
    });

    return rows.join('\n');
  };

  // Loading state
  if (loading) {
    return (
      <div className={board.wrapper}>
        <div className="loading-message">
          <h2>Caricamento workflow...</h2>
          <p>Attendere prego...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={board.wrapper}>
        <div className="error-message">
          <h2>Errore nel caricamento</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/workflows')}>
            Torna alla lista workflow
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={board.wrapper}>
      {/* Controls */}
      <WorkflowEditorControls
        mode={mode}
        workflowEditor={workflowEditor}
        availableStatuses={workflowEditor.availableStatuses}
        statusCategories={workflowEditor.statusCategories}
        onAddNode={handleAddNode}
      />

      {/* React Flow */}
      <div className="react-flow-container" style={{ height: '600px', width: '100%' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={reactFlowNodes}
            edges={localEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypesWithHandlers}
            fitView
            attributionPosition="bottom-left"
          >
            {/* Background removed to have a plain white background */}
            <Controls />
            <MiniMap />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Impact Report Modal */}
      <WorkflowImpactManager
        workflowEditor={workflowEditor}
        onConfirmRemoval={handleConfirmRemoval}
        onCancelRemoval={handleCancelRemoval}
        onExportReport={handleExportReport}
      />
    </div>
  );
}
