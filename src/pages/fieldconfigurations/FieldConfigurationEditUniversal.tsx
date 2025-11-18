import { useState, useEffect, FormEvent } from "react";
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
import { 
  FieldConfigurationViewDto, 
  FieldViewDto, 
  FieldTypesMap, 
  FieldOptionDto,
  FieldConfigurationUpdateDto,
} from "../../types/field.types";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import layout from "../../styles/common/Layout.module.css";
import alert from "../../styles/common/Alerts.module.css";
import { useAuth } from "../../context/AuthContext";

interface FieldConfigurationEditUniversalProps {
  scope: 'tenant' | 'project';
  projectId?: string;
}

interface SortableOptionItemProps {
  option: FieldOptionDto;
  index: number;
  onLabelChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  saving: boolean;
  isLast: boolean;
}

function SortableOptionItem({
  option,
  index,
  onLabelChange,
  onValueChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  saving,
  isLast,
}: SortableOptionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id || uuidv4() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`${form.inlineInputGroup} ${isDragging ? form.dragging : ''}`}
    >
      <span 
        className={form.dragHandle} 
        title="Trascina per riordinare"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </span>
      <input
        type="text"
        value={option.label}
        onChange={(e) => onLabelChange(e.target.value)}
        placeholder={`Etichetta opzione ${index + 1}`}
        required
        disabled={saving}
        className={form.input}
      />
      <input
        type="text"
        value={option.value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={`Valore opzione ${index + 1}`}
        required
        disabled={saving}
        className={form.input}
      />
      <div style={{ display: "flex", gap: "0.25rem" }}>
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0 || saving}
          className={buttons.button}
          title="Sposta su"
          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast || saving}
          className={buttons.button}
          title="Sposta giù"
          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={saving}
          className={buttons.button}
          title="Rimuovi"
          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
        >
          &times;
        </button>
      </div>
    </div>
  );
}

