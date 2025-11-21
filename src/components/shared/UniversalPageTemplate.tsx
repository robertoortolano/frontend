import { ReactNode } from "react";
import layout from "../../styles/common/Layout.module.css";
import alert from "../../styles/common/Alerts.module.css";

interface UniversalPageTemplateProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  error?: string | null;
  children: ReactNode;
  headerActions?: ReactNode;
  maxWidth?: string;
  className?: string;
}

export default function UniversalPageTemplate({
  title,
  description,
  error,
  children,
  headerActions,
  maxWidth = "1200px",
  className,
}: UniversalPageTemplateProps) {
  return (
    <div 
      className={`${layout.container} ${className || ""}`} 
      style={{ maxWidth, margin: '0 auto' }}
    >
      {/* Header Section */}
      <div className={layout.headerSection}>
        {title && (
          typeof title === "string" ? (
            <h1 className={layout.title}>{title}</h1>
          ) : (
            title
          )
        )}
        {description && (
          typeof description === "string" ? (
            <p className={layout.paragraphMuted}>{description}</p>
          ) : (
            description
          )
        )}
        {headerActions && (
          <div className={layout.buttonRow}>
            {headerActions}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      {/* Content Section */}
      <div className={layout.section}>
        {children}
      </div>
    </div>
  );
}





