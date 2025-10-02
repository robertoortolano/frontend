import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  BaseEdge
} from 'reactflow';

import { nanoid } from 'nanoid';

import CategoryPopover from "./components/CategoryPopover";
import 'reactflow/dist/style.css';
import board from '../../styles/common/WorkflowBoard.module.css';

import api from '../../api/api';
import { useNavigate } from 'react-router-dom';

// Custom edge component con bottone elimina
function SelectableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  onDelete,
}) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onClickDelete = (event) => {
    event.stopPropagation();
    if (window.confirm("Sei sicuro di voler eliminare questa transizione?")) {
      onDelete(id);
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: selected ? 2 : 1 }} />
      {selected && (
        <foreignObject
          x={labelX - 10}
          y={labelY - 10}
          width={30}
          height={20}
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div xmlns="http://www.w3.org/1999/xhtml">
            <button
              onClick={onClickDelete}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </foreignObject>
      )}
    </>
  );
}

export default function WorkflowBoard() {
  const [workflowName, setWorkflowName] = useState("");
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [statusCategories, setStatusCategories] = useState([]); // Categorie enum da backend
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [nextId, setNextId] = useState(1);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const navigate = useNavigate();

  // Rimuove edge dato id
  const onDeleteEdge = useCallback((edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, [setEdges]);

  const onConnect = useCallback(
    (params) => {
      const edgeId = nanoid();
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: edgeId,
            type: 'selectableEdge',  // usa edge custom
            animated: false,
            style: { stroke: 'black', strokeWidth: 0.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: 'black',
            },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onCategoryChange = useCallback((nodeId, newCategory) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              category: newCategory,
            },
            style: {
              background: getCategoryColor(newCategory),
              backgroundBlendMode: 'multiply',
              color: '#fff',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              padding: 0,
              boxSizing: 'border-box',
              zIndex: node.selected ? 1000 : 1,
            },
            position: node.position,
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Aggiunge nuovo nodo/stato
  const addState = () => {
    if (!selectedStatusId) return;
    if (nodes.some((n) => n.data.statusId === Number(selectedStatusId))) return;

    const selectedStatus = availableStatuses.find((s) => s.id === Number(selectedStatusId));
    if (!selectedStatus) return;

    const defaultCategory = statusCategories.length > 0 ? statusCategories[0] : null;
    if (!defaultCategory) {
      console.warn("Nessuna categoria caricata dal backend!");
      return;
    }

    const nodeId = `${nextId}`;

    const newNode = {
      id: nodeId,
      data: {
        label: selectedStatus.name,
        statusId: selectedStatus.id,
        category: defaultCategory,
        onCategoryChange: (newCat) => onCategoryChange(nodeId, newCat),
        categories: statusCategories,
      },
      position: { x: 100, y: 100 },
      type: 'customNode',
      style: {
        background: getCategoryColor(defaultCategory),
        color: '#aaa',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 12,
        padding: 0,
        boxSizing: 'border-box',
        zIndex: 1,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNextId((id) => id + 1);
    setSelectedStatusId('');
  };

  // Colori categorie
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'TODO': return 'rgba(108, 117, 125, 0.5)';
      case 'PROGRESS': return 'rgba(13, 110, 253, 0.5)';
      case 'COMPLETED': return 'rgba(25, 135, 84, 0.5)';
      default: return 'rgba(108, 117, 125, 0.3)';
    }
  };

  useEffect(() => {
    api.get('/statuses')
      .then(res => setAvailableStatuses(res.data))
      .catch(err => console.error("Errore nel caricamento degli stati:", err));

    api.get('/statuses/categories')
      .then(res => setStatusCategories(res.data))
      .catch(err => console.error("Errore nel caricamento delle categorie:", err));
  }, []);

  const NodeLabel = useCallback(({ data }) => {
    return (
      <div className="customNode" style={{ position: 'relative', padding: 0, background: 'transparent' }}>
        {/* Handles */}
        <Handle type="target" position={Position.Top} id="top-target" className="handle" />
        <Handle type="source" position={Position.Top} id="top-source" className="handle" />
        <Handle type="target" position={Position.Right} id="right-target" className="handle" />
        <Handle type="source" position={Position.Right} id="right-source" className="handle" />
        <Handle type="target" position={Position.Bottom} id="bottom-target" className="handle" />
        <Handle type="source" position={Position.Bottom} id="bottom-source" className="handle" />
        <Handle type="target" position={Position.Left} id="left-target" className="handle" />
        <Handle type="source" position={Position.Left} id="left-source" className="handle" />

        <div
          className="nodeLabel"
          style={{
            background: getCategoryColor(data.category),
            backgroundBlendMode: 'multiply',
            borderRadius: 6,
            fontSize: 12,
            padding: '6px 12px',
            minWidth: 100,
            textAlign: 'center',
            fontWeight: 'bold',
            color: '#fff',
            userSelect: 'none',
            boxSizing: 'border-box',
            cursor: 'pointer',
            zIndex: 1,
          }}
        >
          <CategoryPopover
            value={data.category}
            onChange={data.onCategoryChange}
            categories={data.categories || statusCategories}
            small
          >
            {data.label}
          </CategoryPopover>
        </div>
      </div>
    );
  }, [statusCategories]);

  const nodeTypesCustom = React.useMemo(() => ({
    customNode: NodeLabel,
  }), [NodeLabel]);

  const edgeTypes = React.useMemo(() => ({
    selectableEdge: (props) => <SelectableEdge {...props} onDelete={onDeleteEdge} />,
  }), [onDeleteEdge]);

  const handleSave = () => {
    console.log("Salvataggio workflow:", workflowName, nodes, edges);
    setWorkflowName("");
  };

  return (
    <ReactFlowProvider>
      <div className={board.wrapper}>
        <div className={board.controls}>
          <input
            type="text"
            placeholder="Nome del workflow"
            className={board.titleInput}
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
          />

          <label htmlFor="statusSelect">Stato</label>
          <select
            id="statusSelect"
            value={selectedStatusId}
            onChange={(e) => setSelectedStatusId(e.target.value)}
            className={board.titleInput}
          >
            <option value="">-- Seleziona stato --</option>
            {availableStatuses
              .filter(status => !nodes.some(n => n.data.statusId === status.id))
              .map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
          </select>

          <button
            onClick={addState}
            className={board.button}
            disabled={!selectedStatusId || statusCategories.length === 0}
          >
            Aggiungi stato
          </button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          nodeTypes={nodeTypesCustom}
          edgeTypes={edgeTypes}
          style={{ width: '100%', height: '600px' }}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>

        <div className={board.buttonBar}>
          <button
            className={`${board.button} ${board.cancelButton}`}
            onClick={() => navigate(-1)}
          >
            Annulla
          </button>
          <button className={board.button} onClick={handleSave}>
            Salva
          </button>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
