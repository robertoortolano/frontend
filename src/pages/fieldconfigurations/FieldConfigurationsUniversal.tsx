import { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

import OptionsPopup from "../../components/shared/FieldOptionsPopup";
import UsedInFieldSetsPopup from "../../components/shared/UsedInFieldSetsPopup";
import AliasPopup from "../../components/shared/FieldConfigurationAliasPopup";
import Accordion from "../../components/shared/Accordion";
import UniversalPageTemplate from "../../components/shared/UniversalPageTemplate";
import ActionsMenu from "../../components/shared/ActionsMenu";

import { useAuth } from "../../context/AuthContext";
import { FieldConfigurationViewDto } from "../../types/field.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
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
          <li key={fieldName}>
            <Accordion
              id={fieldName}
              title={<h2>{fieldName}</h2>}
              isExpanded={expandedFields[fieldName] || false}
              onToggle={() => toggleExpand(fieldName)}
            >
              {configsForField.length > 0 ? (
                <table className={table.table}>
                  <thead>
                    <tr>
                      <th className="w-20">Nome</th>
                      <th className="w-15">Tipo</th>
                      <th className="w-30">Descrizione</th>
                      <th className="w-15">Opzioni</th>
                      <th className="w-20">FieldSet</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {configsForField.map((config) => (
                      <Fragment key={config.id}>
                        <tr>
                          <td>
                            <AliasPopup config={config} />
                          </td>
                          <td><span className="text-sm text-gray-600">{config.fieldType?.displayName || "-"}</span></td>
                          <td><span className="text-sm text-gray-600">{config.description || "-"}</span></td>
                          <td>
                            <OptionsPopup options={config.options || []} />
                          </td>

                          <td>
                            <UsedInFieldSetsPopup configs={config} />
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <ActionsMenu
                              actions={[
                                {
                                  label: "✎ Edit",
                                  onClick: () => handleEdit(config.id, config.defaultFieldConfiguration),
                                  disabled: config.defaultFieldConfiguration,
                                },
                                {
                                  label: "Delete",
                                  onClick: () => handleDelete(config.id),
                                  disabled:
                                    config.defaultFieldConfiguration ||
                                    (config.usedInFieldSets && config.usedInFieldSets.length > 0),
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className={layout.paragraphMuted}>Nessuna configurazione disponibile.</p>
              )}
            </Accordion>
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
    <UniversalPageTemplate
      title={getTitle()}
      description={getDescription()}
      error={error}
      headerActions={
        <button
          className={buttons.button}
          onClick={handleCreate}
        >
          Aggiungi Configurazione
        </button>
      }
    >
      {content}
    </UniversalPageTemplate>
  );
}

