import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

import { useAuth } from "../../context/AuthContext";
import { FieldSetViewDto } from "../../types/field.types";
import Accordion from "../../components/shared/Accordion";
import FieldSetConfigurationsPopup from "../../components/shared/FieldSetConfigurationsPopup";
import UniversalPageTemplate from "../../components/shared/UniversalPageTemplate";
import ActionsMenu from "../../components/shared/ActionsMenu";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import table from "../../styles/common/Tables.module.css";

interface FieldSetsUniversalProps {
  scope: 'tenant' | 'project';
  projectId?: string;
}

export default function FieldSetsUniversal({ scope, projectId }: FieldSetsUniversalProps) {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;

  const [fieldSets, setFieldSets] = useState<FieldSetViewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFieldConfigurations, setHasFieldConfigurations] = useState(false);
  const [loadingConfigurations, setLoadingConfigurations] = useState(true);

  // Stato per gestire quali field sets sono espansi
  const [expandedFieldSets, setExpandedFieldSets] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!token) return;

    const fetchFieldSets = async () => {
      try {
        let endpoint = "/field-sets";
        if (scope === 'project' && projectId) {
          endpoint = `/field-sets/project/${projectId}`;
        }

        const response = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFieldSets(response.data);
      } catch (err: any) {
        console.error("Errore nel caricamento dei field sets", err);
        setError(err.response?.data?.message || "Errore nel caricamento dei field sets");
      } finally {
        setLoading(false);
      }
    };

    const fetchFieldConfigurations = async () => {
      try {
        let endpoint = "/fieldconfigurations";
        if (scope === 'project' && projectId) {
          endpoint = `/fieldconfigurations/project/${projectId}`;
        }

        const response = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasFieldConfigurations(response.data && response.data.length > 0);
      } catch (err: any) {
        console.error("Errore nel caricamento delle field configurations", err);
        setHasFieldConfigurations(false);
      } finally {
        setLoadingConfigurations(false);
      }
    };

    fetchFieldSets();
    fetchFieldConfigurations();
  }, [token, scope, projectId]);

  const handleEdit = (id: number, defaultFieldSet: boolean) => {
    if (!defaultFieldSet) {
      if (scope === 'tenant') {
        navigate(`/tenant/field-sets/${id}`);
      } else if (scope === 'project' && projectId) {
        navigate(`/projects/${projectId}/field-sets/${id}`);
      }
    }
  };

  const handleDelete = async (id: number) => {
    const fieldSet = fieldSets.find(set => set.id === id);

    if (fieldSet?.usedInItemTypeSets && fieldSet.usedInItemTypeSets.length > 0) {
      setError("Non puoi eliminare questo Field Set perché è utilizzato in uno o più ItemTypeSet.");
      return;
    }

    if (!window.confirm("Sei sicuro di voler eliminare questo field set?")) return;

    try {
      await api.delete(`/field-sets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFieldSets((prev) => prev.filter((set) => set.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore durante l'eliminazione");
    }
  };

  const handleCreate = () => {
    if (scope === 'tenant') {
      navigate("/tenant/field-sets/create");
    } else if (scope === 'project' && projectId) {
      navigate(`/projects/${projectId}/field-sets/create`);
    }
  };

  const getTitle = () => {
    return scope === 'tenant' 
      ? "Field Sets" 
      : "Field Sets del Progetto";
  };

  const getDescription = () => {
    return scope === 'tenant'
      ? "Gestisci i field sets a livello tenant."
      : "Gestisci i field sets specifici per questo progetto.";
  };

  let content;
  if (loading) {
    content = <p className="list-loading">Caricamento field sets...</p>;
  } else if (fieldSets.length === 0) {
    content = (
      <div>
        <p className="list-loading">Nessun field set trovato.</p>
      </div>
    );
  } else {
    content = (
      <ul className={layout.verticalList}>
        {fieldSets.map((set) => (
          <li key={set.id}>
            <Accordion
              id={set.id}
              title={<h2>{set.name}</h2>}
              isExpanded={expandedFieldSets[set.id] || false}
              onToggle={() => setExpandedFieldSets((prev) => ({
                ...prev,
                [set.id]: !prev[set.id],
              }))}
            >
              <table className={table.table}>
                <thead>
                  <tr>
                    <th className="w-20">Nome</th>
                    <th className="w-30">Descrizione</th>
                    <th className="w-20">Configurazioni</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{set.name}</td>
                    <td><span className="text-sm text-gray-600">{set.description || "-"}</span></td>
                    <td>
                      <FieldSetConfigurationsPopup fieldSet={set} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ActionsMenu
                        actions={[
                          {
                            label: "✎ Edit",
                            onClick: () => handleEdit(set.id, set.defaultFieldSet),
                            disabled: set.defaultFieldSet,
                          },
                          {
                            label: "Delete",
                            onClick: () => handleDelete(set.id),
                            disabled:
                              set.defaultFieldSet ||
                              (set.usedInItemTypeSets && set.usedInItemTypeSets.length > 0),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </Accordion>
          </li>
        ))}
        <div className="mt-6">
          <button
            className={buttons.button}
            onClick={handleCreate}
          >
            Add Field Set
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
          disabled={!hasFieldConfigurations || loadingConfigurations}
          title={!hasFieldConfigurations ? "Devi creare almeno una Field Configuration prima di poter creare un Field Set" : ""}
        >
          Aggiungi Field Set
        </button>
      }
    >
      {content}
    </UniversalPageTemplate>
  );
}

