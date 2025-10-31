/**
 * WorkflowEditor Component
 * 
 * Unified component that replaces both WorkflowCreate.tsx and WorkflowEdit.tsx
 * Uses the new useWorkflowEditor hook for centralized state management
 */

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
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

interface WorkflowEditorProps {
  scope?: 'tenant' | 'project';
  projectId?: string;
}

export default function WorkflowEditor({ scope = 'tenant', projectId }: WorkflowEditorProps = {}) {
  const { id, projectId: projectIdFromParams } = useParams<{ id: string; projectId?: string }>();
  const navigate = useNavigate();
  
  // Use projectId from props if provided, otherwise from URL params
  const finalProjectId = projectId || projectIdFromParams;
  const finalScope = scope || (finalProjectId ? 'project' : 'tenant');
  
  const mode: 'create' | 'edit' = id ? 'edit' : 'create';
  const workflowId = id ? Number(id) : undefined;

  // All hooks must be called at the top level, before any conditional returns
  const [localEdges, setLocalEdges] = useState<any[]>([]);
  
  // Track which edges were just updated via onEdgeUpdate to prevent onEdgesChange from reverting them
  const recentlyUpdatedEdgesRef = useRef<Set<string>>(new Set());

  const workflowEditor = useWorkflowEditor({
    mode,
    workflowId,
    scope: finalScope,
    projectId: finalProjectId,
    onSave: (workflow) => {
      if (finalScope === 'tenant') {
        navigate('/tenant/workflows');
      } else if (finalScope === 'project' && finalProjectId) {
        navigate(`/projects/${finalProjectId}/workflows`);
      }
    },
    onCancel: () => {
      if (finalScope === 'tenant') {
        navigate('/tenant/workflows');
      } else if (finalScope === 'project' && finalProjectId) {
        navigate(`/projects/${finalProjectId}/workflows`);
      }
    },
  });

  const { state, actions, reactFlowNodes, reactFlowEdges, onEdgesChange, onNodesChange, loading, error } = workflowEditor;

  // Keep localEdges in sync with reactFlowEdges for SelectableEdge component
  // Preserve labels from localEdges when syncing to avoid losing unsaved changes
  useEffect(() => {
    setLocalEdges(prev => {
      // Merge reactFlowEdges with localEdges, preserving labels from localEdges
      // This ensures we don't lose labels that have been typed but not yet saved
      return reactFlowEdges.map(reactEdge => {
        const localEdge = prev.find(e => e.id === reactEdge.id);
        // If we have a local edge with a different label, preserve the local label
        // (it means it's been typed but not yet fully synced)
        if (localEdge && localEdge.data?.label && localEdge.data.label !== reactEdge.data?.label) {
          // Check if the local label is newer (was just typed)
          // Only preserve if it's different and not empty
          return {
            ...reactEdge,
            data: {
              ...reactEdge.data,
              label: localEdge.data.label,
            },
          };
        }
        return reactEdge;
      });
    });
  }, [reactFlowEdges]);

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
    if (actions.addNode) {
      actions.addNode(statusId, position);
    }
  }, [actions]);

  // Handle edge connection
  const handleConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return;
    
    // Check if edge already exists in unified state
    const existingEdge = state.edges.find(edge => 
      edge.sourceStatusId === Number(params.source) && 
      edge.targetStatusId === Number(params.target)
    );
    
    if (existingEdge) {
      return;
    }
    
    // Check if edge already exists in localEdges
    const existingLocalEdge = localEdges.find(edge => 
      edge.source === params.source && 
      edge.target === params.target
    );
    
    if (existingLocalEdge) {
      console.warn('Edge already exists in localEdges');
      return;
    }

    // Generate tempId that will match the one created by addEdge
    // Note: addEdge uses Date.now(), so we'll generate a matching one
    const tempId = `temp-${Date.now()}`;
    
    // CRITICAL: Add edge to localEdges FIRST before adding to unified state
    // This ensures React Flow sees the new edge immediately and doesn't lose the connection
    const newLocalEdge = {
      id: tempId,
      type: 'selectableEdge',
      source: params.source!,
      target: params.target!,
      sourceHandle: params.sourceHandle || undefined,
      targetHandle: params.targetHandle || undefined,
      updatable: true,
      data: {
        transitionId: null,
        transitionTempId: tempId,
        label: '',
        onDelete: () => handleDeleteEdge(tempId),
        onUpdateLabel: (label: string) => handleUpdateLabel(tempId, label),
      },
      style: {
        stroke: '#2196f3',
        strokeWidth: 2,
      },
      markerEnd: {
        type: 'arrowclosed',
        color: '#2196f3',
      },
    };
    
    setLocalEdges(prev => [...prev, newLocalEdge]);
    
    // Then add edge to unified state (this will update reactFlowEdges)
    // The useEffect will sync, but we already have it in localEdges so React Flow sees it immediately
    actions.addEdge(params.source, params.target, '', params.sourceHandle, params.targetHandle);
  }, [actions, state.edges, localEdges, reactFlowEdges]);

  // Handle edge update (moving edge between handles)
  // This is called when user drags an edge to a different handle (onEdgeUpdate)
  const handleEdgeUpdate = useCallback((oldEdge: any, newConnection: Connection) => {
    if (!newConnection.source || !newConnection.target) return;
    
    console.log('handleEdgeUpdate called with:', { oldEdge: oldEdge.id, newConnection });
    
    // Mark this edge as recently updated to prevent onEdgesChange from reverting it
    recentlyUpdatedEdgesRef.current.add(oldEdge.id);
    
    // Clear the flag after a short delay
    setTimeout(() => {
      recentlyUpdatedEdgesRef.current.delete(oldEdge.id);
    }, 500);
    
    // CRITICAL: Update localEdges FIRST before updating the unified state
    // This ensures React Flow sees the updated edge immediately and doesn't revert it
    setLocalEdges(prev => prev.map(e => 
      e.id === oldEdge.id
        ? {
            ...e,
            source: newConnection.source!,
            target: newConnection.target!,
            sourceHandle: newConnection.sourceHandle || undefined,
            targetHandle: newConnection.targetHandle || undefined,
          }
        : e
    ));
    
    // Then update the edge connection in the unified state
    // This will also update reactFlowEdges via handleUpdateEdgeConnection
    actions.updateEdgeConnection(oldEdge, newConnection);
  }, [actions]);


  // Custom onEdgesChange that preserves edge updates
  // This prevents onEdgesChange from overwriting manual edge updates made via onEdgeUpdate
  const handleEdgesChange = useCallback((changes: any[]) => {
    // Filter out changes to edges that were just updated via onEdgeUpdate
    const filteredChanges = changes.filter(change => {
      // If this change affects an edge we just updated, ignore it
      if (change.id && recentlyUpdatedEdgesRef.current.has(change.id)) {
        console.log('Ignoring change for recently updated edge:', change.id);
        return false;
      }
      return true;
    });
    
    // Apply filtered changes
    if (filteredChanges.length > 0 || changes.length === 0) {
      onEdgesChange(filteredChanges.length > 0 ? filteredChanges : changes);
    }
  }, [onEdgesChange]);

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

            // Pass empty array for summary report before saving - confirmRemoval will handle it
            // Otherwise pass the actual operations
            const operations = state.ui.pendingSave 
              ? [] // Summary report - confirmRemoval will use pendingChanges directly
              : [...nodeRemovals, ...edgeRemovals];
            
            await actions.confirmRemoval(operations);
          } catch (err: any) {
            console.error('Error confirming removal:', err);
            // TODO: Show error message to user
          }
        }, [actions, state.pendingChanges, state.ui.pendingSave, workflowEditor.impactReport]);

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
        scope={finalScope}
        projectId={finalProjectId}
      />

      {/* React Flow */}
      <div className="react-flow-container" style={{ height: '600px', width: '100%' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={reactFlowNodes}
            edges={localEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onEdgeUpdate={handleEdgeUpdate}
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
