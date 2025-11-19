import { useEffect, useRef, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import form from "../../styles/common/Forms.module.css";

export interface CardListModalItem {
  id: number | string;
  [key: string]: any; // Permette proprietà aggiuntive
}

export interface CardListModalProps<T extends CardListModalItem> {
  // Trigger props
  triggerLabel: string | ReactNode;
  triggerDisabled?: boolean;
  triggerTitle?: string;
  onTriggerClick?: () => void;
  
  // Modal structure
  title: string;
  items: T[];
  emptyMessage?: string;
  
  // Summary section (opzionale)
  summary?: {
    label: string;
    value: string | number;
  };
  
  // Content rendering
  renderCard: (item: T, index: number) => ReactNode;
  
  // Modal dimensions
  maxWidth?: string;
  maxHeight?: string;
  
  // Callbacks
  onOpen?: () => void;
  onClose?: () => void;
}

export default function CardListModal<T extends CardListModalItem>({
  triggerLabel,
  triggerDisabled = false,
  triggerTitle,
  onTriggerClick,
  title,
  items,
  emptyMessage = "Nessun elemento disponibile",
  summary,
  renderCard,
  maxWidth = "900px",
  maxHeight = "80vh",
  onOpen,
  onClose,
}: CardListModalProps<T>) {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const togglePopup = () => {
    if (onTriggerClick) {
      onTriggerClick();
    }
    setOpen((prev) => {
      const newState = !prev;
      if (newState && onOpen) {
        onOpen();
      } else if (!newState && onClose) {
        onClose();
      }
      return newState;
    });
  };

  const closePopup = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        if (onClose) {
          onClose();
        }
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      // Previeni lo scroll del body quando il modal è aperto
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        className="trigger-button"
        onClick={togglePopup}
        disabled={triggerDisabled || items.length === 0}
        title={triggerTitle || (items.length === 0 ? "Nessun elemento" : "Visualizza dettagli")}
        style={{
          background: "none",
          border: "none",
          color: "#1e3a8a",
          cursor: triggerDisabled || items.length === 0 ? "not-allowed" : "pointer",
          textDecoration: "underline",
          fontWeight: "bold",
          padding: 0,
          opacity: triggerDisabled || items.length === 0 ? 0.5 : 1,
        }}
      >
        {triggerLabel}
      </button>

      {open &&
        items.length > 0 &&
        createPortal(
          <div className={form.modalOverlay}>
            <div
              ref={modalRef}
              className={form.modal}
              style={{ maxWidth, maxHeight, overflow: "auto" }}
            >
              <div className={form.modalHeader}>
                <h2 className={form.modalTitle}>{title}</h2>
                <button
                  type="button"
                  className={form.closeButton}
                  onClick={closePopup}
                >
                  ✕
                </button>
              </div>

              <div className={form.modalBody}>
                {/* Summary Section (opzionale) */}
                {summary && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "1rem",
                      padding: "0.75rem",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      {summary.label}: <strong style={{ color: "#1e3a8a" }}>{summary.value}</strong>
                    </span>
                  </div>
                )}

                {/* Content */}
                {items.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                    {emptyMessage}
                  </div>
                ) : (
                  <div style={{ maxHeight: `calc(${maxHeight} - 200px)`, overflowY: "auto" }}>
                    {items.map((item, index) => renderCard(item, index))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}



