import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import form from "../../styles/common/Forms.module.css";

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | ReactNode;
  children: ReactNode;
  headerContent?: ReactNode;
  showCloseButton?: boolean;
  maxWidth?: string;
  maxHeight?: string;
  width?: string;
  height?: string;
  padding?: string;
  zIndex?: number;
  overlayClassName?: string;
  modalClassName?: string;
  onClickOutside?: () => void;
  onOpen?: () => void;
  useCSSModules?: boolean;
}

export default function SimpleModal({
  isOpen,
  onClose,
  title,
  children,
  headerContent,
  showCloseButton = true,
  maxWidth = "90%",
  maxHeight = "90vh",
  width,
  height,
  padding = "20px",
  zIndex = 1000,
  overlayClassName,
  modalClassName,
  onClickOutside,
  onOpen,
  useCSSModules = true,
}: SimpleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (onOpen) {
        onOpen();
      }
      // Previeni lo scroll del body quando il modal è aperto
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        onClickOutside
      ) {
        onClickOutside();
      } else if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, onClickOutside]);

  if (!isOpen) {
    return null;
  }

  const overlayStyle = useCSSModules
    ? undefined
    : {
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex,
      };

  const modalStyle = useCSSModules
    ? undefined
    : {
        background: "white",
        padding,
        width: width || "80%",
        height: height || "80%",
        maxWidth,
        maxHeight,
        position: "relative" as const,
        borderRadius: "8px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        overflow: "auto",
      };

  const defaultHeader = title ? (
    <div
      className={useCSSModules ? form.modalHeader : undefined}
      style={useCSSModules ? undefined : {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {typeof title === "string" ? (
        <h2 
          id="modal-title"
          className={useCSSModules ? form.modalTitle : undefined}
          style={useCSSModules ? undefined : { margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "#1f2937" }}
        >
          {title}
        </h2>
      ) : (
        <span id="modal-title">{title}</span>
      )}
      {showCloseButton && (
        <button
          onClick={onClose}
          className={useCSSModules ? form.closeButton : undefined}
          type="button"
          style={useCSSModules ? {
            position: "absolute",
            top: 10,
            right: 10,
          } : {
            position: "absolute",
            top: 10,
            right: 10,
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: "#6b7280",
            padding: "0.25rem",
            lineHeight: 1,
          }}
          aria-label="Chiudi modal"
        >
          ✕
        </button>
      )}
    </div>
  ) : showCloseButton ? (
    <button
      onClick={onClose}
      className={useCSSModules ? form.closeButton : undefined}
      type="button"
      style={useCSSModules ? {
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 10,
      } : {
        position: "absolute",
        top: 10,
        right: 10,
        background: "none",
        border: "none",
        fontSize: "1.5rem",
        cursor: "pointer",
        color: "#6b7280",
        padding: "0.25rem",
        lineHeight: 1,
        zIndex: 10,
      }}
      aria-label="Chiudi modal"
    >
      ✕
    </button>
  ) : null;

  const modalTitleId = title ? "modal-title" : undefined;

  return createPortal(
    <div
      className={useCSSModules ? overlayClassName || form.modalOverlay : undefined}
      style={overlayStyle}
      role={useCSSModules ? undefined : "presentation"}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClickOutside) {
          onClickOutside();
        } else if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className={useCSSModules ? modalClassName || form.modal : undefined}
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        onClick={(e) => e.stopPropagation()}
      >
        {headerContent || defaultHeader}
        {children}
      </div>
    </div>,
    document.body
  );
}

