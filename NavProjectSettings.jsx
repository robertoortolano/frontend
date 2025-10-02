import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

export default function ProjectConfigurationSidebar() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const links = [
    { label: "General", path: `/projects/${id}/configuration` },
    { label: "Item Types", path: `/projects/${id}/configuration/item-types` },
    // aggiungi qui altri link specifici
  ];

  return (
    <div className="w-64 min-h-screen bg-green-100 p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-green-800">Project configuration</h2>
      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`text-left px-4 py-2 rounded-md font-medium transition-all ${
                isActive
                  ? "bg-green-600 text-white shadow"
                  : "text-green-800 hover:bg-green-200"
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
