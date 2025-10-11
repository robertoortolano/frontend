import { BaseEdge, getSmoothStepPath } from "reactflow";
import { SelectableEdgeProps } from "../../../types/reactflow.types";

export default function SelectableEdge({
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
  data,
  setEdges,
  onDelete,
}: SelectableEdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition as any,
    targetX,
    targetY,
    targetPosition: targetPosition as any,
  });

  const onClickDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm("Sei sicuro di voler eliminare questa transizione?")) {
      onDelete(id);
    }
  };

  const onLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = event.target.value;
    setEdges((eds) =>
      eds.map((e) =>
        e.id === id
          ? {
              ...e,
              data: {
                ...e.data,
                label: newLabel,
                transitionId: e.data?.transitionId ?? null,
              },
            }
          : e
      )
    );
  };

  return (
    <g>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
      />

      {/* Etichetta visiva */}
      {data?.label && (
        <text
          x={labelX}
          y={labelY - 5}
          fill="black"
          fontSize={7}
          textAnchor="middle"
          dominantBaseline="central"
          pointerEvents="none"
        >
          {data.label}
        </text>
      )}

      {/* Campo input + bottone solo se selezionato */}
      {selected && (
        <foreignObject
          x={labelX - 60}
          y={labelY + 10}
          width={120}
          height={60}
          requiredExtensions="http://www.w3.org/1999/xhtml"
          style={{ overflow: "visible" }}
        >
          <div
            style={{
              background: "white",
              padding: "4px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              fontSize: "7px",
            }}
          >
            <input
              type="text"
              value={data?.label || ""}
              onChange={onLabelChange}
              placeholder="Nome transizione"
              style={{ fontSize: "7px", width: "100%" }}
            />
            <button
              onClick={onClickDelete}
              style={{
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "4px",
                cursor: "pointer",
                padding: "2px 4px",
              }}
            >
              ✕
            </button>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

