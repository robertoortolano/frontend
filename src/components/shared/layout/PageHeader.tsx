import { ReactNode } from "react";
import layout from "../../../styles/common/Layout.module.css";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  const headerClass = [layout.headerSection, className]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClass}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {typeof title === "string" ? (
            <h1 className={layout.title}>{title}</h1>
          ) : (
            title
          )}
          {description ? (
            <div className={layout.paragraphMuted}>{description}</div>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}









