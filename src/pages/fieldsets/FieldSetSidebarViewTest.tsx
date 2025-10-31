/**
 * Pagina di Test: Sidebar Laterale
 * 
 * APPROCCIO 5: Sidebar View
 * - Sidebar sinistra: Configurazioni selezionate SEMPRE VISIBILI (sticky, narrow)
 * - Area principale destra: Field con configurazioni
 * - Layout compatto, ideale per schermi medi-grandi
 */

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import sidebarStyles from "../../styles/common/FieldSetSidebarView.module.css";
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

function SelectedConfigurationsSidebar({
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
    <div className={sidebarStyles.selectedSidebar}>
      <div className={sidebarStyles.selectedSidebarHeader}>
        <div className={sidebarStyles.selectedSidebarTitle}>
          <span>✅</span>
          <span>Selezionate</span>
        </div>
        <div className={sidebarStyles.selectedSidebarCount}>
          <span className={sidebarStyles.selectedSidebarCountBadge}>
            {selectedConfigurations.length}
          </span>
          <span>{selectedConfigurations.length === 1 ? 'configurazione' : 'configurazioni'}</span>
        </div>
      </div>

      <div className={sidebarStyles.selectedSidebarBody}>
        {selectedConfigs.length === 0 ? (
          <div className={sidebarStyles.sidebarEmpty}>
            <div className={sidebarStyles.sidebarEmptyIcon}>📝</div>
            <div style={{ fontSize: '0.8125rem' }}>Nessuna configurazione selezionata</div>
          </div>
        ) : (
          selectedConfigs.map(({ config, field }) => (
            <div key={config.id} className={sidebarStyles.sidebarConfigCard}>
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
                onClick={() => onRemove(config.id)}
                className={sidebarStyles.sidebarConfigRemove}
                title="Rimuovi"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SidebarFieldCard({ 
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
    <div className={sidebarStyles.sidebarFieldCard}>
      {/* Header del Field */}
      <div className={sidebarStyles.sidebarFieldHeader}>
        <div className={sidebarStyles.sidebarFieldHeaderContent}>
          <span className={sidebarStyles.sidebarFieldIcon}>📋</span>
          <span className={sidebarStyles.sidebarFieldName}>{field.name}</span>
          <span className={sidebarStyles.sidebarFieldBadge}>
            {fieldConfigs.length} disponibili
          </span>
        </div>
      </div>

      {/* Configurazioni */}
      <div className={sidebarStyles.sidebarConfigurationsArea}>
        {fieldConfigs.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
            Nessuna configurazione disponibile
          </div>
        ) : (
          <div className={sidebarStyles.sidebarConfigurationsList}>
            {fieldConfigs.map((config) => {
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
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onConfigurationToggle(config.id)}
                    className={sidebarStyles.sidebarConfigItemCheckbox}
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

export default function FieldSetSidebarViewTest() {
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
    <div className={layout.container} style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div className={layout.headerSection}>
        <h1 className={layout.title}>📌 Sidebar View: Selezionate a Sinistra</h1>
        <p className={layout.paragraphMuted}>
          Questo è l'<strong>Approccio 5</strong>: layout con sidebar laterale dove le configurazioni selezionate 
          sono sempre visibili in una <strong>sidebar stretta a sinistra</strong> mentre lavori sui Field a destra.
        </p>
      </div>

      <div className={sidebarStyles.sidebarInfo}>
        <strong>💡 Come funziona:</strong>
        <div>
          La sidebar sinistra (sticky) mostra sempre le configurazioni selezionate. 
          Clicca sui checkbox nella colonna principale per aggiungere/rimuovere configurazioni.
        </div>
      </div>

      <div className={sidebarStyles.sidebarViewContainer}>
        {/* Sidebar sinistra: Configurazioni selezionate */}
        <SelectedConfigurationsSidebar
          selectedConfigurations={selectedConfigurations}
          fields={fields}
          fieldConfigurations={fieldConfigurations}
          onRemove={handleRemoveSelected}
        />

        {/* Area principale destra: Field */}
        <div className={sidebarStyles.mainContentArea}>
          {fields.length === 0 ? (
            <div className={form.alertInfo}>
              <strong>Nessun campo disponibile</strong><br />
              Crea prima dei campi per vedere il layout.
            </div>
          ) : (
            fields.map((field) => (
              <SidebarFieldCard
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

