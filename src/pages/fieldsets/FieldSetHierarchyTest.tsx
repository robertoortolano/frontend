/**
 * Pagina di Test per il Layout Gerarchico Field → FieldConfiguration
 * 
 * Questa pagina mostra un esempio del nuovo layout proposto che evidenzia
 * meglio la relazione padre-figlio tra Field e FieldConfiguration.
 */

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import hierarchyStyles from "../../styles/common/FieldSetHierarchy.module.css";
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

function FieldHierarchyCard({ 
  field, 
  configurations, 
  selectedField, 
  selectedConfigurations,
  onFieldSelect,
  onConfigurationSelect 
}: {
  field: Field;
  configurations: FieldConfiguration[];
  selectedField: number | null;
  selectedConfigurations: number[];
  onFieldSelect: (fieldId: number) => void;
  onConfigurationSelect: (configId: number) => void;
}) {
  const isSelected = selectedField === field.id;
  const fieldConfigs = configurations.filter(c => c.fieldId === field.id);

  return (
    <div className={`${hierarchyStyles.fieldHierarchyCard} ${isSelected ? hierarchyStyles.selected : ''}`}>
      {/* HEADER DEL FIELD */}
      <label className={hierarchyStyles.fieldHierarchyHeader}>
        <div className={hierarchyStyles.fieldHierarchyHeaderContent}>
          <span className={hierarchyStyles.fieldHierarchyIcon}>📋</span>
          <span className={hierarchyStyles.fieldHierarchyName}>{field.name}</span>
          <span className={hierarchyStyles.fieldHierarchyBadge}>
            {fieldConfigs.length} configurazioni
          </span>
        </div>
        <input
          type="radio"
          name="selectedField"
          checked={isSelected}
          onChange={() => onFieldSelect(field.id)}
          className={hierarchyStyles.fieldHierarchyRadio}
        />
      </label>

      {/* CONFIGURAZIONI NIDIFICATE (visibili solo se Field selezionato) */}
      {isSelected && (
        <div className={hierarchyStyles.fieldHierarchyConfigurations}>
          <div className={hierarchyStyles.fieldHierarchyInfo}>
            <strong>Seleziona una configurazione per questo Field</strong>
            Le configurazioni disponibili cambiano in base al Field selezionato sopra.
          </div>

          {fieldConfigs.length === 0 ? (
            <div className={hierarchyStyles.fieldHierarchyEmpty}>
              Nessuna configurazione disponibile per questo campo
            </div>
          ) : (
            <div className={hierarchyStyles.fieldHierarchyConnector}>
              {fieldConfigs.map((config) => {
                const isConfigSelected = selectedConfigurations.includes(config.id);
                return (
                  <label
                    key={config.id}
                    className={`${hierarchyStyles.fieldConfigurationNested} ${isConfigSelected ? hierarchyStyles.selected : ''}`}
                  >
                    <input
                      type="radio"
                      name={`selectedConfiguration_${field.id}`}
                      checked={isConfigSelected}
                      onChange={() => onConfigurationSelect(config.id)}
                      className={hierarchyStyles.fieldConfigurationRadio}
                    />
                    <div className={hierarchyStyles.fieldConfigurationContent}>
                      <div className={hierarchyStyles.fieldConfigurationHeader}>
                        <span className={hierarchyStyles.fieldConfigurationName}>
                          {config.name || "Senza nome"}
                        </span>
                        <span className={hierarchyStyles.fieldConfigurationStatus}>
                          {isConfigSelected ? "✓ Selezionata" : "Non selezionata"}
                        </span>
                      </div>
                      <div className={hierarchyStyles.fieldConfigurationDetails}>
                        <div className={hierarchyStyles.fieldConfigurationDetailRow}>
                          <span className={hierarchyStyles.fieldConfigurationDetailLabel}>Tipo:</span>
                          <span>{config.fieldType?.displayName || "Sconosciuto"}</span>
                        </div>
                        {config.description && (
                          <div className={hierarchyStyles.fieldConfigurationDetailRow}>
                            <span className={hierarchyStyles.fieldConfigurationDetailLabel}>Descrizione:</span>
                            <span>{config.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FieldSetHierarchyTest() {
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;

  const [fields, setFields] = useState<Field[]>([]);
  const [fieldConfigurations, setFieldConfigurations] = useState<FieldConfiguration[]>([]);
  const [selectedField, setSelectedField] = useState<number | null>(null);
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
        
        // Seleziona automaticamente il primo field se disponibile
        if (fieldsRes.data.length > 0) {
          setSelectedField(fieldsRes.data[0].id);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Errore nel caricamento dei dati");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleFieldSelect = (fieldId: number) => {
    setSelectedField(fieldId);
    // Rimuovi le configurazioni selezionate che non appartengono al nuovo field
    setSelectedConfigurations(prev => 
      prev.filter(configId => {
        const config = fieldConfigurations.find(c => c.id === configId);
        return config?.fieldId === fieldId;
      })
    );
  };

  const handleConfigurationSelect = (configId: number) => {
    setSelectedConfigurations(prev => {
      const config = fieldConfigurations.find(c => c.id === configId);
      if (!config) return prev;

      // Radio button behavior: solo una configurazione per field
      const otherConfigsForSameField = prev.filter(id => {
        const otherConfig = fieldConfigurations.find(c => c.id === id);
        return otherConfig?.fieldId === config.fieldId && otherConfig.id !== configId;
      });

      if (prev.includes(configId)) {
        // Se già selezionata, deseleziona
        return prev.filter(id => id !== configId);
      } else {
        // Rimuovi altre configurazioni dello stesso field e aggiungi questa
        return [...prev.filter(id => !otherConfigsForSameField.includes(id)), configId];
      }
    });
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
    <div className={layout.container} style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className={layout.headerSection}>
        <h1 className={layout.title}>🎨 Test Layout Gerarchico Field → FieldConfiguration</h1>
        <p className={layout.paragraphMuted}>
          Questa pagina mostra un esempio del nuovo layout che evidenzia meglio la relazione 
          padre-figlio tra Field e FieldConfiguration. Le configurazioni sono mostrate 
          <strong> dentro</strong> la card del Field quando viene selezionato.
        </p>
      </div>

      <div className={hierarchyStyles.fieldHierarchyContainer}>
        {fields.length === 0 ? (
          <div className={form.alertInfo}>
            <strong>Nessun campo disponibile</strong><br />
            Crea prima dei campi per vedere il layout gerarchico.
          </div>
        ) : (
          fields.map((field) => (
            <FieldHierarchyCard
              key={field.id}
              field={field}
              configurations={fieldConfigurations}
              selectedField={selectedField}
              selectedConfigurations={selectedConfigurations}
              onFieldSelect={handleFieldSelect}
              onConfigurationSelect={handleConfigurationSelect}
            />
          ))
        )}
      </div>

      {/* Riepilogo selezioni */}
      {selectedConfigurations.length > 0 && (
        <div className={layout.section} style={{ marginTop: '2rem' }}>
          <h2 className={layout.sectionTitle}>
            Configurazioni Selezionate ({selectedConfigurations.length})
          </h2>
          <div className={form.infoGrid}>
            {selectedConfigurations.map((configId) => {
              const config = fieldConfigurations.find(c => c.id === configId);
              const field = config ? fields.find(f => f.id === config.fieldId) : null;
              return config ? (
                <div key={configId} className={form.infoItem}>
                  <strong>Field:</strong> {field?.name || 'N/A'}<br />
                  <strong>Configurazione:</strong> {config.name || 'Senza nome'}
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}


