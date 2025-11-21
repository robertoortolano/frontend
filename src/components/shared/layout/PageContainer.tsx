import { CSSProperties, ReactNode } from "react";
import layout from "../../../styles/common/Layout.module.css";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
  style?: CSSProperties;
}

export function PageContainer({
  children,
  className,
  maxWidth = "1200px",
  style,
}: PageContainerProps) {
  const containerClass = [layout.container, className].filter(Boolean).join(" ");

  const mergedStyle: CSSProperties = {
    margin: maxWidth && maxWidth !== "100%" ? "0 auto" : undefined,
    maxWidth,
    width: "100%",
    ...style,
  };

  return (
    <div className={containerClass} style={mergedStyle}>
      {children}
    </div>
  );
}






















