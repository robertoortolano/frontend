import { useEffect, useState, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import {
  FieldTypesMap,
  FieldOptionDto,
  FieldConfigurationUpdateDto,
} from "../../types/field.types";

import layout from "../../styles/common/Layout.module.css";
import form from "../../styles/common/Forms.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";

export default function FieldConfigurationEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;

  const [name, setName] = useState("");
  const [fieldTypes, setFieldTypes] = useState<FieldTypesMap>({});
  const [fieldTypeKey, setFieldTypeKey] = useState("");
  const [options, setOptions] = useState<FieldOptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldId, setFieldId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [alias, setAlias] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [configRes, typesRes] = await Promise.all([
          api.get(`/fieldconfigurations/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(`/fieldtypes`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const config = configRes.data;
        const types = typesRes.data;

        setFieldId(config.fieldId);
        setDescription(config.description || "");
        setName(config.name || "");
        setAlias(config.alias || "");

        setOptions(
          (config.options || [])
            .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .map((opt: any) => ({
              id: uuidv4(),
              label: opt.label,
              value: opt.value,
              enabled: opt.enabled !== false,
            }))
        );

        const matchingKey = Object.entries(types).find(
          ([_key, val]) => JSON.stringify(val) === JSON.stringify(config.fieldType)
        )?.[0];

        setFieldTypeKey(matchingKey || "");
        setFieldTypes(typesRes.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Errore nel caricamento della configurazione o dei tipi campo"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token]);

  if (!isAuthenticated) {
    return <p className="list-loading">Non sei autenticato.</p>;
  }

  const canEditOptions = fieldTypes[fieldTypeKey]?.supportsOptions === true;

  const handleOptionChange = (optId: string, field: keyof FieldOptionDto, newValue: string | boolean) => {
    setOptions((opts) =>
      opts.map((opt) => (opt.id === optId ? { ...opt, [field]: newValue } : opt))
    );
  };

  const addOption = () => {
    setOptions((opts) => [...opts, { id: uuidv4(), label: "", value: "", enabled: true }]);
  };

  const removeOption = (optId: string) => {
    setOptions((opts) => opts.filter((opt) => opt.id !== optId));
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

    if (!fieldTypes[fieldTypeKey]) {
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
        name,
        alias,
        description,
        fieldId,
        fieldType: fieldTypeKey,
        options: canEditOptions
          ? options.map((opt, index) => ({
              label: opt.label,
              value: opt.value,
              enabled: opt.enabled ?? true,
              orderIndex: index,
            }))
          : [],
      };

      await api.put(`/fieldconfigurations/${id}`, dto, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate(-1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore nel salvataggio della configurazione");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="list-loading">Caricamento configurazione...</p>;
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Modifica Configurazione Campo</h1>

      {error && <p className={alert.error}>{error}</p>}

      <form onSubmit={handleSubmit} className={form.form}>
        <div className={form.formGroup}>
          <label htmlFor="name">Nome configurazione</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Es. Configurazione principale, Custom #1..."
          />
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
            placeholder="Alias tecnico (opzionale)"
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
            {options.map(({ id: optId, label, value, enabled }, idx) => (
              <div className={form.inlineInputGroup} key={optId}>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => handleOptionChange(optId!, "label", e.target.value)}
                    placeholder={`Etichetta opzione ${idx + 1}`}
                    required
                    disabled={!enabled}
                    style={{
                      backgroundColor: enabled ? "white" : "#f0f0f0",
                      color: enabled ? "black" : "#888",
                    }}
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleOptionChange(optId!, "value", e.target.value)}
                    placeholder={`Valore opzione ${idx + 1}`}
                    required
                    disabled={!enabled}
                    style={{
                      backgroundColor: enabled ? "white" : "#f0f0f0",
                      color: enabled ? "black" : "#888",
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <label
                      htmlFor={`enabled-${optId}`}
                      style={{ fontSize: "0.9rem", marginRight: "0.25rem" }}
                    >
                      Abilitato
                    </label>
                    <input
                      id={`enabled-${optId}`}
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handleOptionChange(optId!, "enabled", e.target.checked)}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button
                      type="button"
                      onClick={() => moveOptionUp(idx)}
                      disabled={idx === 0}
                      className={buttons.smallButton}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveOptionDown(idx)}
                      disabled={idx === options.length - 1}
                      className={buttons.smallButton}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeOption(optId!)}
                      className={buttons.smallButton}
                    >
                      &times;
                    </button>
                  </div>
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
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className={`${buttons.button} ${buttons.secondaryButton}`}
            onClick={() => navigate(-1)}
            disabled={saving}
            style={{ marginLeft: "0.5rem" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

