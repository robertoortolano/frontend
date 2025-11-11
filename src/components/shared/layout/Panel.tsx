import { HTMLAttributes, ReactNode } from "react";
import layout from "../../../styles/common/Layout.module.css";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  headingLevel?: "h2" | "h3" | "h4";
  bodyClassName?: string;
}

export function Panel({
  title,
  description,
  footer,
  headingLevel = "h2",
  children,
  className,
  bodyClassName,
  ...rest
}: PanelProps) {
  const HeadingTag = headingLevel;

  const panelClass = [layout.block, className].filter(Boolean).join(" ");

  return (
    <div className={panelClass} {...rest}>
      {(title || description) && (
        <div className="mb-4">
          {title ? (
            typeof title === "string" ? (
              <HeadingTag className={layout.sectionTitle}>{title}</HeadingTag>
            ) : (
              title
            )
          ) : null}
          {description ? (
            <div className={layout.paragraphMuted}>{description}</div>
          ) : null}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}


