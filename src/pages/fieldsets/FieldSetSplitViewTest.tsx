/**
 * Pagina di Test: Layout a Due Colonne
 * 
 * APPROCCIO 3: Split View
 * - Colonna sinistra: Field con configurazioni
 * - Colonna destra: Configurazioni selezionate SEMPRE VISIBILI
 * - Le configurazioni appaiono immediatamente nella colonna destra quando selezionate
 */

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import splitStyles from "../../styles/common/FieldSetSplitView.module.css";
import layout from "../../styles/common/Layout.module.css";
import form from "../../styles/common/Forms.module.css";

interface Field {
  id: number;
  name: string;
  defaultField?: boolean;
}

interface FieldConfiguration {
  id: number;
  name: string;
  fieldId: number;
  fieldType?: {
    displayName: string;
  };
  description?: string;
}

function SplitViewFieldCard({ 
  field, 
  configurations, 
  selectedConfigurations,
  onConfigurationToggle 
}: {
  field: Field;
  configurations: FieldConfiguration[];
  selectedConfigurations: number[];
  onConfigurationToggle: (configId: number, fieldId: number) => void;
}) {
  const fieldConfigs = configurations.filter(c => c.fieldId === field.id);

  return (
    <div className={splitStyles.splitViewFieldCard}>
      {/* Header del Field */}
      <div className={splitStyles.splitViewFieldHeader}>
        <div className={splitStyles.splitViewFieldHeaderContent}>
          <span className={splitStyles.splitViewFieldIcon}>📋</span>
          <span className={splitStyles.splitViewFieldName}>{field.name}</span>
          <span className={splitStyles.splitViewFieldBadge}>
            {fieldConfigs.length} disponibili
          </span>
        </div>
      </div>

      {/* Configurazioni (sempre visibili) */}
      <div className={splitStyles.splitViewConfigurationsArea}>
        {fieldConfigs.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
            Nessuna configurazione disponibile
          </div>
        ) : (
          <div className={splitStyles.splitViewConfigurationsList}>
            {fieldConfigs.map((config) => {
              const isSelected = selectedConfigurations.includes(config.id);
              return (
                <label
                  key={config.id}
                  className={`${splitStyles.splitViewConfigurationCard} ${isSelected ? splitStyles.selected : ''}`}
                >
                  <div className={splitStyles.splitViewConfigurationContent}>
                    <div className={splitStyles.splitViewConfigurationName}>
                      {config.name || "Senza nome"}
                    </div>
                    <div className={splitStyles.splitViewConfigurationDetails}>
                      Tipo: {config.fieldType?.displayName || "Sconosciuto"}
                      {config.description && ` • ${config.description}`}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onConfigurationToggle(config.id, field.id)}
                    className={splitStyles.splitViewConfigurationCheckbox}
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectedConfigurationsPanel({
  selectedConfigurations,
  fields,
  fieldConfigurations,
  onRemove
}: {
  selectedConfigurations: number[];
  fields: Field[];
  fieldConfigurations: FieldConfiguration[];
  onRemove: (configId: number) => void;
}) {
  const selectedConfigs = selectedConfigurations
    .map(id => fieldConfigurations.find(c => c.id === id))
    .filter((c): c is FieldConfiguration => c !== undefined)
    .map(config => {
      const field = fields.find(f => f.id === config.fieldId);
      return { config, field };
    })
    .sort((a, b) => {
      // Ordina per nome Field, poi per nome Config
      const fieldCompare = (a.field?.name || '').localeCompare(b.field?.name || '');
      if (fieldCompare !== 0) return fieldCompare;
      return (a.config.name || '').localeCompare(b.config.name || '');
    });

  return (
    <div className={splitStyles.selectedColumn}>
      <div className={splitStyles.selectedHeader}>
        <div className={splitStyles.selectedHeaderTitle}>
          ✅ Configurazioni Selezionate
        </div>
        <div className={splitStyles.selectedHeaderCount}>
          {selectedConfigurations.length} {selectedConfigurations.length === 1 ? 'configurazione' : 'configurazioni'}
        </div>
      </div>

      <div className={splitStyles.selectedBody}>
        {selectedConfigs.length === 0 ? (
          <div className={splitStyles.emptySelected}>
            <div className={splitStyles.emptySelectedIcon}>📝</div>
            <div>Nessuna configurazione selezionata</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}>
              Seleziona le configurazioni dalla colonna sinistra
            </div>
          </div>
        ) : (
          selectedConfigs.map(({ config, field }) => (
            <div key={config.id} className={splitStyles.selectedConfigurationCard}>
              <div className={splitStyles.selectedConfigurationHeader}>
                <span className={splitStyles.selectedConfigurationFieldName}>
                  {field?.name || 'Field sconosciuto'}
                </span>
                <button
                  onClick={() => onRemove(config.id)}
                  className={splitStyles.selectedConfigurationRemove}
                  title="Rimuovi"
                >
                  ✕
                </button>
              </div>
              <div className={splitStyles.selectedConfigurationName}>
                {config.name || "Senza nome"}
              </div>
              <div className={splitStyles.selectedConfigurationDetails}>
                <div>Tipo: {config.fieldType?.displayName || "Sconosciuto"}</div>
                {config.description && (
                  <div>Descrizione: {config.description}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function FieldSetSplitViewTest() {
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;

  const [fields, setFields] = useState<Field[]>([]);
  const [fieldConfigurations, setFieldConfigurations] = useState<FieldConfiguration[]>([]);
  const [selectedConfigurations, setSelectedConfigurations] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [fieldsRes, configsRes] = await Promise.all([
          api.get("/fields", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/fieldconfigurations", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        setFields(fieldsRes.data);
        setFieldConfigurations(configsRes.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Errore nel caricamento dei dati");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleConfigurationToggle = (configId: number, fieldId: number) => {
    setSelectedConfigurations(prev => {
      if (prev.includes(configId)) {
        // Rimuovi se già selezionata
        return prev.filter(id => id !== configId);
      } else {
        // Aggiungi se non selezionata
        return [...prev, configId];
      }
    });
  };

  const handleRemoveSelected = (configId: number) => {
    setSelectedConfigurations(prev => prev.filter(id => id !== configId));
  };

  if (!isAuthenticated) {
    return <p className="list-loading">Non sei autenticato.</p>;
  }

  if (loading) {
    return <p className="list-loading">Caricamento...</p>;
  }

  if (error) {
    return (
      <div className={layout.container}>
        <div className={form.alertWarning}>
          <h4>Errore</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={layout.container} style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className={layout.headerSection}>
        <h1 className={layout.title}>📊 Split View: Configurazioni Sempre Visibili</h1>
        <p className={layout.paragraphMuted}>
          Questo è l'<strong>Approccio 3</strong>: layout a due colonne dove le configurazioni selezionate 
          sono <strong>sempre visibili</strong> nella colonna destra mentre si selezionano da sinistra.
        </p>
      </div>

      <div className={splitStyles.splitViewInfo}>
        <strong>💡 Come funziona:</strong>
        <div>
          Seleziona le configurazioni dalla colonna sinistra usando i checkbox. 
          Le configurazioni selezionate appaiono immediatamente nella colonna destra (sticky) 
          e puoi rimuoverle cliccando su ✕.
        </div>
      </div>

      <div className={splitStyles.splitViewContainer}>
        {/* Colonna sinistra: Selezione */}
        <div className={splitStyles.selectionColumn}>
          {fields.length === 0 ? (
            <div className={form.alertInfo}>
              <strong>Nessun campo disponibile</strong><br />
              Crea prima dei campi per vedere il layout.
            </div>
          ) : (
            fields.map((field) => (
              <SplitViewFieldCard
                key={field.id}
                field={field}
                configurations={fieldConfigurations}
                selectedConfigurations={selectedConfigurations}
                onConfigurationToggle={handleConfigurationToggle}
              />
            ))
          )}
        </div>

        {/* Colonna destra: Configurazioni selezionate */}
        <SelectedConfigurationsPanel
          selectedConfigurations={selectedConfigurations}
          fields={fields}
          fieldConfigurations={fieldConfigurations}
          onRemove={handleRemoveSelected}
        />
      </div>
    </div>
  );
}

