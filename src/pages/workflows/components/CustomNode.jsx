// CustomNode.jsx
import React from "react";
import { Handle, Position } from "reactflow";
import CategoryPopover from "./CategoryPopover";
import { getCategoryColor } from "./workflowUtils";
import PropTypes from "prop-types";

export default function CustomNode({ data, statusCategories }) {
  return (
    <div className="customNode" style={{ position: "relative", padding: 0, background: "transparent" }}>
      {/* Handles (top, bottom, left, right, diagonali) */}
      <Handle type="target" position={Position.Top} id="top-target" className="handle small-handle" />
      <Handle type="target" position={Position.Top} id="top-left-target" className="handle small-handle" style={{ left: 20}} />
      <Handle type="target" position={Position.Top} id="top-right-target" className="handle small-handle" style={{ left: 80}} />
      <Handle type="source" position={Position.Top} id="top-source" className="handle small-handle" style={{ opacity: 1 }} />
      <Handle type="source" position={Position.Top} id="top-left-source" className="handle small-handle" style={{ left: 20}} />
      <Handle type="source" position={Position.Top} id="top-right-source" className="handle small-handle" style={{ left: 80}} />
      <Handle type="target" position={Position.Right} id="right-target" className="handle small-handle" />
      <Handle type="source" position={Position.Right} id="right-source" className="handle small-handle" style={{ opacity: 1 }} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="handle small-handle" />
      <Handle type="target" position={Position.Bottom} id="bottom-left-target" className="handle small-handle" style={{ left: 20}} />
      <Handle type="target" position={Position.Bottom} id="bottom-right-target" className="handle small-handle" style={{ left: 80}} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="handle small-handle" style={{ opacity: 1 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-left-source" className="handle small-handle" style={{ left: 20}} />
      <Handle type="source" position={Position.Bottom} id="bottom-right-source" className="handle small-handle" style={{ left: 80}} />
      <Handle type="target" position={Position.Left} id="left-target" className="handle small-handle" />
      <Handle type="source" position={Position.Left} id="left-source" className="handle small-handle" style={{ opacity: 1 }} />

      {/* Label */}
      <div
        className="nodeLabel"
        style={{
          background: getCategoryColor(data.category),
          borderRadius: 6,
          fontSize: 12,
          padding: "6px 12px",
          minWidth: 100,
          textAlign: "center",
          fontWeight: "bold",
          color: "#fff",
          cursor: "pointer",
          border: data.isInitial ? "3px" : "1px",
          boxShadow: data.isInitial ? "0 0 15px #434301" : "none",
        }}
      >
        <CategoryPopover
          value={data.category}
          onChange={data.onCategoryChange}
          categories={data.categories || statusCategories}
          small
          onRemove={data.onRemove}
          isInitial={data.isInitial}
          onSetInitial={data.onSetInitial}
        >
          {data.label}
        </CategoryPopover>
      </div>
    </div>
  );
}
CustomNode.propTypes = {
    data: PropTypes.shape({
        label: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        onCategoryChange: PropTypes.func.isRequired,
        categories: PropTypes.arrayOf(PropTypes.string),
        onRemove: PropTypes.func,
        isInitial: PropTypes.bool,
        onSetInitial: PropTypes.func,
    }).isRequired,
    statusCategories: PropTypes.arrayOf(PropTypes.string).isRequired,
};
