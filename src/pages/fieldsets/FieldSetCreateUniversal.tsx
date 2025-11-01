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
  FieldSetCreateDto,
} from "../../types/field.types";

import layout from "../../styles/common/Layout.module.css";
import form from "../../styles/common/Forms.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import sidebarStyles from "../../styles/common/FieldSetSidebar.module.css";

interface FieldSetCreateUniversalProps {
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

export default function FieldSetCreateUniversal({ scope, projectId }: FieldSetCreateUniversalProps) {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [fieldConfigurations, setFieldConfigurations] = useState<FieldConfigurationViewDto[]>([]);
  const [selectedConfigurations, setSelectedConfigurations] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const fieldsResponse = await api.get("/fields", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFields(fieldsResponse.data);

        let endpoint = "/fieldconfigurations";
        if (scope === 'project' && projectId) {
          endpoint = `/fieldconfigurations/project/${projectId}`;
        }

        const configsResponse = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFieldConfigurations(configsResponse.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Errore nel caricamento dei dati");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, scope, projectId]);

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

  const removeConfiguration = (configId: number) => {
    setSelectedConfigurations(prev => prev.filter(id => id !== configId));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!name.trim()) {
      setError("Il nome del field set è obbligatorio");
      setSaving(false);
      return;
    }

    if (selectedConfigurations.length === 0) {
      setError("Devi selezionare almeno una configurazione");
      setSaving(false);
      return;
    }

    try {
      const dto: FieldSetCreateDto = {
        name: name.trim(),
        description: description.trim() || null,
        entries: selectedConfigurations.map((configId, index) => ({
          fieldConfigurationId: configId,
          orderIndex: index,
        })),
      };

      let endpoint = "/field-sets";
      if (scope === 'project' && projectId) {
        endpoint = `/field-sets/project/${projectId}`;
      }

      await api.post(endpoint, dto, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Navigate back to the appropriate list
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

  const getTitle = () => {
    return scope === 'tenant' 
      ? "Nuovo Field Set" 
      : "Nuovo Field Set del Progetto";
  };

  const getDescription = () => {
    return scope === 'tenant'
      ? "Crea un nuovo field set a livello tenant."
      : "Crea un nuovo field set specifico per questo progetto.";
  };

  if (!isAuthenticated) {
    return <p className="list-loading">Non sei autenticato.</p>;
  }

  if (loading) {
    return <p className="list-loading">Caricamento configurazioni...</p>;
  }

  // Organizza le configurazioni per field
  const configurationsByField = fields.map(field => ({
    field,
    configurations: fieldConfigurations.filter(config => config.fieldId === field.id)
  }));

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
              value={name}
              onChange={(e) => {
                setError(null);
                setName(e.target.value);
              }}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                  Crea prima dei campi per poter creare un field set.
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
            disabled={saving || !name.trim() || selectedConfigurations.length === 0}
          >
            {saving ? "Salvataggio..." : "Crea Field Set"}
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
    </div>
  );
}