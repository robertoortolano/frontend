import { ReactNode, useRef, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import layout from "../../styles/common/Layout.module.css";

export interface AccordionProps {
  id: string | number;
  title: string | ReactNode;
  children: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showIcon?: boolean;
  defaultIconSize?: number;
  headerActions?: ReactNode; // Azioni extra da mostrare nell'header (es. pulsanti)
}

export default function Accordion({
  id,
  title,
  children,
  isExpanded,
  onToggle,
  className = "",
  headerClassName = "",
  contentClassName = "",
  showIcon = true,
  defaultIconSize = 20,
  headerActions,
}: AccordionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const accordionId = `accordion-${id}`;
  const panelId = `panel-${id}`;
  const headerId = `header-${id}`;

  // Gestione animazione con max-height
  useEffect(() => {
    if (contentRef.current) {
      if (isExpanded) {
        // Imposta maxHeight al scrollHeight effettivo per l'animazione
        const scrollHeight = contentRef.current.scrollHeight;
        contentRef.current.style.maxHeight = `${scrollHeight}px`;
        // Dopo l'animazione, rimuovi il limite per permettere contenuti dinamici
        setTimeout(() => {
          if (contentRef.current && isExpanded) {
            contentRef.current.style.maxHeight = "none";
          }
        }, 300); // Match transition duration
      } else {
        // Prima di collassare, imposta maxHeight al valore attuale per animare
        if (contentRef.current.scrollHeight > 0) {
          contentRef.current.style.maxHeight = `${contentRef.current.scrollHeight}px`;
        }
        // Forza reflow
        void contentRef.current.offsetHeight;
        // Poi anima a 0
        requestAnimationFrame(() => {
          if (contentRef.current) {
            contentRef.current.style.maxHeight = "0px";
          }
        });
      }
    }
  }, [isExpanded, children]);

  // Gestione resize per ricalcolare max-height
  useEffect(() => {
    const handleResize = () => {
      if (contentRef.current && isExpanded) {
        contentRef.current.style.maxHeight = `${contentRef.current.scrollHeight}px`;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExpanded]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div className={`${layout.block} ${className}`} id={accordionId}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'nowrap', width: '100%' }}>
        <button
          type="button"
          id={headerId}
          className={`${layout.blockHeader} cursor-pointer flex items-center justify-between ${headerClassName}`}
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          aria-label={typeof title === "string" ? `${title}, ${isExpanded ? "espanso" : "collassato"}` : undefined}
          style={{ flex: '1 1 0%', minWidth: 0, overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexGrow: 1, minWidth: 0, width: '100%' }}>
            {showIcon && (
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-hidden="true">
                {isExpanded ? (
                  <Minus size={defaultIconSize} />
                ) : (
                  <Plus size={defaultIconSize} />
                )}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', flex: '1 1 0%', margin: 0, padding: 0, minWidth: 0, overflow: 'hidden' }}>
              {title}
            </span>
          </div>
        </button>
        {headerActions && (
          <div style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            {headerActions}
          </div>
        )}
      </div>

      <div
        id={panelId}
        ref={contentRef}
        role="region"
        aria-labelledby={headerId}
        className={`accordion-content ${contentClassName}`}
        style={{
          overflow: "hidden",
          transition: "max-height 0.3s ease-out",
        }}
      >
        <div className={layout.mt4}>{children}</div>
      </div>
    </div>
  );
}

