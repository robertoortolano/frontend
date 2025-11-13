import { useEffect, useState, useCallback, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

import OptionsPopup from "../../components/shared/FieldOptionsPopup";
import UsedInFieldSetsPopup from "../../components/shared/UsedInFieldSetsPopup";
import AliasPopup from "../../components/shared/FieldConfigurationAliasPopup";

import { useAuth } from "../../context/AuthContext";
import { FieldConfigurationViewDto } from "../../types/field.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import table from "../../styles/common/Tables.module.css";

interface FieldConfigurationsUniversalProps {
  scope: 'tenant' | 'project';
  projectId?: string;
}

export default function FieldConfigurationsUniversal({ scope, projectId }: FieldConfigurationsUniversalProps) {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;

  const [configs, setConfigs] = useState<FieldConfigurationViewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stato per gestire quali campi sono espansi
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});

  const handleToggleExpand = useCallback((id: number) => {
    setExpandedFields((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchConfigs = async () => {
      try {
        let endpoint = "/fieldconfigurations";
        if (scope === 'project' && projectId) {
          endpoint = `/fieldconfigurations/project/${projectId}`;
        }

        const response = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConfigs(response.data);
      } catch (err: any) {
        console.error("Errore nel caricamento delle configurazioni", err);
        setError(err.response?.data?.message || "Errore nel caricamento delle configurazioni");
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, [token, scope, projectId]);

  const handleEdit = (id: number, defaultFieldConfiguration: boolean) => {
    if (!defaultFieldConfiguration) {
      if (scope === 'tenant') {
        navigate(`/tenant/field-configurations/${id}`);
      } else if (scope === 'project' && projectId) {
        navigate(`/projects/${projectId}/field-configurations/edit/${id}`);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa configurazione?")) return;

    try {
      await api.delete(`/fieldconfigurations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfigs((prev) => prev.filter((config) => config.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore durante l'eliminazione");
    }
  };

  const handleCreate = () => {
    if (scope === 'tenant') {
      navigate("/tenant/field-configurations/create");
    } else if (scope === 'project' && projectId) {
      navigate(`/projects/${projectId}/field-configurations/create`);
    }
  };

  // Raggruppa configs per nome campo (sia per tenant che per progetto)
  const groupedConfigs = configs.reduce<Record<string, FieldConfigurationViewDto[]>>((acc, config) => {
    const fieldName = config.fieldName || "Sconosciuto";
    if (!acc[fieldName]) acc[fieldName] = [];
    acc[fieldName].push(config);
    return acc;
  }, {});

  const toggleExpand = (fieldName: string) => {
    setExpandedFields((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const getTitle = () => {
    return scope === 'tenant' 
      ? "Field Configurations" 
      : "Field Configurations del Progetto";
  };

  const getDescription = () => {
    return scope === 'tenant'
      ? "Gestisci le configurazioni dei campi a livello tenant."
      : "Gestisci le configurazioni dei campi specifiche per questo progetto.";
  };

  let content;
  if (loading) {
    content = <p className="list-loading">Caricamento configurazioni...</p>;
  } else if (configs.length === 0) {
    content = (
      <div>
        <p className="list-loading">Nessuna configurazione trovata.</p>
      </div>
    );
  } else {
    content = (
      <ul className={layout.verticalList}>
        {Object.entries(groupedConfigs).map(([fieldName, configsForField]) => (
          <li key={fieldName} className={layout.block}>
            <button
              type="button"
              className={`${layout.blockHeader} cursor-pointer flex items-center justify-between`}
              onClick={() => toggleExpand(fieldName)}
            >
              <h2>{fieldName}</h2>
            </button>

            {expandedFields[fieldName] && (
              <div className={layout.mt4}>
                {configsForField.length > 0 ? (
                  <table className={table.table}>
                    <thead>
                      <tr>
                        <th className="w-20">Nome</th>
                        <th className="w-15">Tipo</th>
                        <th className="w-30">Descrizione</th>
                        <th className="w-15">Opzioni</th>
                        <th className="w-20">FieldSet</th>
                        <th className="w-15"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {configsForField.map((config) => (
                        <Fragment key={config.id}>
                          <tr
                            onClick={() => handleToggleExpand(config.id)}
                            className="cursor-pointer"
                          >
                            <td>
                              <AliasPopup config={config} />
                            </td>
                            <td>{config.fieldType?.displayName || "-"}</td>
                            <td>{config.description || "-"}</td>
                            <td>
                              <OptionsPopup options={config.options || []} />
                            </td>

                            <td>
                              <UsedInFieldSetsPopup configs={config} />
                            </td>

                            <td>
                              <div className="flex flex-col gap-1">
                                <button
                                  className={buttons.button}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(config.id, config.defaultFieldConfiguration);
                                  }}
                                  disabled={config.defaultFieldConfiguration}
                                  title={
                                    config.defaultFieldConfiguration
                                      ? "Configurazione di default non modificabile"
                                      : ""
                                  }
                                >
                                  ✎ Edit
                                </button>

                                <button
                                  className={`${buttons.button}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(config.id);
                                  }}
                                  disabled={
                                    config.defaultFieldConfiguration ||
                                    (config.usedInFieldSets && config.usedInFieldSets.length > 0)
                                  }
                                  title={
                                    config.usedInFieldSets && config.usedInFieldSets.length > 0
                                      ? "Non puoi eliminare: usata in uno o più FieldSet"
                                      : "Elimina configurazione"
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={layout.paragraphMuted}>Nessuna configurazione disponibile.</p>
                )}
              </div>
            )}
          </li>
        ))}
        <div className="mt-6">
          <button
            className={buttons.button}
            onClick={handleCreate}
          >
            Add Configuration
          </button>
        </div>
      </ul>
    );
  }

  if (!isAuthenticated) {
    return <p className="list-loading">Non sei autenticato.</p>;
  }

  return (
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        {getTitle() && <h1 className={layout.title}>{getTitle()}</h1>}
        {getDescription() && <p className={layout.paragraphMuted}>{getDescription()}</p>}
        <div className={layout.buttonRow}>
          <button
            className={buttons.button}
            onClick={handleCreate}
          >
            Aggiungi Configurazione
          </button>
        </div>
      </div>

      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      {/* Content Section */}
      <div className={layout.section}>
        {content}
      </div>
    </div>
  );
}

