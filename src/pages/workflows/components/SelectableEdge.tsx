import React, { useState, useEffect, useRef } from "react";
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
  onUpdateLabel,
}: SelectableEdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition as any,
    targetX,
    targetY,
    targetPosition: targetPosition as any,
  });

  // Internal state to prevent input from losing focus
  const [localLabel, setLocalLabel] = useState(data?.label || "");
  
  // Track previous selected state to detect deselection
  const prevSelectedRef = useRef(selected);

  // Update local label when data.label changes externally
  useEffect(() => {
    setLocalLabel(data?.label || "");
  }, [data?.label]);

  // Save label when edge is deselected (user clicks on background)
  // This ensures the label is saved even if onBlur doesn't fire
  useEffect(() => {
    // Check if we transitioned from selected to deselected
    if (prevSelectedRef.current === true && selected === false) {
      // Edge was just deselected - save the label if it changed
      if (localLabel !== (data?.label || "")) {
        setEdges((eds) =>
          eds.map((e) =>
            e.id === id
              ? {
                  ...e,
                  data: {
                    ...e.data,
                    label: localLabel,
                    transitionId: e.data?.transitionId ?? null,
                  },
                }
              : e
          )
        );
        
        // Update unified state if callback is provided
        if (onUpdateLabel) {
          onUpdateLabel(id, localLabel);
        }
      }
    }
    
    // Update ref for next render
    prevSelectedRef.current = selected;
  }, [selected, localLabel, data?.label, id, setEdges, onUpdateLabel]);

  const onClickDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete(id);
  };

  const onLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = event.target.value;
    setLocalLabel(newLabel);
  };

  // Update the edge data when input loses focus
  const onLabelBlur = () => {
    // Update React Flow edges
    setEdges((eds) =>
      eds.map((e) =>
        e.id === id
          ? {
              ...e,
              data: {
                ...e.data,
                label: localLabel,
                transitionId: e.data?.transitionId ?? null,
              },
            }
          : e
      )
    );
    
    // Update unified state if callback is provided
    if (onUpdateLabel) {
      onUpdateLabel(id, localLabel);
    }
  };

  return (
    <g>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
      />

      {/* Etichetta visiva */}
      {(localLabel || data?.label) && (
        <text
          x={labelX}
          y={labelY - 5}
          fill="black"
          fontSize={7}
          textAnchor="middle"
          dominantBaseline="central"
          pointerEvents="none"
        >
          {localLabel || data?.label}
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
              value={localLabel}
              onChange={onLabelChange}
              onBlur={onLabelBlur}
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

