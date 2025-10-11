import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import { FieldConfigurationViewDto, FieldSetCreateDto } from "../../types/field.types";

import layout from "../../styles/common/Layout.module.css";
import form from "../../styles/common/Forms.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";

export default function FieldSetCreate() {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;
  const roles = auth?.roles || [];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedConfigs, setSelectedConfigs] = useState<FieldConfigurationViewDto[]>([]);
  const [availableConfigs, setAvailableConfigs] = useState<FieldConfigurationViewDto[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasRole = (name: string, scope: string | null = null) => {
    return roles && Array.isArray(roles) && roles.some((r: any) => r.name === name && (scope === null || r.scope === scope));
  };
  const isTenantAdmin = hasRole("ADMIN", "TENANT");

  useEffect(() => {
    if (!token) return;
    api
      .get("/fieldconfigurations", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAvailableConfigs(res.data))
      .catch((err) => console.error("Errore nel caricamento delle configurazioni:", err));
  }, [token]);

  const handleAddSelectedConfig = () => {
    if (!selectedConfigId) return;
    const selected = availableConfigs.find((c) => c.id === parseInt(selectedConfigId));
    if (!selected) return;
    setSelectedConfigs([...selectedConfigs, selected]);
    setSelectedConfigId("");
  };

  const handleRemoveConfig = (id: number) => {
    setSelectedConfigs((prev) => prev.filter((c) => c.id !== id));
  };

  const moveConfig = (index: number, direction: number) => {
    const newList = [...selectedConfigs];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newList.length) return;

    const temp = newList[targetIndex];
    newList[targetIndex] = newList[index];
    newList[index] = temp;

    setSelectedConfigs(newList);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Il nome è obbligatorio.");
      return;
    }
    if (selectedConfigs.length === 0) {
      setError("Devi selezionare almeno una configurazione.");
      return;
    }

    const payload: FieldSetCreateDto = {
      name,
      description,
      entries: selectedConfigs.map((c, index) => ({
        fieldConfigurationId: c.id,
        orderIndex: index,
      })),
    };

    try {
      await api.post("/field-sets", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/tenant/field-sets");
    } catch (e: any) {
      console.error("Errore nel salvataggio:", e);
      setError(e.message || "Errore durante la creazione");
    }
  };

  if (!isAuthenticated || !isTenantAdmin) {
    return <p className={alert.error}>Accesso negato</p>;
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Crea Field Set</h1>

      {error && <p className={alert.error}>{error}</p>}

      <div className={form.formGroup}>
        <label htmlFor="name" className={form.label}>
          Nome
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
        />
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
        />
      </div>

      <div className={form.formGroup}>
        <h2 className={layout.subtitle}>Configurazioni Selezionate</h2>
        {selectedConfigs.length === 0 ? (
          <p className={form.infoText}>Nessuna configurazione aggiunta.</p>
        ) : (
          selectedConfigs.map((config, index) => (
            <div key={config.id} className={form.subGroup}>
              <p>
                <strong>Name:</strong> {config.name || "-"}
              </p>
              <p>
                <strong>Campo:</strong> {config.fieldName}
              </p>
              <p>
                <strong>Tipo:</strong> {config.fieldType?.displayName || ""}
              </p>
              <div className={form.inlineGroup}>
                <button
                  type="button"
                  className={`${buttons.buttonSmall} ${buttons.button}`}
                  onClick={() => moveConfig(index, -1)}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={`${buttons.buttonSmall} ${buttons.button}`}
                  onClick={() => moveConfig(index, 1)}
                  disabled={index === selectedConfigs.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={`${buttons.buttonSmall} ${buttons.button}`}
                  onClick={() => handleRemoveConfig(config.id)}
                >
                  Rimuovi
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={form.formGroup}>
        <h2 className={layout.subtitle}>Aggiungi Configurazione</h2>
        <div className={form.inlineGroup}>
          <select
            className={form.select}
            value={selectedConfigId}
            onChange={(e) => {
              setError(null);
              setSelectedConfigId(e.target.value);
            }}
          >
            <option value="">-- Seleziona una configurazione --</option>
            {availableConfigs
              .filter((c) => !selectedConfigs.some((sc) => sc.id === c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || "-"} - {c.fieldName} ({c.fieldType?.displayName || ""})
                </option>
              ))}
          </select>
          <button
            type="button"
            className={buttons.buttonSmall}
            onClick={handleAddSelectedConfig}
            disabled={!selectedConfigId}
          >
            Aggiungi
          </button>
        </div>
      </div>

      <div className={layout.buttonRow}>
        <button className={buttons.button} onClick={handleSave}>
          Crea
        </button>
        <button
          className={`${buttons.button} ${buttons.buttonSecondary}`}
          onClick={() => navigate("/tenant/field-sets")}
        >
          Annulla
        </button>
      </div>
    </div>
  );
}

