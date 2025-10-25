import { useEffect, useState, useCallback, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

import { useAuth } from "../../context/AuthContext";
import { FieldSetViewDto } from "../../types/field.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
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

  // Stato per gestire quali field sets sono espansi
  const [expandedFieldSets, setExpandedFieldSets] = useState<Record<number, boolean>>({});

  const handleToggleExpand = useCallback((id: number) => {
    setExpandedFieldSets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

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

    fetchFieldSets();
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
        <div className="mt-6">
          <button
            className={buttons.button}
            onClick={handleCreate}
          >
            Add Field Set
          </button>
        </div>
      </div>
    );
  } else {
    content = (
      <ul className={layout.verticalList}>
        {fieldSets.map((set) => (
          <li key={set.id} className={layout.block}>
            <button
              type="button"
              className={`${layout.blockHeader} cursor-pointer flex items-center justify-between`}
              onClick={() => handleToggleExpand(set.id)}
            >
              <h2>{set.name}</h2>
            </button>

            {expandedFieldSets[set.id] && (
              <div className={layout.mt4}>
                <table className={table.table}>
                  <thead>
                    <tr>
                      <th className="w-20">Nome</th>
                      <th className="w-30">Descrizione</th>
                      <th className="w-20">Configurazioni</th>
                      <th className="w-20">ItemTypeSet</th>
                      <th className="w-15"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{set.name}</td>
                      <td>{set.description || "-"}</td>
                      <td>{set.fieldSetEntries?.length || 0} configurazioni</td>
                      <td>
                        {set.usedInItemTypeSets && set.usedInItemTypeSets.length > 0 ? (
                          <span className="text-blue-600">
                            {set.usedInItemTypeSets.length} ItemTypeSet
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <button
                            className={buttons.button}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(set.id, set.defaultFieldSet);
                            }}
                            disabled={set.defaultFieldSet}
                            title={
                              set.defaultFieldSet
                                ? "Field Set di default non modificabile"
                                : "Modifica Field Set"
                            }
                          >
                            ✎ Edit
                          </button>

                          <button
                            className={`${buttons.button}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(set.id);
                            }}
                            disabled={
                              set.defaultFieldSet ||
                              (set.usedInItemTypeSets && set.usedInItemTypeSets.length > 0)
                            }
                            title={
                              set.usedInItemTypeSets && set.usedInItemTypeSets.length > 0
                                ? "Non puoi eliminare: usato in uno o più ItemTypeSet"
                                : set.defaultFieldSet
                                  ? "FieldSet di default non eliminabile"
                                  : "Elimina Field Set"
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
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
    <div className={layout.container}>
      {getTitle() && <h1 className={layout.title}>{getTitle()}</h1>}
      {getDescription() && <p className={layout.paragraphMuted}>{getDescription()}</p>}
      {error && <p className={alert.error}>{error}</p>}
      {content}
    </div>
  );
}