export default function FieldConfigurationEditUniversal({ 
  scope, 
  projectId 
}: FieldConfigurationEditUniversalProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;

  const [fieldConfiguration, setFieldConfiguration] = useState<FieldConfigurationViewDto | null>(null);
  const [fields, setFields] = useState<FieldViewDto[]>([]);
  const [fieldTypes, setFieldTypes] = useState<FieldTypesMap>({});
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [fieldTypeKey, setFieldTypeKey] = useState("");
  const [options, setOptions] = useState<FieldOptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !token) return;

      try {
        const [fieldConfigRes, fieldsRes, typesRes] = await Promise.all([
          api.get(scope === 'tenant' 
            ? `/fieldconfigurations/${id}`
            : `/fieldconfigurations/project/${projectId}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/fields", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/fieldtypes", { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const config = fieldConfigRes.data;
        setFieldConfiguration(config);
        setFields(fieldsRes.data);
        setFieldTypes(typesRes.data);
        
        // Set initial values
        setSelectedFieldId(config.fieldId?.toString() || "");
        
        // Find the field type key by comparing the descriptor with available types
        const fieldTypeKey = Object.entries(typesRes.data).find(([_key, descriptor]: [string, any]) => 
          descriptor.displayName === config.fieldType?.displayName
        )?.[0] || "";
        setFieldTypeKey(fieldTypeKey);
        
        // Convert FieldOptionViewDto to FieldOptionDto
        // Keep numeric IDs for existing options, use UUID for new ones
        // Le opzioni sono già ordinate dal backend per orderIndex
        const convertedOptions = (config.options || []).map((opt: any) => ({
          id: opt.id?.toString() || uuidv4(),
          label: opt.label,
          value: opt.value,
          enabled: opt.enabled,
          orderIndex: opt.orderIndex
        }));
        setOptions(convertedOptions);
      } catch (e: any) {
        setError(e.response?.data?.message || "Errore nel caricamento della configurazione");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token, scope, projectId]);

  const canEditOptions = fieldTypes[fieldTypeKey]?.supportsOptions === true;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex(opt => opt.id === active.id);
      const newIndex = options.findIndex(opt => opt.id === over.id);
      
      setOptions(arrayMove(options, oldIndex, newIndex));
    }
  };

  const handleOptionChange = (idx: number, field: keyof FieldOptionDto, value: string) => {
    setOptions((opts) =>
      opts.map((opt, i) => (i === idx ? { ...opt, [field]: value } : opt))
    );
  };

  const addOption = () => {
    setOptions((opts) => [...opts, { id: uuidv4(), label: "", value: "" }]);
  };

  const removeOption = (idx: number) => {
    setOptions((opts) => opts.filter((_, i) => i !== idx));
  };

  const moveOptionUp = (idx: number) => {
    if (idx === 0) return;
    setOptions((opts) => {
      const newOpts = [...opts];
      [newOpts[idx - 1], newOpts[idx]] = [newOpts[idx], newOpts[idx - 1]];
      return newOpts;
    });
  };

  const moveOptionDown = (idx: number) => {
    if (idx === options.length - 1) return;
    setOptions((opts) => {
      const newOpts = [...opts];
      [newOpts[idx], newOpts[idx + 1]] = [newOpts[idx + 1], newOpts[idx]];
      return newOpts;
    });
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fieldConfiguration || !token) return;

    setSaving(true);
    setError(null);

    // Validations
    if (!fieldConfiguration.name?.trim()) {
      setError("Il nome della configurazione è obbligatorio");
      setSaving(false);
      return;
    }

    if (!fieldTypeKey) {
      setError("Seleziona un tipo di campo");
      setSaving(false);
      return;
    }

    if (canEditOptions) {
      if (options.length === 0) {
        setError("Devi inserire almeno un'opzione");
        setSaving(false);
        return;
      }
      if (options.some((opt) => !opt.label.trim() || !opt.value.trim())) {
        setError("Le opzioni non possono avere etichetta o valore vuoto");
        setSaving(false);
        return;
      }
    }

    try {
      const dto: FieldConfigurationUpdateDto = {
        name: fieldConfiguration.name.trim(),
        alias: fieldConfiguration.alias?.trim() || undefined,
        // Usa sempre il fieldId originale dalla configurazione, non può essere modificato
        fieldId: fieldConfiguration.fieldId || null,
        fieldType: fieldTypeKey,
        description: fieldConfiguration.description?.trim() || undefined,
        options: canEditOptions
          ? options.map((opt, index) => ({
              id: typeof opt.id === 'string' && !isNaN(Number(opt.id)) 
                ? Number(opt.id) 
                : null, // null for new options (UUID strings)
              label: opt.label,
              value: opt.value,
              enabled: opt.enabled ?? true,
              orderIndex: index
            }))
          : [],
      };

      const endpoint = scope === 'tenant'
        ? `/fieldconfigurations/${id}`
        : `/fieldconfigurations/project/${projectId}/${id}`;

      await api.put(endpoint, dto, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Navigate back to the appropriate list
      if (scope === 'tenant') {
        navigate("/tenant/field-configurations");
      } else if (scope === 'project' && projectId) {
        navigate(`/projects/${projectId}/field-configurations`);
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (scope === 'tenant') {
      navigate("/tenant/field-configurations");
    } else if (scope === 'project' && projectId) {
      navigate(`/projects/${projectId}/field-configurations`);
    }
  };

  const handleInputChange = (field: keyof FieldConfigurationViewDto, value: any) => {
    if (fieldConfiguration) {
      setFieldConfiguration({
        ...fieldConfiguration,
        [field]: value
      });
    }
  };

  const getTitle = () => {
    return scope === 'tenant' 
      ? "Modifica Configurazione Campo" 
      : "Modifica Field Configuration del Progetto";
  };

  const getDescription = () => {
    return scope === 'tenant'
      ? "Modifica una configurazione di campo a livello tenant."
      : "Modifica una configurazione di campo specifica per questo progetto.";
  };

  if (!isAuthenticated) {
    return <p className="list-loading">Non sei autenticato.</p>;
  }

  if (loading) {
    return <p className="list-loading">Caricamento configurazione...</p>;
  }

  if (!fieldConfiguration) {
    return <p className="list-loading">Configurazione non trovata.</p>;
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

      <form onSubmit={handleSave} className={form.form}>
        {/* Basic Information Section */}
        <div className={layout.section}>
          <h2 className={layout.sectionTitle}>Informazioni Base</h2>
          
          <div className={form.formGroup}>
            <label htmlFor="name" className={form.label}>
              Nome configurazione *
            </label>
            <input
              id="name"
              type="text"
              value={fieldConfiguration.name || ""}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Es. Title Default Config"
              required
              disabled={saving}
              className={form.input}
            />
            <p className={form.helpText}>
              Scegli un nome descrittivo per identificare facilmente questa configurazione.
            </p>
          </div>

          <div className={form.formGroup}>
            <label htmlFor="field" className={form.label}>
              Campo *
            </label>
            <select
              id="field"
              value={selectedFieldId}
              required
              disabled={true}
              className={form.select}
            >
              <option value="">-- seleziona campo --</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
            <p className={form.helpText}>
              Il campo non può essere modificato durante l'edit di una configurazione esistente.
            </p>
          </div>

          <div className={form.formGroup}>
            <label htmlFor="fieldType" className={form.label}>
              Tipo campo *
            </label>
            <select
              id="fieldType"
              value={fieldTypeKey}
              onChange={(e) => setFieldTypeKey(e.target.value)}
              required
              disabled={saving}
              className={form.select}
            >
              <option value="">-- seleziona tipo --</option>
              {Object.entries(fieldTypes).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.displayName || key}
                </option>
              ))}
            </select>
            <p className={form.helpText}>
              Seleziona il tipo di campo per questa configurazione.
            </p>
          </div>

          <div className={form.formGroup}>
            <label htmlFor="alias" className={form.label}>
              Alias
            </label>
            <input
              id="alias"
              type="text"
              value={fieldConfiguration.alias || ""}
              onChange={(e) => handleInputChange('alias', e.target.value)}
              placeholder="Alias personalizzato per il campo"
              disabled={saving}
              className={form.input}
            />
            <p className={form.helpText}>
              Un alias personalizzato per questo campo (opzionale).
            </p>
          </div>

          <div className={form.formGroup}>
            <label htmlFor="description" className={form.label}>
              Descrizione
            </label>
            <textarea
              id="description"
              rows={3}
              value={fieldConfiguration.description || ""}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrizione opzionale"
              disabled={saving}
              className={form.textarea}
            />
            <p className={form.helpText}>
              Aggiungi una descrizione per aiutare gli altri utenti a capire questa configurazione.
            </p>
          </div>
        </div>

        {/* Options Section */}
        {canEditOptions && (
          <div className={layout.section}>
            <h2 className={layout.sectionTitle}>Opzioni</h2>
            <p className={form.infoText}>
              Configura le opzioni disponibili per questo campo. Puoi riordinarle trascinandole o usando i pulsanti freccia.
            </p>
            
            <fieldset className={form.formGroup}>
              <legend className={form.label}>Opzioni del Campo</legend>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={options.map(opt => opt.id || uuidv4()).filter((id): id is string => id !== undefined)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className={form.optionsList}>
                    {options.map((opt, idx) => (
                      <SortableOptionItem
                        key={opt.id}
                        option={opt}
                        index={idx}
                        onLabelChange={(value) => handleOptionChange(idx, "label", value)}
                        onValueChange={(value) => handleOptionChange(idx, "value", value)}
                        onRemove={() => removeOption(idx)}
                        onMoveUp={() => moveOptionUp(idx)}
                        onMoveDown={() => moveOptionDown(idx)}
                        saving={saving}
                        isLast={idx === options.length - 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <button
                type="button"
                onClick={addOption}
                className={buttons.button}
                disabled={saving}
                style={{ marginTop: "0.5rem" }}
              >
                Aggiungi opzione
              </button>
            </fieldset>
          </div>
        )}

        {/* Action Buttons */}
        <div className={layout.buttonRow}>
          <button
            type="submit"
            className={buttons.button}
            disabled={saving}
          >
            {saving ? "Salvataggio..." : "Salva Modifiche"}
          </button>
          <button
            type="button"
            className={buttons.button}
            onClick={handleCancel}
            disabled={saving}
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}


