import { ReactNode } from "react";
import layout from "../../../styles/common/Layout.module.css";

interface TabDefinition {
  id: string;
  label: ReactNode;
  icon?: (props: { size?: number; color?: string }) => ReactNode;
  description?: string;
}

interface TabsProps {
  tabs: TabDefinition[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  buttonClassName?: string;
  activeButtonClassName?: string;
  inactiveButtonClassName?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  buttonClassName,
  activeButtonClassName,
  inactiveButtonClassName,
}: TabsProps) {
  const containerClass = [
    layout.section,
    "bg-white",
    "shadow-lg",
    "border",
    "border-gray-200",
    "p-2",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const baseButtonClass =
    buttonClassName ||
    "flex-1 py-4 px-6 rounded-md font-semibold text-sm transition-all duration-300 ease-in-out flex items-center justify-center gap-3 cursor-pointer";

  const activeClass =
    activeButtonClassName ||
    "!bg-cyan-400 !text-white shadow-lg transform scale-105 border-2 border-cyan-500";

  const inactiveClass =
    inactiveButtonClassName ||
    "!text-gray-700 hover:!text-gray-900 hover:!bg-gray-100 border-2 border-transparent";

  return (
    <nav className={containerClass}>
      <ul className="flex space-x-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const iconColor = isActive ? "white" : "#374151";
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`${baseButtonClass} ${
                  isActive ? activeClass : inactiveClass
                }`}
                title={tab.description}
                style={{
                  backgroundColor: isActive ? "#00ddd4" : "transparent",
                  color: isActive ? "white" : "#374151",
                  border: isActive
                    ? "2px solid #00b8b0"
                    : "2px solid transparent",
                  borderRadius: "6px",
                  transform: isActive ? "scale(1.05)" : "scale(1)",
                  boxShadow: isActive
                    ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                    : "none",
                }}
                onMouseEnter={(event) => {
                  if (!isActive) {
                    event.currentTarget.style.backgroundColor = "#f0f0f0";
                    event.currentTarget.style.borderColor = "transparent";
                    event.currentTarget.style.boxShadow = "none";
                  }
                }}
                onMouseLeave={(event) => {
                  if (!isActive) {
                    event.currentTarget.style.backgroundColor = "transparent";
                    event.currentTarget.style.borderColor = "transparent";
                    event.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {tab.icon ? tab.icon({ size: 20, color: iconColor }) : null}
                <span className="font-bold text-base">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}






















