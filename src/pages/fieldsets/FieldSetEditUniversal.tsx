import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import {
  FieldConfigurationViewDto,
  FieldSetViewDto,
  FieldSetCreateDto,
} from "../../types/field.types";
import { FieldSetRemovalImpactDto } from "../../types/fieldset-impact.types";
import { FieldSetImpactReportModal } from "../../components/FieldSetImpactReportModal";

import layout from "../../styles/common/Layout.module.css";
import form from "../../styles/common/Forms.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import sidebarStyles from "../../styles/common/FieldSetSidebar.module.css";

interface FieldSetEditUniversalProps {
  scope: 'tenant' | 'project';
  projectId?: string;
}

interface Field {
  id: number;
  name: string;
  defaultField?: boolean;
}

interface SortableSidebarConfigProps {
  configId: number;
  config: FieldConfigurationViewDto;
  field: Field | undefined;
  onRemove: () => void;
}

function SortableSidebarConfig({
  configId,
  config,
  field,
  onRemove
}: SortableSidebarConfigProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: configId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${sidebarStyles.sidebarConfigCard} ${isDragging ? sidebarStyles.dragging : ''}`}
    >
      <div 
        className={sidebarStyles.sidebarConfigDragHandle}
        title="Trascina per riordinare"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </div>
      <div className={sidebarStyles.sidebarConfigFieldLabel}>
        {field?.name || 'Field sconosciuto'}
      </div>
      <div className={sidebarStyles.sidebarConfigName}>
        {config.name || "Senza nome"}
      </div>
      <div className={sidebarStyles.sidebarConfigDetails}>
        Tipo: {config.fieldType?.displayName || "Sconosciuto"}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className={sidebarStyles.sidebarConfigRemove}
        title="Rimuovi"
      >
        ✕
      </button>
    </div>
  );
}

export default function FieldSetEditUniversal({ scope, projectId }: FieldSetEditUniversalProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;

  const [fieldSet, setFieldSet] = useState<FieldSetViewDto | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [fieldConfigurations, setFieldConfigurations] = useState<FieldConfigurationViewDto[]>([]);
  const [selectedConfigurations, setSelectedConfigurations] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Impact report states
  const [showImpactReport, setShowImpactReport] = useState(false);
  const [impactReport, setImpactReport] = useState<FieldSetRemovalImpactDto | null>(null);
  const [analyzingImpact, setAnalyzingImpact] = useState(false);
  const [pendingSave, setPendingSave] = useState<(() => Promise<void>) | null>(null);
  
  // Provisional removal states (for immediate removal confirmation)
  const [showProvisionalReport, setShowProvisionalReport] = useState(false);
  const [provisionalImpactReport, setProvisionalImpactReport] = useState<FieldSetRemovalImpactDto | null>(null);
  const [pendingRemovedConfigurations, setPendingRemovedConfigurations] = useState<number[]>([]);
  const [removalToConfirm, setRemovalToConfirm] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!id || !token) return;

    const fetchData = async () => {
      try {
        const [fieldSetRes, fieldsRes, configsRes] = await Promise.all([
          api.get(`/field-sets/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/fields", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(scope === 'project' && projectId 
            ? `/fieldconfigurations/project/${projectId}`
            : "/fieldconfigurations", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        const fieldSetData = fieldSetRes.data;
        setFieldSet(fieldSetData);
        setFields(fieldsRes.data);
        setFieldConfigurations(configsRes.data);
        
        // Set selected configurations from field set
        const configIds = fieldSetData.fieldSetEntries?.map(entry => 
          entry.fieldConfiguration?.id || entry.fieldConfigurationId
        ) || [];
        
        setSelectedConfigurations(configIds);
      } catch (err: any) {
        setError(err.response?.data?.message || "Errore nel caricamento dei dati");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token, scope, projectId]);

  const handleConfigurationSelect = (configId: number) => {
    // Radio button behavior: only one configuration per field
    const selectedConfig = fieldConfigurations.find(config => config.id === configId);
    if (!selectedConfig) return;
    
    // Find the position of any existing configuration for the same field
    const existingConfigIndex = selectedConfigurations.findIndex(id => {
      const config = fieldConfigurations.find(c => c.id === id);
      return config && config.fieldId === selectedConfig.fieldId;
    });
    
    if (selectedConfigurations.includes(configId)) {
      // If already selected, remove it
      const newConfigurations = selectedConfigurations.filter(id => id !== configId);
      setSelectedConfigurations(newConfigurations);
    } else {
      // If not selected, replace the existing config for the same field (if any) at the same position, or add at the end
      let newConfigurations = [...selectedConfigurations];
      
      if (existingConfigIndex !== -1) {
        // Replace the existing configuration at the same position
        newConfigurations[existingConfigIndex] = configId;
      } else {
        // No existing configuration for this field, add at the end
        newConfigurations.push(configId);
      }
      
      setSelectedConfigurations(newConfigurations);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedConfigurations.indexOf(active.id as number);
      const newIndex = selectedConfigurations.indexOf(over.id as number);

      if (oldIndex !== -1 && newIndex !== -1) {
        setSelectedConfigurations(arrayMove(selectedConfigurations, oldIndex, newIndex));
      }
    }
  };

  const removeConfiguration = async (configId: number) => {
    // Check if this configuration was in the original FieldSet (for impact analysis)
    const originalConfigIds = fieldSet?.fieldSetEntries?.map(entry => 
      entry.fieldConfiguration?.id || entry.fieldConfigurationId
    ) || [];
    
    const wasInOriginal = originalConfigIds.includes(configId);
    
    if (wasInOriginal) {
      // This is an existing configuration being removed - analyze impact
      setRemovalToConfirm(configId);
      await analyzeProvisionalRemovalImpact([configId]);
    } else {
      // This is a newly added configuration - remove directly without impact analysis
      setSelectedConfigurations(prev => prev.filter(id => id !== configId));
    }
  };
  
  const analyzeProvisionalRemovalImpact = async (removedConfigIds: number[]) => {
    setAnalyzingImpact(true);
    setError(null);

    try {
      const originalConfigIds = fieldSet?.fieldSetEntries?.map(entry => 
        entry.fieldConfiguration?.id || entry.fieldConfigurationId
      ) || [];
      
      const addedConfigIds = selectedConfigurations.filter(id => 
        !originalConfigIds.includes(id)
      );

      const request = {
        removedFieldConfigIds: removedConfigIds,
        addedFieldConfigIds: addedConfigIds,
      };

      const response = await api.post(`/field-sets/${id}/analyze-removal-impact`, request, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const impact: FieldSetRemovalImpactDto = response.data;
      
      const hasPermissions = 
        (impact.fieldOwnerPermissions && impact.fieldOwnerPermissions.length > 0) ||
        (impact.fieldStatusPermissions && impact.fieldStatusPermissions.length > 0) ||
        (impact.itemTypeSetRoles && impact.itemTypeSetRoles.length > 0);
      
      if (hasPermissions) {
        setProvisionalImpactReport(impact);
        setShowProvisionalReport(true);
      } else {
        confirmProvisionalRemoval(removedConfigIds);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore durante l'analisi degli impatti");
      setRemovalToConfirm(null);
    } finally {
      setAnalyzingImpact(false);
    }
  };
  
  const confirmProvisionalRemoval = (configIds: number[]) => {
    setSelectedConfigurations(prev => prev.filter(id => !configIds.includes(id)));
    setPendingRemovedConfigurations(prev => [...prev, ...configIds]);
    setShowProvisionalReport(false);
    setProvisionalImpactReport(null);
    setRemovalToConfirm(null);
  };
  
  const cancelProvisionalRemoval = () => {
    setSelectedConfigurations(prev => {
      if (removalToConfirm !== null && !prev.includes(removalToConfirm)) {
        return [...prev, removalToConfirm];
      }
      return prev;
    });
    
    setShowProvisionalReport(false);
    setProvisionalImpactReport(null);
    setRemovalToConfirm(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fieldSet) return;

    setError(null);

    if (!fieldSet.name.trim()) {
      setError("Il nome del field set è obbligatorio");
      return;
    }

    if (selectedConfigurations.length === 0) {
      setError("Devi selezionare almeno una configurazione");
      return;
    }

    const originalConfigIds = fieldSet.fieldSetEntries?.map(entry => 
      entry.fieldConfiguration?.id || entry.fieldConfigurationId
    ) || [];
    
    const allRemovedConfigIds = [
      ...originalConfigIds.filter(id => !selectedConfigurations.includes(id)),
      ...pendingRemovedConfigurations
    ].filter((id, index, self) => self.indexOf(id) === index);

    if (allRemovedConfigIds.length > 0) {
      await analyzeRemovalImpact(allRemovedConfigIds);
    } else {
      await performSave();
    }
  };

  const analyzeRemovalImpact = async (removedConfigIds: number[]) => {
    setAnalyzingImpact(true);
    setError(null);

    try {
      const originalConfigIds = fieldSet?.fieldSetEntries?.map(entry => 
        entry.fieldConfiguration?.id || entry.fieldConfigurationId
      ) || [];
      
      const addedConfigIds = selectedConfigurations.filter(id => 
        !originalConfigIds.includes(id)
      );

      const request = {
        removedFieldConfigIds: removedConfigIds,
        addedFieldConfigIds: addedConfigIds,
      };

      const response = await api.post(`/field-sets/${id}/analyze-removal-impact`, request, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const impact: FieldSetRemovalImpactDto = response.data;
      
      const hasPermissions = 
        (impact.fieldOwnerPermissions && impact.fieldOwnerPermissions.length > 0) ||
        (impact.fieldStatusPermissions && impact.fieldStatusPermissions.length > 0) ||
        (impact.itemTypeSetRoles && impact.itemTypeSetRoles.length > 0);
      
      if (hasPermissions) {
        setImpactReport(impact);
        setShowImpactReport(true);
        setPendingSave(() => performSave);
      } else {
        await performSave();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore durante l'analisi degli impatti");
    } finally {
      setAnalyzingImpact(false);
    }
  };

  const performSave = async () => {
    if (!fieldSet) return;

    setSaving(true);
    setError(null);

    try {
      const dto: FieldSetCreateDto = {
        name: fieldSet.name.trim(),
        description: fieldSet.description?.trim() || null,
        entries: selectedConfigurations.map((configId, index) => ({
          fieldConfigurationId: configId,
          orderIndex: index
        })),
      };

      await api.put(`/field-sets/${id}`, dto, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setPendingRemovedConfigurations([]);
      
      if (scope === 'tenant') {
        navigate("/tenant/field-sets");
      } else if (scope === 'project' && projectId) {
        navigate(`/projects/${projectId}/field-sets`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!fieldSet || !impactReport) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const originalConfigIds = fieldSet.fieldSetEntries?.map(entry => 
        entry.fieldConfiguration?.id || entry.fieldConfigurationId
      ) || [];
      
      const removedConfigIds = originalConfigIds.filter(id => 
        !selectedConfigurations.includes(id)
      );

      const hasPermissions = 
        (impactReport.fieldOwnerPermissions && impactReport.fieldOwnerPermissions.length > 0) ||
        (impactReport.fieldStatusPermissions && impactReport.fieldStatusPermissions.length > 0) ||
        (impactReport.itemTypeSetRoles && impactReport.itemTypeSetRoles.length > 0);
      
      if (hasPermissions && removedConfigIds.length > 0) {
        const originalConfigIds = fieldSet.fieldSetEntries?.map(entry => 
          entry.fieldConfiguration?.id || entry.fieldConfigurationId
        ) || [];
        
        const addedConfigIds = selectedConfigurations.filter(id => 
          !originalConfigIds.includes(id)
        );

        const request = {
          removedFieldConfigIds: removedConfigIds,
          addedFieldConfigIds: addedConfigIds,
        };

        await api.post(`/field-sets/${id}/remove-orphaned-permissions`, request, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowImpactReport(false);
      setImpactReport(null);

      if (pendingSave) {
        await pendingSave();
        setPendingSave(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore durante la rimozione delle permission");
      console.error('Error removing orphaned permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSave = () => {
    setShowImpactReport(false);
    setImpactReport(null);
    setPendingSave(null);
  };

  const handleExportReport = async () => {
    if (!impactReport) return;

    try {
      const originalConfigIds = fieldSet?.fieldSetEntries?.map(entry => 
        entry.fieldConfiguration?.id || entry.fieldConfigurationId
      ) || [];
      
      const removedConfigIds = originalConfigIds.filter(id => 
        !selectedConfigurations.includes(id)
      );

      const response = await api.post(`/field-sets/${id}/export-removal-impact-csv`, removedConfigIds, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fieldset_removal_impact_${id}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore durante l'esportazione del report");
    }
  };

  const handleInputChange = (field: keyof FieldSetViewDto, value: any) => {
    if (fieldSet) {
      setFieldSet({
        ...fieldSet,
        [field]: value
      });
    }
  };

  if (!isAuthenticated) {
    return <p className="list-loading">Non sei autenticato.</p>;
  }

  if (loading) {
    return <p className="list-loading">Caricamento field set...</p>;
  }

  if (!fieldSet) {
    return <p className="list-loading">Field set non trovato.</p>;
  }

  const getTitle = () => {
    return scope === 'tenant'
      ? "Modifica Field Set"
      : "Modifica Field Set del Progetto";
  };

  const getDescription = () => {
    return scope === 'tenant'
      ? "Modifica un field set a livello tenant."
      : "Modifica un field set specifico per questo progetto.";
  };

  // Organizza le configurazioni per field e filtra solo i field con almeno una configurazione
  const configurationsByField = fields
    .map(field => ({
      field,
      configurations: fieldConfigurations.filter(config => config.fieldId === field.id)
    }))
    .filter(({ configurations }) => configurations.length > 0); // Mostra solo field con configurazioni

  return (
    <div className={layout.container} style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 1rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>{getTitle()}</h1>
        <p className={layout.paragraphMuted}>{getDescription()}</p>
      </div>

      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={form.form}>
        {/* Basic Information Section */}
        <div className={layout.section}>
          <h2 className={layout.sectionTitle}>Informazioni Base</h2>
          <div className={form.formGroup}>
            <label htmlFor="name" className={form.label}>
              Nome del Field Set *
            </label>
            <input
              id="name"
              className={form.input}
              type="text"
              value={fieldSet.name || ""}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Es. Configurazione Utenti, Campi Progetto, etc."
              required
              disabled={saving}
            />
            <p className={form.helpText}>
              Scegli un nome descrittivo per identificare facilmente questo field set.
            </p>
          </div>

          <div className={form.formGroup}>
            <label htmlFor="description" className={form.label}>
              Descrizione
            </label>
            <textarea
              id="description"
              className={form.textarea}
              value={fieldSet.description || ""}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrivi lo scopo e l'utilizzo di questo field set (opzionale)"
              rows={3}
              disabled={saving}
            />
            <p className={form.helpText}>
              Aggiungi una descrizione per aiutare gli altri utenti a capire quando utilizzare questo field set.
            </p>
          </div>
        </div>

        {/* Sidebar Layout */}
        <div className={sidebarStyles.fieldSetSidebarContainer}>
          {/* Sidebar: Configurazioni Selezionate */}
          <div className={sidebarStyles.selectedSidebar}>
            <div className={sidebarStyles.selectedSidebarHeader}>
              <div className={sidebarStyles.selectedSidebarTitle}>
                <span>✅</span>
                <span>Configurazioni Selezionate</span>
              </div>
              <div className={sidebarStyles.selectedSidebarCount}>
                <span className={sidebarStyles.selectedSidebarCountBadge}>
                  {selectedConfigurations.length}
                </span>
                <span>{selectedConfigurations.length === 1 ? 'configurazione' : 'configurazioni'}</span>
              </div>
            </div>

            <div className={sidebarStyles.selectedSidebarBody}>
              {selectedConfigurations.length === 0 ? (
                <div className={sidebarStyles.sidebarEmpty}>
                  <div className={sidebarStyles.sidebarEmptyIcon}>📝</div>
                  <div style={{ fontSize: '0.8125rem' }}>Nessuna configurazione selezionata</div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedConfigurations}
                    strategy={verticalListSortingStrategy}
                  >
                    {selectedConfigurations.map((configId) => {
                      const config = fieldConfigurations.find(c => c.id === configId);
                      const field = config ? fields.find(f => f.id === config.fieldId) : undefined;
                      return config ? (
                        <SortableSidebarConfig
                          key={configId}
                          configId={configId}
                          config={config}
                          field={field}
                          onRemove={() => removeConfiguration(configId)}
                        />
                      ) : null;
                    })}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* Main Content: Field con Configurazioni */}
          <div className={sidebarStyles.mainContentArea}>
            <div className={sidebarStyles.sidebarInfo}>
              <strong>💡 Come funziona:</strong>
              <div>
                Seleziona una configurazione per ogni Field. Se selezioni una nuova configurazione per un Field 
                già presente, quella precedente verrà sostituita automaticamente. 
                Puoi riordinare le configurazioni selezionate trascinandole nella sidebar.
              </div>
            </div>

            {fields.length === 0 ? (
              <div className={alert.infoContainer}>
                <p className={alert.info}>
                  <strong>Nessun campo disponibile</strong><br />
                  Crea prima dei campi per poter modificare un field set.
                </p>
              </div>
            ) : (
              configurationsByField.map(({ field, configurations }) => (
                <div key={field.id} className={sidebarStyles.sidebarFieldCard}>
                  {/* Header del Field */}
                  <div className={sidebarStyles.sidebarFieldHeader}>
                    <div className={sidebarStyles.sidebarFieldHeaderContent}>
                      <span className={sidebarStyles.sidebarFieldIcon}>📋</span>
                      <span className={sidebarStyles.sidebarFieldName}>{field.name}</span>
                      <span className={sidebarStyles.sidebarFieldBadge}>
                        {configurations.length} disponibili
                      </span>
                    </div>
                  </div>

                  {/* Configurazioni */}
                  <div className={sidebarStyles.sidebarConfigurationsArea}>
                    {configurations.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                        Nessuna configurazione disponibile
                      </div>
                    ) : (
                      <div className={sidebarStyles.sidebarConfigurationsList}>
                        {configurations.map((config) => {
                          const isSelected = selectedConfigurations.includes(config.id);
                          return (
                            <label
                              key={config.id}
                              className={`${sidebarStyles.sidebarConfigItem} ${isSelected ? sidebarStyles.selected : ''}`}
                            >
                              <div className={sidebarStyles.sidebarConfigItemContent}>
                                <div className={sidebarStyles.sidebarConfigItemName}>
                                  {config.name || "Senza nome"}
                                </div>
                                <div className={sidebarStyles.sidebarConfigItemDetails}>
                                  Tipo: {config.fieldType?.displayName || "Sconosciuto"}
                                  {config.description && ` • ${config.description}`}
                                </div>
                              </div>
                              <input
                                type="radio"
                                name={`selectedConfiguration_${field.id}`}
                                checked={isSelected}
                                onChange={() => handleConfigurationSelect(config.id)}
                                disabled={saving}
                                className={sidebarStyles.sidebarConfigItemCheckbox}
                              />
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={layout.buttonRow} style={{ marginTop: '2rem' }}>
          <button
            type="submit"
            className={buttons.button}
            disabled={saving || analyzingImpact || !fieldSet.name?.trim() || selectedConfigurations.length === 0}
          >
            {analyzingImpact ? "Analisi impatti..." : saving ? "Salvataggio..." : "Salva Modifiche"}
          </button>
          <button
            type="button"
            className={buttons.button}
            onClick={() => {
              if (scope === 'tenant') {
                navigate("/tenant/field-sets");
              } else if (scope === 'project' && projectId) {
                navigate(`/projects/${projectId}/field-sets`);
              }
            }}
            disabled={saving}
          >
            Annulla
          </button>
        </div>
      </form>

      {/* Summary Impact Report Modal (before saving) */}
      <FieldSetImpactReportModal
        isOpen={showImpactReport}
        onClose={handleCancelSave}
        onConfirm={handleConfirmSave}
        onExport={handleExportReport}
        impact={impactReport}
        loading={analyzingImpact || saving}
        isProvisional={false}
      />
      
      {/* Provisional Impact Report Modal (immediate removal confirmation) */}
      <FieldSetImpactReportModal
        isOpen={showProvisionalReport}
        onClose={cancelProvisionalRemoval}
        onConfirm={() => {
          if (removalToConfirm !== null) {
            confirmProvisionalRemoval([removalToConfirm]);
          }
        }}
        onExport={async () => {
          if (removalToConfirm !== null && provisionalImpactReport) {
            try {
              const response = await api.post(`/field-sets/${id}/export-removal-impact-csv`, [removalToConfirm], {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
              });

              const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `fieldset_provisional_removal_impact_${id}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
            } catch (err: any) {
              setError(err.response?.data?.message || "Errore durante l'esportazione del report");
            }
          }
        }}
        impact={provisionalImpactReport}
        loading={analyzingImpact}
        isProvisional={true}
      />
    </div>
  );
}
