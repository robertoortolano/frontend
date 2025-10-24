import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import { FieldConfigurationViewDto } from "../../types/field.types";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import layout from "../../styles/common/Layout.module.css";
import { useAuth } from "../../context/AuthContext";

interface FieldConfigurationEditUniversalProps {
  scope: 'tenant' | 'project';
  projectId?: string;
}

export default function FieldConfigurationEditUniversal({ 
  scope, 
  projectId 
}: FieldConfigurationEditUniversalProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;

  const [fieldConfiguration, setFieldConfiguration] = useState<FieldConfigurationViewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFieldConfiguration = async () => {
      if (!id || !token) return;

      try {
        const endpoint = scope === 'tenant' 
          ? `/field-configurations/${id}`
          : `/projects/${projectId}/field-configurations/${id}`;
        
        const response = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFieldConfiguration(response.data);
      } catch (e: any) {
        setError(e.response?.data?.message || "Errore nel caricamento della configurazione");
      } finally {
        setLoading(false);
      }
    };

    fetchFieldConfiguration();
  }, [id, token, scope, projectId]);

  const handleSave = async () => {
    if (!fieldConfiguration || !token) return;

    setSaving(true);
    setError(null);

    try {
      const endpoint = scope === 'tenant'
        ? `/field-configurations/${id}`
        : `/projects/${projectId}/field-configurations/${id}`;

      await api.put(endpoint, fieldConfiguration, {
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

  if (loading) {
    return <p className="list-loading">Caricamento configurazione...</p>;
  }

  if (!fieldConfiguration) {
    return <p className="list-loading">Configurazione non trovata.</p>;
  }

  return (
    <div className={layout.container}>
      <h1>Modifica Field Configuration</h1>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className={form.formWrapper}>
        <div className={form.formGroup}>
          <label htmlFor="fieldName">Nome Campo:</label>
          <input
            id="fieldName"
            type="text"
            value={fieldConfiguration.fieldName || ""}
            onChange={(e) => handleInputChange('fieldName', e.target.value)}
            className={form.input}
            disabled={saving}
          />
        </div>

        <div className={form.formGroup}>
          <label htmlFor="fieldType">Tipo Campo:</label>
          <select
            id="fieldType"
            value={fieldConfiguration.fieldType || ""}
            onChange={(e) => handleInputChange('fieldType', e.target.value)}
            className={form.select}
            disabled={saving}
          >
            <option value="TEXT">Testo</option>
            <option value="NUMBER">Numero</option>
            <option value="DATE">Data</option>
            <option value="BOOLEAN">Booleano</option>
            <option value="SELECT">Selezione</option>
          </select>
        </div>

        <div className={form.formGroup}>
          <label htmlFor="required">Obbligatorio:</label>
          <input
            id="required"
            type="checkbox"
            checked={fieldConfiguration.required || false}
            onChange={(e) => handleInputChange('required', e.target.checked)}
            disabled={saving}
          />
        </div>

        <div className={form.formGroup}>
          <label htmlFor="defaultValue">Valore di Default:</label>
          <input
            id="defaultValue"
            type="text"
            value={fieldConfiguration.defaultValue || ""}
            onChange={(e) => handleInputChange('defaultValue', e.target.value)}
            className={form.input}
            disabled={saving}
          />
        </div>

        <div className={form.formGroup}>
          <label htmlFor="description">Descrizione:</label>
          <textarea
            id="description"
            value={fieldConfiguration.description || ""}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={form.textarea}
            rows={3}
            disabled={saving}
          />
        </div>

        <div className={form.formGroup}>
          <label htmlFor="options">Opzioni (separate da virgola):</label>
          <input
            id="options"
            type="text"
            value={fieldConfiguration.options?.join(', ') || ""}
            onChange={(e) => handleInputChange('options', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            className={form.input}
            disabled={saving}
            placeholder="opzione1, opzione2, opzione3"
          />
        </div>

        <div className={form.formGroup}>
          <label htmlFor="validationRules">Regole di Validazione:</label>
          <textarea
            id="validationRules"
            value={fieldConfiguration.validationRules || ""}
            onChange={(e) => handleInputChange('validationRules', e.target.value)}
            className={form.textarea}
            rows={2}
            disabled={saving}
          />
        </div>

        <div className={form.formGroup}>
          <label htmlFor="displayOrder">Ordine di Visualizzazione:</label>
          <input
            id="displayOrder"
            type="number"
            value={fieldConfiguration.displayOrder || 0}
            onChange={(e) => handleInputChange('displayOrder', parseInt(e.target.value) || 0)}
            className={form.input}
            disabled={saving}
          />
        </div>

        <div className={form.formGroup}>
          <label htmlFor="isActive">Attivo:</label>
          <input
            id="isActive"
            type="checkbox"
            checked={fieldConfiguration.isActive !== false}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
            disabled={saving}
          />
        </div>

        <div className={form.formGroup}>
          <button
            className={buttons.button}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salva"}
          </button>
          <button
            className={`${buttons.button} ${buttons.buttonSecondary}`}
            onClick={handleCancel}
            disabled={saving}
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
