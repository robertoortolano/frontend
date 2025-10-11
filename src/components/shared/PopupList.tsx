import { useEffect, useRef, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import popup from "../../styles/common/Popup.module.css";

interface GenericPopupListProps<T = any> {
  triggerLabel: string | number;
  disabled?: boolean;
  items?: T[];
  title?: string;
  renderItem?: (item: T) => ReactNode;
}

export default function GenericPopupList<T extends { id?: number | string }>({
  triggerLabel,
  disabled = false,
  items = [],
  title = "Elementi:",
  renderItem = (item: any) => item.name || item.label || item,
}: GenericPopupListProps<T>) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [position, setPosition] = useState<"top" | "bottom">("bottom");

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const togglePopup = () => setOpen((prev) => !prev);

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
          ? rect.top + window.scrollY
          : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={popup.trigger}
        onClick={togglePopup}
        disabled={disabled || items.length === 0}
        title={
          disabled || items.length === 0
            ? "Nessun elemento"
            : "Visualizza dettagli"
        }
      >
        {triggerLabel}
      </button>

      {open &&
        items.length > 0 &&
        createPortal(
          <div
            ref={popupRef}
            className={`${popup.portal} ${position === "top" ? popup.portalTop : ""}`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
          >
            <strong>{title}</strong>
            <ul className={popup.list}>
              {items.map((item, idx) => (
                <li key={item.id || idx}>{renderItem(item)}</li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}

