/**
 * Pagina di Test: Layout Verticale con Selezionate in Alto
 * 
 * APPROCCIO 4: Vertical View
 * - Sezione superiore: Configurazioni selezionate SEMPRE VISIBILI (sticky)
 * - Sezione inferiore: Field con configurazioni disponibili
 * - Layout verticale, ideale per schermi larghi
 */

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import verticalStyles from "../../styles/common/FieldSetVerticalView.module.css";
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

function SelectedConfigurationsSection({
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
      const fieldCompare = (a.field?.name || '').localeCompare(b.field?.name || '');
      if (fieldCompare !== 0) return fieldCompare;
      return (a.config.name || '').localeCompare(b.config.name || '');
    });

  return (
    <div className={verticalStyles.selectedSection}>
      <div className={verticalStyles.selectedSectionHeader}>
        <div className={verticalStyles.selectedSectionHeaderContent}>
          <span>✅</span>
          <span className={verticalStyles.selectedSectionTitle}>Configurazioni Selezionate</span>
          <span className={verticalStyles.selectedSectionCount}>
            {selectedConfigurations.length}
          </span>
        </div>
      </div>

      <div className={verticalStyles.selectedSectionBody}>
        {selectedConfigs.length === 0 ? (
          <div className={verticalStyles.emptyMessage}>
            <div className={verticalStyles.emptyMessageIcon}>📝</div>
            <div>Nessuna configurazione selezionata</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}>
              Seleziona le configurazioni dalla sezione sottostante
            </div>
          </div>
        ) : (
          <div className={verticalStyles.selectedGrid}>
            {selectedConfigs.map(({ config, field }) => (
              <div key={config.id} className={verticalStyles.selectedConfigCard}>
                <div className={verticalStyles.selectedConfigFieldLabel}>
                  {field?.name || 'Field sconosciuto'}
                </div>
                <div className={verticalStyles.selectedConfigName}>
                  {config.name || "Senza nome"}
                </div>
                <div className={verticalStyles.selectedConfigDetails}>
                  <div>Tipo: {config.fieldType?.displayName || "Sconosciuto"}</div>
                  {config.description && (
                    <div style={{ marginTop: '0.25rem' }}>Descrizione: {config.description}</div>
                  )}
                </div>
                <button
                  onClick={() => onRemove(config.id)}
                  className={verticalStyles.selectedConfigRemove}
                  title="Rimuovi"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VerticalFieldCard({ 
  field, 
  configurations, 
  selectedConfigurations,
  onConfigurationToggle 
}: {
  field: Field;
  configurations: FieldConfiguration[];
  selectedConfigurations: number[];
  onConfigurationToggle: (configId: number) => void;
}) {
  const fieldConfigs = configurations.filter(c => c.fieldId === field.id);

  return (
    <div className={verticalStyles.verticalFieldCard}>
      {/* Header del Field */}
      <div className={verticalStyles.verticalFieldHeader}>
        <div className={verticalStyles.verticalFieldHeaderContent}>
          <span className={verticalStyles.verticalFieldIcon}>📋</span>
          <span className={verticalStyles.verticalFieldName}>{field.name}</span>
          <span className={verticalStyles.verticalFieldBadge}>
            {fieldConfigs.length} configurazioni
          </span>
        </div>
      </div>

      {/* Configurazioni in grid */}
      <div className={verticalStyles.verticalConfigurationsArea}>
        {fieldConfigs.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
            Nessuna configurazione disponibile per questo campo
          </div>
        ) : (
          <div className={verticalStyles.verticalConfigurationsGrid}>
            {fieldConfigs.map((config) => {
              const isSelected = selectedConfigurations.includes(config.id);
              return (
                <label
                  key={config.id}
                  className={`${verticalStyles.verticalConfigCard} ${isSelected ? verticalStyles.selected : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onConfigurationToggle(config.id)}
                    className={verticalStyles.verticalConfigCheckbox}
                  />
                  <div className={verticalStyles.verticalConfigName}>
                    {config.name || "Senza nome"}
                  </div>
                  <div className={verticalStyles.verticalConfigDetails}>
                    <div>Tipo: {config.fieldType?.displayName || "Sconosciuto"}</div>
                    {config.description && (
                      <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
                        {config.description}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FieldSetVerticalViewTest() {
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

  const handleConfigurationToggle = (configId: number) => {
    setSelectedConfigurations(prev => {
      if (prev.includes(configId)) {
        return prev.filter(id => id !== configId);
      } else {
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
        <h1 className={layout.title}>📋 Vertical View: Selezionate in Alto</h1>
        <p className={layout.paragraphMuted}>
          Questo è l'<strong>Approccio 4</strong>: layout verticale dove le configurazioni selezionate 
          sono sempre visibili in una sezione <strong>sticky in alto</strong> mentre scorri i Field sottostanti.
        </p>
      </div>

      <div className={verticalStyles.verticalInfo}>
        <strong>💡 Come funziona:</strong>
        <div>
          Le configurazioni selezionate rimangono sempre visibili in alto mentre scrolli la pagina.
          Clicca sulle card delle configurazioni per selezionarle/deselezionarle.
        </div>
      </div>

      <div className={verticalStyles.verticalViewContainer}>
        {/* Sezione superiore: Configurazioni selezionate (sticky) */}
        <SelectedConfigurationsSection
          selectedConfigurations={selectedConfigurations}
          fields={fields}
          fieldConfigurations={fieldConfigurations}
          onRemove={handleRemoveSelected}
        />

        {/* Sezione inferiore: Field con configurazioni */}
        <div className={verticalStyles.fieldsSection}>
          <h2 className={verticalStyles.fieldsSectionTitle}>
            📊 Seleziona Configurazioni dai Field
          </h2>
          {fields.length === 0 ? (
            <div className={form.alertInfo}>
              <strong>Nessun campo disponibile</strong><br />
              Crea prima dei campi per vedere il layout.
            </div>
          ) : (
            fields.map((field) => (
              <VerticalFieldCard
                key={field.id}
                field={field}
                configurations={fieldConfigurations}
                selectedConfigurations={selectedConfigurations}
                onConfigurationToggle={handleConfigurationToggle}
              />
            ))
          )}
        </div>
      </div>
    </div>
    );
}

