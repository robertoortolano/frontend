import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import styles from "../../../styles/common/WorkflowBoard.module.css";

export default function CategoryPopover({
  value,
  onChange,
  categories,
  small,
  children,
  onRemove,
  isInitial,
  onSetInitial, // nuova prop
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={styles.popover}
      ref={ref}
      style={{
        fontSize: small ? 12 : 14,
        position: "relative",
        display: "inline-block",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          backgroundColor: 'transparent',
          borderRadius: 6,
          cursor: "pointer",
          color: 'white',
          padding: small ? "2px 8px" : "6px 12px",
          userSelect: "none",
          minWidth: small ? 50 : 80,
          textAlign: "center",
          fontWeight: "bold",
          fontSize: small ? 12 : 14,
          border: "none",
        }}
      >
        {children}
        {isInitial}
      </button>

      {open && (
        <div
          className={styles.popoverMenu}
          onMouseDown={(e) => e.stopPropagation()}
          tabIndex={-1}
          aria-hidden="true"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onChange(cat);
                setOpen(false);
              }}
              className={value === cat ? styles.popoverItemActive : styles.popoverItem}
              style={{
                border: "none",
                width: "100%",
                textAlign: "left",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}

          <hr style={{ margin: "8px 0", borderColor: "#ccc" }} />

          <button
            type="button"
            onClick={() => {
              if (!isInitial && onSetInitial) {
                onSetInitial();
              }
              setOpen(false);
            }}
            className={styles.popoverItem}
            style={{
              fontWeight: "bold",
              color: isInitial ? "#198754" : "#0d6efd", // verde se già iniziale
              width: "100%",
              textAlign: "center",
              background: "transparent",
              border: "none",
              padding: "6px 12px",
              cursor: isInitial ? "default" : "pointer",
              opacity: isInitial ? 0.7 : 1,
            }}
            disabled={isInitial}
          >
            {isInitial ? "Initial ✔️" : "Set initial"}
          </button>


          <button
            type="button"
            onClick={() => {
                if (onRemove) {
                  const confirmed = window.confirm(
                    "Sei sicuro di voler eliminare questo stato? Verranno rimosse anche le transizioni collegate."
                  );
                  if (confirmed) {
                    onRemove();
                  }
                }
                setOpen(false);
              }}
            className={styles.popoverItem}
            style={{
              fontWeight: "bold",
              color: "#dc3545",
              width: "100%",
              textAlign: "center",
              background: "transparent",
              border: "none",
              padding: "6px 12px",
              cursor: onRemove ? "pointer" : "default",
            }}
            disabled={!onRemove}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

CategoryPopover.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  small: PropTypes.bool,
  children: PropTypes.node,
  onRemove: PropTypes.func,
  isInitial: PropTypes.bool,
  onSetInitial: PropTypes.func,
};

CategoryPopover.defaultProps = {
  small: false,
  children: null,
  onRemove: null,
  isInitial: false,
  onSetInitial: null,
};