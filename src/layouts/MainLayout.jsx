import React, { useState, useRef, useEffect } from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NavTenant from "../components/NavTenant";
import NavProjects from "../components/NavProjects";

import layout from '../styles/common/Layout.module.css';

export default function MainLayout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  const isTenant = useMatch("/tenant/*");
  const isProjects = useMatch("/projects/*");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const startResizing = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e) => {
    if (isResizing && sidebarRef.current) {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 500) {
        setSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  // Se non autenticato, non mostriamo nulla (redirect fatto sopra)
  if (!isAuthenticated) return null;

  return (
    <div className={layout["app-container"]}>
      <div
        ref={sidebarRef}
        className={`${layout.sidebar} ${isResizing ? layout.resizing : ''}`}
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className={layout["sidebar-content"]}>
          {isTenant && <NavTenant />}
          {isProjects && <NavProjects />}
        </div>

        <button
          type="button"
          className={`${layout["resize-handle"]} ${isResizing ? layout.resizing : ''}`}
          onMouseDown={startResizing}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") resizeLeft();
            if (e.key === "ArrowRight") resizeRight();
          }}
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
