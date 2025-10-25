import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";

import layout from "../styles/common/Layout.module.css";
import buttons from "../styles/common/Buttons.module.css";
import form from "../styles/common/Forms.module.css";
import utilities from "../styles/common/Utilities.module.css";

export interface FilterValues {
  permission: string; // "All" o nome specifico
  itemTypes: string[]; // ["All"] o array di ID
  status: string; // "All", "None", o ID specifico
  field: string; // "All", "None", o ID specifico
  workflow: string; // "All", "None", o ID specifico
  grant: string; // "All", "Y", "N" - indica se ci sono ruoli custom assegnati
}

interface PermissionFiltersProps {
  permissions: any[];
  onFilterChange: (filters: FilterValues) => void;
  totalCount: number;
  filteredCount: number;
}

// Helper for keyboard accessibility
const handleKeyDown = (callback: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    callback();
  }
};

export default function PermissionFilters({
  permissions,
  onFilterChange,
  totalCount,
  filteredCount,
}: PermissionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isItemTypeDropdownOpen, setIsItemTypeDropdownOpen] = useState(false);
  const itemTypeDropdownRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterValues>({
    permission: "All",
    itemTypes: ["All"],
    status: "All",
    field: "All",
    workflow: "All",
    grant: "All",
  });

  // Opzioni disponibili
  const [availableOptions, setAvailableOptions] = useState({
    permissions: [] as string[],
    itemTypes: [] as { id: string; name: string }[],
    statuses: [] as { id: string; name: string }[],
    fields: [] as { id: string; name: string }[],
    workflows: [] as { id: string; name: string }[],
  });

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (itemTypeDropdownRef.current && !itemTypeDropdownRef.current.contains(event.target as Node)) {
        setIsItemTypeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Estrai opzioni disponibili dalle permissions
  useEffect(() => {
    const permissionTypes = new Set<string>();
    const itemTypesMap = new Map<string, string>();
    const statusesMap = new Map<string, string>();
    const fieldsMap = new Map<string, string>();
    const workflowsMap = new Map<string, string>();

    permissions.forEach((perm: any) => {
      // Usa il nome esatto dal backend
      permissionTypes.add(perm.name);

      if (perm.itemType) {
        itemTypesMap.set(perm.itemType.id.toString(), perm.itemType.name);
      }
      if (perm.workflowStatus) {
        statusesMap.set(perm.workflowStatus.id.toString(), perm.workflowStatus.name);
      }
      if (perm.fieldConfiguration) {
        fieldsMap.set(perm.fieldConfiguration.id.toString(), perm.fieldConfiguration.name);
      }
      if (perm.workflow) {
        workflowsMap.set(perm.workflow.id.toString(), perm.workflow.name);
      }
    });

    // Ordine predefinito per le permissions
    const permOrder = ["Workers", "Creators", "Status Owners", "Executors", "Field Owners", "Editors", "Viewers"];
    const sortedPerms = Array.from(permissionTypes).sort((a, b) => {
      const indexA = permOrder.indexOf(a);
      const indexB = permOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    setAvailableOptions({
      permissions: ["All", ...sortedPerms],
      itemTypes: [
        { id: "All", name: "All" },
        ...Array.from(itemTypesMap.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      ],
      statuses: [
        { id: "All", name: "All" },
        { id: "None", name: "None" },
        ...Array.from(statusesMap.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      ],
      fields: [
        { id: "All", name: "All" },
        { id: "None", name: "None" },
        ...Array.from(fieldsMap.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      ],
      workflows: [
        { id: "All", name: "All" },
        { id: "None", name: "None" },
        ...Array.from(workflowsMap.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      ],
    });
  }, [permissions]);

  // Calcola opzioni dinamiche basate sui filtri correnti
  const getDynamicOptions = () => {
    // Filtra permissions basandosi sui filtri già applicati
    let filteredPerms = permissions;

    // Filtra per permission type
    if (filters.permission !== "All") {
      filteredPerms = filteredPerms.filter((p: any) => p.name === filters.permission);
    }

    // Filtra per itemTypes (multi-select)
    if (!filters.itemTypes.includes("All")) {
      filteredPerms = filteredPerms.filter((p: any) =>
        p.itemType && filters.itemTypes.includes(p.itemType.id.toString())
      );
    }

    // Determina quali filtri sono applicabili
    const hasStatus = filteredPerms.some((p: any) => p.workflowStatus);
    const hasField = filteredPerms.some((p: any) => p.fieldConfiguration);
    const hasWorkflow = filteredPerms.some((p: any) => p.workflow);

    // Estrai valori validi dalle permissions filtrate
    const validStatuses = new Map<string, string>();
    const validFields = new Map<string, string>();
    const validWorkflows = new Map<string, string>();

    filteredPerms.forEach((p: any) => {
      if (p.workflowStatus) {
        validStatuses.set(p.workflowStatus.id.toString(), p.workflowStatus.name);
      }
      if (p.fieldConfiguration) {
        validFields.set(p.fieldConfiguration.id.toString(), p.fieldConfiguration.name);
      }
      if (p.workflow) {
        validWorkflows.set(p.workflow.id.toString(), p.workflow.name);
      }
    });

    return {
      statuses: hasStatus
        ? [
            { id: "All", name: "All" },
            ...Array.from(validStatuses.entries())
              .map(([id, name]) => ({ id, name }))
              .sort((a, b) => a.name.localeCompare(b.name)),
          ]
        : [{ id: "All", name: "All" }, { id: "None", name: "None" }],
      fields: hasField
        ? [
            { id: "All", name: "All" },
            ...Array.from(validFields.entries())
              .map(([id, name]) => ({ id, name }))
              .sort((a, b) => a.name.localeCompare(b.name)),
          ]
        : [{ id: "All", name: "All" }, { id: "None", name: "None" }],
      workflows: hasWorkflow
        ? [
            { id: "All", name: "All" },
            ...Array.from(validWorkflows.entries())
              .map(([id, name]) => ({ id, name }))
              .sort((a, b) => a.name.localeCompare(b.name)),
          ]
        : [{ id: "All", name: "All" }, { id: "None", name: "None" }],
    };
  };

  const dynamicOptions = getDynamicOptions();

  // Auto-fix: Se il valore corrente non è nelle opzioni disponibili, resettalo
  useEffect(() => {
    let needsUpdate = false;
    const newFilters = { ...filters };

    // Controlla status
    if (!dynamicOptions.statuses.some((s: { id: string }) => s.id === filters.status)) {
      newFilters.status = "All";
      needsUpdate = true;
    }

    // Controlla field
    if (!dynamicOptions.fields.some((f: { id: string }) => f.id === filters.field)) {
      newFilters.field = "All";
      needsUpdate = true;
    }

    // Controlla workflow
    if (!dynamicOptions.workflows.some((w: { id: string }) => w.id === filters.workflow)) {
      newFilters.workflow = "All";
      needsUpdate = true;
    }

    if (needsUpdate) {
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicOptions.statuses.length, dynamicOptions.fields.length, dynamicOptions.workflows.length, filters.permission, filters.itemTypes.length]);

  // Aggiorna filtri e notifica il parent
  const updateFilter = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value };

    // Auto-adjust incompatible filters SOLO se non sono già su "All" o "None"
    if (key === "permission" || key === "itemTypes") {
      // Ricalcola opzioni dinamiche
      let testPerms = permissions;
      if (newFilters.permission !== "All") {
        testPerms = testPerms.filter((p: any) => p.name === newFilters.permission);
      }
      if (!newFilters.itemTypes.includes("All")) {
        testPerms = testPerms.filter((p: any) =>
          p.itemType && newFilters.itemTypes.includes(p.itemType.id.toString())
        );
      }

      // Se status non è più valido, resettalo su "All" (non "None")
      if (!testPerms.some((p: any) => p.workflowStatus) && newFilters.status !== "All" && newFilters.status !== "None") {
        newFilters.status = "All";
      }
      // Se field non è più valido, resettalo su "All"
      if (!testPerms.some((p: any) => p.fieldConfiguration) && newFilters.field !== "All" && newFilters.field !== "None") {
        newFilters.field = "All";
      }
      // Se workflow non è più valido, resettalo su "All"
      if (!testPerms.some((p: any) => p.workflow) && newFilters.workflow !== "All" && newFilters.workflow !== "None") {
        newFilters.workflow = "All";
      }
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterValues = {
      permission: "All",
      itemTypes: ["All"],
      status: "All",
      field: "All",
      workflow: "All",
      grant: "All",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const handleItemTypeToggle = (itemId: string) => {
    if (itemId === "All") {
      updateFilter("itemTypes", ["All"]);
    } else {
      const currentItems = filters.itemTypes.filter(id => id !== "All");
      
      if (currentItems.includes(itemId)) {
        // Deseleziona
        const newItems = currentItems.filter(id => id !== itemId);
        updateFilter("itemTypes", newItems.length === 0 ? ["All"] : newItems);
      } else {
        // Seleziona
        updateFilter("itemTypes", [...currentItems, itemId]);
      }
    }
  };

  const getItemTypeDisplayText = () => {
    if (filters.itemTypes.includes("All")) {
      return "All";
    }
    const selectedNames = availableOptions.itemTypes
      .filter(item => filters.itemTypes.includes(item.id) && item.id !== "All")
      .map(item => item.name);
    return selectedNames.length > 0 ? selectedNames.join(", ") : "All";
  };

  return (
    <div className={`${layout.block} ${utilities.mb4}`}>
      <div
        className={`${layout.blockHeader} cursor-pointer`}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={handleKeyDown(() => setIsExpanded(!isExpanded))}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        style={{ cursor: "pointer", padding: "8px 16px", minHeight: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <h3 className={layout.blockTitleBlue} style={{ margin: 0, fontSize: "1rem" }}>Filters</h3>
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              Showing {filteredCount} of {totalCount} permissions
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className={buttons.button}
            style={{ padding: "4px 8px", fontSize: "0.875rem" }}
          >
            <X size={12} />
            Reset All Filters
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={utilities.p4} style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Permission Filter */}
          <div style={{ flex: "0 0 auto", width: "150px" }}>
            <label htmlFor="filter-permission" className={form.label} style={{ fontSize: "0.875rem" }}>Permission</label>
            <select
              id="filter-permission"
              value={filters.permission}
              onChange={(e) => updateFilter("permission", e.target.value)}
              className={form.select}
            >
              {availableOptions.permissions.map((perm) => (
                <option key={perm} value={perm}>
                  {perm}
                </option>
              ))}
            </select>
          </div>

          {/* ItemType Filter (Custom Multi-select) */}
          <div style={{ flex: "0 0 auto", width: "150px", position: "relative", marginRight: "36px" }} ref={itemTypeDropdownRef}>
            <span className={form.label} style={{ fontSize: "0.875rem", marginBottom: "0.5rem", display: "block" }}>ItemType</span>
            <div
              onClick={() => setIsItemTypeDropdownOpen(!isItemTypeDropdownOpen)}
              onKeyDown={handleKeyDown(() => setIsItemTypeDropdownOpen(!isItemTypeDropdownOpen))}
              role="button"
              tabIndex={0}
              aria-label="ItemType filter selector"
              aria-haspopup="listbox"
              aria-expanded={isItemTypeDropdownOpen}
              style={{ 
                cursor: "pointer",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                padding: "0.375rem 0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                lineHeight: "1.25rem",
                backgroundColor: "white",
                boxSizing: "border-box"
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {getItemTypeDisplayText()}
              </span>
              <ChevronDown size={14} style={{ flexShrink: 0 }} />
            </div>
            
            {isItemTypeDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  marginTop: "2px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1000,
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                }}
              >
                {availableOptions.itemTypes.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemTypeToggle(item.id)}
                    onKeyDown={handleKeyDown(() => handleItemTypeToggle(item.id))}
                    role="option"
                    tabIndex={0}
                    aria-selected={filters.itemTypes.includes(item.id)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: filters.itemTypes.includes(item.id) ? "#eff6ff" : "white"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = filters.itemTypes.includes(item.id) ? "#eff6ff" : "white"}
                  >
                    <input
                      type="checkbox"
                      checked={filters.itemTypes.includes(item.id)}
                      onChange={() => {}}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "0.875rem" }}>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div style={{ flex: "0 0 auto", width: "150px" }}>
            <label htmlFor="filter-status" className={form.label} style={{ fontSize: "0.875rem" }}>Status</label>
            <select
              id="filter-status"
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
              className={form.select}
            >
              {dynamicOptions.statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          {/* Field Filter */}
          <div style={{ flex: "0 0 auto", width: "150px" }}>
            <label htmlFor="filter-field" className={form.label} style={{ fontSize: "0.875rem" }}>Field</label>
            <select
              id="filter-field"
              value={filters.field}
              onChange={(e) => updateFilter("field", e.target.value)}
              className={form.select}
            >
              {dynamicOptions.fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>

          {/* Workflow Filter */}
          <div style={{ flex: "0 0 auto", width: "150px" }}>
            <label htmlFor="filter-workflow" className={form.label} style={{ fontSize: "0.875rem" }}>Workflow</label>
            <select
              id="filter-workflow"
              value={filters.workflow}
              onChange={(e) => updateFilter("workflow", e.target.value)}
              className={form.select}
            >
              {dynamicOptions.workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grant Filter */}
          <div style={{ flex: "1 1 150px", minWidth: "150px" }}>
            <label htmlFor="filter-grant" className={form.label} style={{ fontSize: "0.875rem" }}>Ruoli</label>
            <select
              id="filter-grant"
              value={filters.grant}
              onChange={(e) => updateFilter("grant", e.target.value)}
              className={form.select}
            >
              <option value="All">All</option>
              <option value="Y">Y (con ruoli)</option>
              <option value="N">N (senza ruoli)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

