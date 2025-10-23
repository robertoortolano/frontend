import { useState, useRef, useEffect, MouseEvent } from "react";
import { Outlet } from "react-router-dom";
import NavProject from "./NavProject";
import layout from "../styles/common/Layout.module.css";

export default function ProjectLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = (e: MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: any) => {
    if (isResizing && sidebarRef.current) {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 500) {
        setSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  return (
    <div className={layout["app-container"]}>
      <div ref={sidebarRef} className={`${layout.sidebar} ${isResizing ? layout.resizing : ""}`} style={{ width: `${sidebarWidth}px` }}>
        <div className={layout["sidebar-content"]}>
          <NavProject />
        </div>

        <button
          type="button"
          className={`${layout["resize-handle"]} ${isResizing ? layout.resizing : ""}`}
          onMouseDown={startResizing}
          aria-label="Resize sidebar"
          tabIndex={0}
        />
      </div>

      <div className={layout["main-content"]}>
        <div className={layout["scrollable-area"]}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
