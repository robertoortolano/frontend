/**
 * Pagina di Test per il Layout Tree View Field → FieldConfiguration
 * 
 * Questo è il SECONDO APPROCCIO che mostra la relazione gerarchica
 * usando un layout ad albero con connettori visivi più marcati.
 */

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import treeStyles from "../../styles/common/FieldSetTreeView.module.css";
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

function TreeViewFieldCard({ 
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
    <div className={`${treeStyles.treeViewFieldCard} ${isSelected ? treeStyles.selected : ''}`}>
      {/* HEADER DEL FIELD */}
      <label className={treeStyles.treeViewFieldHeader}>
        <div className={treeStyles.treeViewFieldHeaderContent}>
          <span className={treeStyles.treeViewFieldIcon}>🌳</span>
          <span className={treeStyles.treeViewFieldName}>{field.name}</span>
          <span className={treeStyles.treeViewFieldBadge}>
            {fieldConfigs.length} configurazioni
          </span>
        </div>
        <input
          type="radio"
          name="selectedField"
          checked={isSelected}
          onChange={() => onFieldSelect(field.id)}
          className={treeStyles.treeViewFieldRadio}
        />
      </label>

      {/* AREA CONFIGURAZIONI CON TREE VIEW (visibili solo se Field selezionato) */}
      {isSelected && (
        <div className={treeStyles.treeViewConfigurationsArea}>
          {/* Connettore verticale principale */}
          {fieldConfigs.length > 0 && (
            <div className={treeStyles.treeViewMainConnector} />
          )}

          <div className={treeStyles.treeViewInfo}>
            <strong>Seleziona una configurazione per questo Field</strong>
            Le configurazioni sono collegate al Field sopra tramite il connettore verticale.
          </div>

          {fieldConfigs.length === 0 ? (
            <div className={treeStyles.treeViewEmpty}>
              Nessuna configurazione disponibile per questo campo
            </div>
          ) : (
            <div className={treeStyles.treeViewConfigurationsList}>
              {fieldConfigs.map((config, index) => {
                const isConfigSelected = selectedConfigurations.includes(config.id);
                const isLast = index === fieldConfigs.length - 1;
                
                return (
                  <div 
                    key={config.id} 
                    className={treeStyles.treeViewConfigItem}
                    style={{
                      // Regola il connettore verticale principale se è l'ultimo elemento
                      paddingBottom: isLast ? '0' : undefined
                    }}
                  >
                    {/* Connettore verticale si estende solo fino all'ultimo elemento */}
                    {!isLast && (
                      <div 
                        style={{
                          position: 'absolute',
                          left: '-1.5rem',
                          top: '1rem',
                          bottom: '-0.75rem',
                          width: '3px',
                          background: 'linear-gradient(to bottom, #93c5fd, transparent)',
                          zIndex: 0
                        }}
                      />
                    )}
                    
                    <label
                      className={`${treeStyles.treeViewConfigurationCard} ${isConfigSelected ? treeStyles.selected : ''}`}
                    >
                      <input
                        type="radio"
                        name={`selectedConfiguration_${field.id}`}
                        checked={isConfigSelected}
                        onChange={() => onConfigurationSelect(config.id)}
                        className={treeStyles.treeViewConfigurationRadio}
                      />
                      <div className={treeStyles.treeViewConfigurationContent}>
                        <div className={treeStyles.treeViewConfigurationHeader}>
                          <span className={treeStyles.treeViewConfigurationName}>
                            {config.name || "Senza nome"}
                          </span>
                          <span className={treeStyles.treeViewConfigurationStatus}>
                            {isConfigSelected ? "✓ Selezionata" : "Non selezionata"}
                          </span>
                        </div>
                        <div className={treeStyles.treeViewConfigurationDetails}>
                          <div className={treeStyles.treeViewConfigurationDetailRow}>
                            <span className={treeStyles.treeViewConfigurationDetailLabel}>Tipo:</span>
                            <span>{config.fieldType?.displayName || "Sconosciuto"}</span>
                          </div>
                          {config.description && (
                            <div className={treeStyles.treeViewConfigurationDetailRow}>
                              <span className={treeStyles.treeViewConfigurationDetailLabel}>Descrizione:</span>
                              <span>{config.description}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FieldSetTreeViewTest() {
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
        <h1 className={layout.title}>🌳 Test Tree View Field → FieldConfiguration</h1>
        <p className={layout.paragraphMuted}>
          Questo è il <strong>secondo approccio</strong> che usa un layout ad albero con connettori visivi.
          La relazione padre-figlio è evidenziata da <strong>linee verticali e orizzontali</strong> che 
          collegano il Field alle sue configurazioni, simili a un diagramma di flusso.
        </p>
      </div>

      <div className={treeStyles.treeViewContainer}>
        {fields.length === 0 ? (
          <div className={form.alertInfo}>
            <strong>Nessun campo disponibile</strong><br />
            Crea prima dei campi per vedere il layout ad albero.
          </div>
        ) : (
          fields.map((field) => (
            <TreeViewFieldCard
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

      {/* Confronto approcci */}
      <div className={layout.section} style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #93c5fd' }}>
        <h3 className={layout.sectionTitle} style={{ color: '#1e40af' }}>📊 Confronto Approcci</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9375rem' }}>
          <div>
            <strong style={{ color: '#1e40af' }}>Approccio 1 (Card Nidificate):</strong>
            <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', color: '#374151' }}>
              <li>Configurazioni dentro la card del Field</li>
              <li>Bordo sinistro colorato sulle configurazioni</li>
              <li>Design più compatto</li>
            </ul>
          </div>
          <div>
            <strong style={{ color: '#1e40af' }}>Approccio 2 (Tree View - questo):</strong>
            <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', color: '#374151' }}>
              <li>Linee connettori verticali e orizzontali visibili</li>
              <li>Layout ad albero con punti di connessione</li>
              <li>Rappresentazione più grafica della gerarchia</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


