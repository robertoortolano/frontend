import ReactFlow, {
  Background,
  Connection,
  Controls,
  Edge,
  EdgeTypes,
  MiniMap,
  NodeTypes,
  OnEdgesChange,
  OnNodesChange,
} from "reactflow";
import WorkflowControls from "../components/WorkflowControls";
import board from "../../../styles/common/WorkflowBoard.module.css";
import { WorkflowControlsProps } from "../../../types/reactflow.types";

interface WorkflowStatusTabProps {
  controlsProps: WorkflowControlsProps;
  nodes: any[];
  edges: any[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onEdgeUpdate: (oldEdge: Edge, newConnection: Connection) => void;
  nodeTypes: NodeTypes;
  edgeTypes: EdgeTypes;
  onCancel: () => void;
  onSave: () => void | Promise<void>;
  canSave: boolean;
  saving: boolean;
}

export function WorkflowStatusTab({
  controlsProps,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onEdgeUpdate,
  nodeTypes,
  edgeTypes,
  onCancel,
  onSave,
  canSave,
  saving,
}: WorkflowStatusTabProps) {
  return (
    <div className={board.wrapper}>
      <WorkflowControls {...controlsProps} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeUpdate={onEdgeUpdate}
        fitView
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        className="w-full"
        style={{ height: "600px" }}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>

      <div className={board.buttonBar}>
        <button className={`${board.button} ${board.cancelButton}`} onClick={onCancel}>
          Cancel
        </button>
        <button className={board.button} disabled={saving || !canSave} onClick={onSave}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}


