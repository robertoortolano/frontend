import { ReactNode } from "react";
import layout from "../../../styles/common/Layout.module.css";

type PageSectionVariant = "default" | "plain";

interface PageSectionProps {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerSlot?: ReactNode;
  variant?: PageSectionVariant;
}

export function PageSection({
  title,
  description,
  children,
  className,
  bodyClassName,
  headerSlot,
  variant = "default",
}: PageSectionProps) {
  const sectionClass = [
    variant === "default" ? layout.section : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const headerProvided = title || description || headerSlot;

  return (
    <section className={sectionClass}>
      {headerProvided ? (
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            {typeof title === "string" ? (
              <h2 className={layout.sectionTitle}>{title}</h2>
            ) : (
              title
            )}
            {description ? (
              <div className={layout.paragraphMuted}>{description}</div>
            ) : null}
          </div>
          {headerSlot}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}














