import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import {
  FieldViewDto,
  FieldTypesMap,
  FieldOptionDto,
  FieldConfigurationCreateDto,
} from "../../types/field.types";

import layout from "../../styles/common/Layout.module.css";
import form from "../../styles/common/Forms.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";

interface FieldConfigurationCreateUniversalProps {
  scope: 'tenant' | 'project';
  projectId?: string;
}

export default function FieldConfigurationCreateUniversal({ scope, projectId }: FieldConfigurationCreateUniversalProps) {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;

  const [name, setName] = useState("");
  const [fieldTypes, setFieldTypes] = useState<FieldTypesMap>({});
  const [fieldTypeKey, setFieldTypeKey] = useState("");
  const [description, setDescription] = useState("");
  const [alias, setAlias] = useState("");
  const [options, setOptions] = useState<FieldOptionDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldViewDto[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchFieldTypes = async () => {
      try {
        const [fieldsRes, typesRes] = await Promise.all([
          api.get("/fields", { headers: { Authorization: `Bearer ${token}` } }),
          api.get(`/fieldtypes`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setFields(fieldsRes.data);
        setFieldTypes(typesRes.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Errore nel caricamento");
      } finally {
        setLoading(false);
      }
    };

    fetchFieldTypes();
  }, [token]);

  const canEditOptions = fieldTypes[fieldTypeKey]?.supportsOptions === true;

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!name.trim()) {
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
      const dto: FieldConfigurationCreateDto = {
        name,
        alias: alias || null,
        fieldId: selectedFieldId || null,
        fieldType: fieldTypeKey,
        description,
        options: canEditOptions
          ? options.map((opt, index) => ({ ...opt, orderIndex: index }))
          : [],
      };

      let endpoint = "/fieldconfigurations";
      if (scope === 'project' && projectId) {
        endpoint = `/fieldconfigurations/project/${projectId}`;
      }

      await api.post(endpoint, dto, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Navigate back to the appropriate list
      if (scope === 'tenant') {
        navigate("/tenant/field-configurations");
      } else if (scope === 'project' && projectId) {
        navigate(`/projects/${projectId}/field-configurations`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    return scope === 'tenant' 
      ? "Nuova Configurazione Campo" 
      : "Nuova Field Configuration del Progetto";
  };

  const getDescription = () => {
    return scope === 'tenant'
      ? "Crea una nuova configurazione di campo a livello tenant."
      : "Crea una nuova configurazione di campo specifica per questo progetto.";
  };

  if (!isAuthenticated) {
    return <p className="list-loading">Non sei autenticato.</p>;
  }

  if (loading) {
    return <p className="list-loading">Caricamento configurazione...</p>;
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>{getTitle()}</h1>
      <p className="text-gray-600 mb-6">{getDescription()}</p>

      {error && <p className={alert.error}>{error}</p>}

      <form onSubmit={handleSubmit} className={form.form}>
        <div className={form.formGroup}>
          <label htmlFor="name">Nome configurazione</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. Title Default Config"
            required
          />
        </div>
        <div className={form.formGroup}>
          <label htmlFor="field">Field</label>
          <select
            id="field"
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            required
          >
            <option value="">-- seleziona campo --</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>
        </div>
        <div className={form.formGroup}>
          <label htmlFor="fieldType">Tipo campo</label>
          <select
            id="fieldType"
            value={fieldTypeKey}
            onChange={(e) => setFieldTypeKey(e.target.value)}
            required
          >
            <option value="">-- seleziona tipo --</option>
            {Object.entries(fieldTypes).map(([key, val]) => (
              <option key={key} value={key}>
                {val.displayName || key}
              </option>
            ))}
          </select>
        </div>

        <div className={form.formGroup}>
          <label htmlFor="alias">Alias</label>
          <input
            id="alias"
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Alias personalizzato per il campo"
          />
        </div>

        <div className={form.formGroup}>
          <label htmlFor="description">Descrizione</label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrizione opzionale"
          />
        </div>

        {canEditOptions && (
          <fieldset className={form.formGroup}>
            <legend>Opzioni</legend>
            {options.map((opt, idx) => (
              <div key={opt.id} className={form.inlineInputGroup}>
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => handleOptionChange(idx, "label", e.target.value)}
                  placeholder={`Etichetta opzione ${idx + 1}`}
                  required
                />
                <input
                  type="text"
                  value={opt.value}
                  onChange={(e) => handleOptionChange(idx, "value", e.target.value)}
                  placeholder={`Valore opzione ${idx + 1}`}
                  required
                />
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button
                    type="button"
                    onClick={() => moveOptionUp(idx)}
                    disabled={idx === 0}
                    className={buttons.smallButton}
                    title="Sposta su"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveOptionDown(idx)}
                    disabled={idx === options.length - 1}
                    className={buttons.smallButton}
                    title="Sposta giù"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className={buttons.smallButton}
                    title="Rimuovi"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addOption}
              className={buttons.button}
              style={{ marginTop: "0.5rem" }}
            >
              Aggiungi opzione
            </button>
          </fieldset>
        )}

        <div className={form.formGroup}>
          <button type="submit" className={buttons.button} disabled={saving}>
            {saving ? "Salvando..." : "Salva"}
          </button>
          <button
            type="button"
            className={`${buttons.button} ${buttons.secondaryButton}`}
            onClick={() => {
              if (scope === 'tenant') {
                navigate("/tenant/field-configurations");
              } else if (scope === 'project' && projectId) {
                navigate(`/projects/${projectId}/field-configurations`);
              }
            }}
            disabled={saving}
            style={{ marginLeft: "0.5rem" }}
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}

