import { BaseEdge, getSmoothStepPath } from "reactflow";
import PropTypes from "prop-types";

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
  onEdgeUpdate,
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

  const onLabelChange = (event) => {
    const newLabel = event.target.value;
    setEdges((eds) =>
      eds.map((e) =>
        e.id === id
          ? {
              ...e,
              data: {
                ...e.data,
                label: newLabel, // 👈 aggiorna label visibile
                transitionId: e.data.transitionId ?? null, // 👈 mantieni transitionId
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
        onEdgeUpdate={onEdgeUpdate}
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
            xmlns="http://www.w3.org/1999/xhtml"
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

SelectableEdge.propTypes = {
  id: PropTypes.string.isRequired,
  sourceX: PropTypes.number.isRequired,
  sourceY: PropTypes.number.isRequired,
  targetX: PropTypes.number.isRequired,
  targetY: PropTypes.number.isRequired,
  sourcePosition: PropTypes.any,
  targetPosition: PropTypes.any,
  style: PropTypes.object,
  markerEnd: PropTypes.any,
  selected: PropTypes.bool,
  data: PropTypes.shape({
    label: PropTypes.string,
    transitionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  setEdges: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdgeUpdate: PropTypes.func,
};
