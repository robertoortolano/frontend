import { useEffect, useState, MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import form from "../../styles/common/Forms.module.css";

interface DraggableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | ReactNode;
  children: ReactNode;
  headerContent?: ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  minHeight?: string;
  width?: string;
  zIndex?: number;
  overlayId?: string;
  scrollableContentId?: string;
  onOpen?: () => void;
}

export default function DraggableModal({
  isOpen,
  onClose,
  title,
  children,
  headerContent,
  maxWidth = "56rem",
  maxHeight = "90vh",
  minHeight = "400px",
  width = "100%",
  zIndex = 9999,
  overlayId,
  scrollableContentId = "modal-scrollable-content",
  onOpen,
}: DraggableModalProps) {
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest(".modal-header")) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDragging) {
        setModalPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, dragStart]);

  // Reset modal position when opening
  useEffect(() => {
    if (isOpen) {
      setModalPosition({ x: 0, y: 0 });
      if (onOpen) {
        onOpen();
      }
    }
  }, [isOpen, onOpen]);

  if (!isOpen) {
    return null;
  }

  const defaultHeader = (
    <div
      className="modal-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem",
        borderBottom: "1px solid #e5e7eb",
        cursor: "move",
        backgroundColor: "#f3f4f6",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {typeof title === "string" ? (
          <>
            <svg
              style={{ width: "1.25rem", height: "1.25rem", color: "#4b5563" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
            <span id="modal-title" style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>
              {title}
            </span>
          </>
        ) : (
          <span id="modal-title">{title}</span>
        )}
      </div>
      <button
        onClick={onClose}
        className={form.closeButton}
        type="button"
        aria-label="Chiudi modal"
      >
        <svg style={{ width: "1.5rem", height: "1.5rem" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  return createPortal(
    <div
      id={overlayId}
      role="presentation"
      className={form.modalOverlay}
      style={{
        zIndex,
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && (e.target as HTMLElement).id !== scrollableContentId) {
          onClose();
        }
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          backgroundColor: "white",
          borderRadius: "0.5rem",
          maxWidth,
          width,
          maxHeight,
          minHeight,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(30, 58, 138, 0.3)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`,
          cursor: isDragging ? "move" : "default",
        }}
      >
        {headerContent || defaultHeader}

        <div
          id={scrollableContentId}
          className={form.modalBody}
          role="region"
          aria-label="Modal content"
          style={{
            minHeight: "400px",
            maxHeight: `calc(${maxHeight} - 120px)`,
            height: `calc(${maxHeight} - 120px)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ minHeight: "100%" }}>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

