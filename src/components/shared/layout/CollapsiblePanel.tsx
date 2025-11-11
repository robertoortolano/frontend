import { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import layout from "../../../styles/common/Layout.module.css";

interface CollapsiblePanelProps {
  title: ReactNode;
  description?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  accentColor?: string;
  icon?: ReactNode;
  backgroundColor?: string;
}

export function CollapsiblePanel({
  title,
  description,
  isOpen,
  onToggle,
  children,
  className,
  contentClassName,
  accentColor = "#374151",
  icon,
  backgroundColor,
}: CollapsiblePanelProps) {
  const panelClass = [layout.block, className].filter(Boolean).join(" ");

  return (
    <div
      className={panelClass}
      style={{ borderColor: accentColor, backgroundColor }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left"
        style={{ background: "transparent" }}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span
            className={layout.sectionTitle}
            style={{ marginBottom: 0, color: accentColor }}
          >
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp size={20} color={accentColor} />
        ) : (
          <ChevronDown size={20} color={accentColor} />
        )}
      </button>
      {description ? (
        <p className={`${layout.paragraphMuted} mt-2`}>{description}</p>
      ) : null}
      {isOpen ? <div className={`mt-4 ${contentClassName ?? ""}`}>{children}</div> : null}
    </div>
  );
}


