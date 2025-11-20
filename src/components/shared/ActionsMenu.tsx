import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import popup from "../../styles/common/Popup.module.css";

export interface ActionItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

interface ActionsMenuProps {
  actions: ActionItem[];
  disabled?: boolean;
}

export default function ActionsMenu({ actions, disabled = false }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [position, setPosition] = useState<"top" | "bottom">("bottom");

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const placeTop = spaceBelow < 200 && spaceAbove > 200;
      setPosition(placeTop ? "top" : "bottom");

      setCoords({
        top: placeTop
          ? rect.top + window.scrollY - 5
          : rect.bottom + window.scrollY + 5,
        left: rect.right + window.scrollX - 150, // Allinea a destra del bottone
      });
    }
  }, [open]);

  const handleActionClick = (action: ActionItem) => {
    if (!action.disabled) {
      action.onClick();
      setOpen(false);
    }
  };

  const availableActions = actions.filter((action) => !action.disabled);
  const allActionsDisabled = actions.length > 0 && availableActions.length === 0;
  const isButtonDisabled = disabled || allActionsDisabled;

  // Mostra sempre il bottone, anche se tutte le azioni sono disabilitate
  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        disabled={isButtonDisabled}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        style={{ 
          background: 'none',
          border: 'none',
          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
          opacity: isButtonDisabled ? 0.5 : 1
        }}
        title="Azioni"
      >
        <MoreVertical size={18} className="text-gray-600" />
      </button>

      {open &&
        actions.length > 0 &&
        createPortal(
          <div
            ref={popupRef}
            className={`${popup.portal} ${position === "top" ? popup.portalTop : ""}`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              padding: '0.5rem',
              minWidth: '150px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {actions.map((action, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled}
                    className={`${action.className || ''}`}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      border: 'none',
                      background: 'none',
                      cursor: action.disabled ? 'not-allowed' : 'pointer',
                      color: action.disabled ? '#9ca3af' : '#1e3a8a',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: action.disabled ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!action.disabled) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {action.icon && <span>{action.icon}</span>}
                    <span>{action.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}

