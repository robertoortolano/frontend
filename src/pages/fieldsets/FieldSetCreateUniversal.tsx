import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

interface FieldSetCreateUniversalProps {
  scope: 'tenant' | 'project';
  projectId?: string;
}

interface SortablePreviewItemProps {
  configId: number;
  config: FieldConfigurationViewDto;
  index: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: () => void;
  saving: boolean;
  isLast: boolean;
}

function SortablePreviewItem({ 
  configId, 
  config, 
  index, 
  onMoveUp, 
  onMoveDown, 
  onRemove, 
  saving, 
  isLast 
}: SortablePreviewItemProps) {
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
      className={`${form.previewItem} ${isDragging ? form.dragging : ''}`}
      {...attributes}
      {...listeners}
    >
      <span className={form.previewOrder}>{index + 1}</span>
      <div className={form.previewContent}>
        <strong>{config.name || "Senza nome"}</strong>
        <span className={form.previewField}>{config.fieldName}</span>
      </div>
      <div className={form.previewActions}>
        <button
          type="button"
          className={form.moveButton}
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp(index);
          }}
          disabled={index === 0 || saving}
          title="Sposta su"
        >
          ↑
        </button>
        <button
          type="button"
          className={form.moveButton}
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown(index);
          }}
          disabled={isLast || saving}
          title="Sposta giù"
        >
          ↓
        </button>
        <button
          type="button"
          className={form.removeButton}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          disabled={saving}
          title="Rimuovi"
        >
          ✕
        </button>
      </div>
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
  const [fields, setFields] = useState<any[]>([]);
  const [fieldConfigurations, setFieldConfigurations] = useState<FieldConfigurationViewDto[]>([]);
  const [selectedField, setSelectedField] = useState<number | null>(null);
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
        // Carica i fields
        const fieldsResponse = await api.get("/fields", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFields(fieldsResponse.data);

        // Carica le field configurations
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
    // Per un field, puoi selezionare solo una configurazione
    // Ma puoi avere configurazioni da diversi fields
    const config = fieldConfigurations.find(c => c.id === configId);
    if (!config) return;
    
    // Rimuovi altre configurazioni dello stesso field
    const otherConfigs = selectedConfigurations.filter(id => {
      const otherConfig = fieldConfigurations.find(c => c.id === id);
      return otherConfig && otherConfig.fieldId !== config.fieldId;
    });
    
    setSelectedConfigurations([...otherConfigs, configId]);
  };

  const moveConfiguration = (fromIndex: number, toIndex: number) => {
    const newConfigurations = [...selectedConfigurations];
    const [movedItem] = newConfigurations.splice(fromIndex, 1);
    newConfigurations.splice(toIndex, 0, movedItem);
    setSelectedConfigurations(newConfigurations);
  };

  const moveConfigurationUp = (index: number) => {
    if (index > 0) {
      moveConfiguration(index, index - 1);
    }
  };

  const moveConfigurationDown = (index: number) => {
    if (index < selectedConfigurations.length - 1) {
      moveConfiguration(index, index + 1);
    }
  };

  const handleFieldSelect = (fieldId: number) => {
    setSelectedField(fieldId);
    // NON resettare le configurazioni - mantieni quelle precedenti
  };

  const getConfigurationsForSelectedField = () => {
    if (!selectedField) return [];
    return fieldConfigurations.filter(config => config.fieldId === selectedField);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedConfigurations.indexOf(active.id as number);
      const newIndex = selectedConfigurations.indexOf(over.id as number);
      
      setSelectedConfigurations(arrayMove(selectedConfigurations, oldIndex, newIndex));
    }
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


    if (!selectedField) {
      setError("Devi selezionare un campo");
      setSaving(false);
      return;
    }

    if (selectedConfigurations.length === 0) {
      setError("Devi selezionare una configurazione per il campo");
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

  return (
    <div className={layout.container} style={{ maxWidth: '800px', margin: '0 auto' }}>
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

        {/* Field Selection Section */}
        <div className={layout.section}>
          <h2 className={layout.sectionTitle}>
            Selezione Campo
          </h2>
          
          {fields.length === 0 ? (
            <div className={alert.infoContainer}>
              <p className={alert.info}>
                <strong>Nessun campo disponibile</strong><br />
                Crea prima dei campi per poter creare un field set.
              </p>
            </div>
          ) : (
            <>
              <p className={form.infoText}>
                Seleziona prima il campo per cui vuoi creare le configurazioni.
              </p>
              
              <div className={form.fieldGrid}>
                {fields.map((field) => (
                  <div key={field.id} className={form.fieldCard}>
                    <label className={form.fieldLabel}>
                      <input
                        type="radio"
                        name="selectedField"
                        checked={selectedField === field.id}
                        onChange={() => handleFieldSelect(field.id)}
                        disabled={saving}
                      />
                      <div className={form.fieldContent}>
                        <div className={form.fieldHeader}>
                          <strong>{field.name}</strong>
                          <span className={form.fieldStatus}>
                            {selectedField === field.id ? "✓ Selezionato" : "Non selezionato"}
                          </span>
                        </div>
                        {field.defaultField && (
                          <div className={form.fieldBadge}>
                            Campo di default
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Field Configurations Section */}
        {selectedField && (
          <div className={layout.section}>
            <h2 className={layout.sectionTitle}>
              Configurazioni per {fields.find(f => f.id === selectedField)?.name}
            </h2>
            
            {getConfigurationsForSelectedField().length === 0 ? (
              <div className={alert.infoContainer}>
                <p className={alert.info}>
                  <strong>Nessuna configurazione disponibile per questo campo</strong><br />
                  Crea prima delle configurazioni per il campo selezionato.
                </p>
              </div>
            ) : (
              <>
                <p className={form.infoText}>
                  Seleziona la configurazione da includere in questo field set.
                </p>
                
                <div className={form.radioGrid}>
                  {getConfigurationsForSelectedField().map((config) => (
                    <div key={config.id} className={form.radioCard}>
                      <label className={form.radioLabel}>
                        <input
                          type="radio"
                          name="selectedConfiguration"
                          checked={selectedConfigurations.includes(config.id)}
                          onChange={() => handleConfigurationSelect(config.id)}
                          disabled={saving}
                        />
                        <div className={form.radioContent}>
                          <div className={form.radioHeader}>
                            <strong>{config.name || "Senza nome"}</strong>
                            <span className={form.radioStatus}>
                              {selectedConfigurations.includes(config.id) ? "✓ Selezionata" : "Non selezionata"}
                            </span>
                          </div>
                          <div className={form.radioDetails}>
                            <div className={form.detailRow}>
                              <span className={form.detailLabel}>Tipo:</span>
                              <span className={form.detailValue}>{config.fieldType?.displayName || "Sconosciuto"}</span>
                            </div>
                            {config.description && (
                              <div className={form.detailRow}>
                                <span className={form.detailLabel}>Descrizione:</span>
                                <span className={form.detailValue}>{config.description}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Selected Configurations Preview */}
        {selectedConfigurations.length > 0 && (
          <div className={layout.section}>
            <h2 className={layout.sectionTitle}>
              Anteprima Field Set
            </h2>
            <div className={form.previewContainer}>
              <div className={form.previewHeader}>
                <strong>{name || "Nome Field Set"}</strong>
                {description && <p className={form.previewDescription}>{description}</p>}
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedConfigurations}
                  strategy={verticalListSortingStrategy}
                >
                  <div className={form.previewList}>
                    {selectedConfigurations.map((configId, index) => {
                      const config = fieldConfigurations.find(c => c.id === configId);
                      return config ? (
                        <SortablePreviewItem
                          key={configId}
                          configId={configId}
                          config={config}
                          index={index}
                          onMoveUp={moveConfigurationUp}
                          onMoveDown={moveConfigurationDown}
                          onRemove={() => setSelectedConfigurations([])}
                          saving={saving}
                          isLast={index === selectedConfigurations.length - 1}
                        />
                      ) : null;
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={layout.buttonRow}>
          <button
            type="submit"
            className={`${buttons.button} ${buttons.buttonPrimary} ${buttons.buttonLarge}`}
            disabled={saving || !name.trim() || !selectedField || selectedConfigurations.length === 0}
          >
            {saving ? "Salvataggio..." : "Crea Field Set"}
          </button>
          <button
            type="button"
            className={`${buttons.button} ${buttons.buttonSecondary}`}
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

