import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

import OptionsPopup from "../../components/shared/FieldOptionsPopup";

import { useAuth } from "../../context/AuthContext";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import utilities from "../../styles/common/Utilities.module.css";
import table from "../../styles/common/Tables.module.css";

export default function FieldSets() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, roles, isAuthenticated } = useAuth();

  const [expandedSets, setExpandedSets] = useState({});
  const [fieldSets, setFieldSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isProjectContext = !!id;

  const hasRole = (name, scope = null) => {
    return roles.some(r => r.name === name && (scope === null || r.scope === scope));
  };
  const isTenantAdmin = hasRole("ADMIN", "GLOBAL");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  useEffect(() => {
    if (!token) return;

    const fetchFieldSets = async () => {
      try {
        const url = isProjectContext
          ? `/field-sets/project/${id}`
          : "/field-sets/global";

        const res = await api.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setFieldSets(res.data); // Axios usa res.data
      } catch (e) {
        setError(e.message || "Errore nel caricamento");
      } finally {
        setLoading(false);
      }
    };

    fetchFieldSets();
  }, [isProjectContext, id, token]);

  if (!isAuthenticated || (!isTenantAdmin && (!isProjectContext || !isProjectAdmin))) {
    return <p className={alert.error}>Accesso negato</p>;
  }

  const toggleExpand = (setId) => {
    setExpandedSets((prev) => ({
      ...prev,
      [setId]: !prev[setId],
    }));
  };

  const handleCreate = () => {
    navigate(isProjectContext ? `create` : `/tenant/field-sets/create`);
  };

  let content;
  if (loading) {
    content = <p className={layout.loading}>Caricamento...</p>;
  } else if (error) {
    content = <p className={alert.error}>{error}</p>;
  } else if (fieldSets.length === 0) {
    content = <p className={layout.loading}>Nessun field set trovato.</p>;
  } else {
    content = (
      <ul className={layout.verticalList}>
        {fieldSets.map((set) => (
          <li key={set.id} className={layout.block}>
            <div className={`${layout.blockHeaderButton} flex items-center justify-between`}>
              <button
                type="button"
                className={`${layout.blockHeader} cursor-pointer flex items-center justify-between`}
                onClick={() => toggleExpand(set.id)}
              >
                <h2>{set.name}</h2>
              </button>

              {/* Bottone Modifica */}
              <button
                onClick={() => navigate(
                  isProjectContext
                    ? `/project/${id}/field-sets/${set.id}`
                    : `/tenant/field-sets/${set.id}`
                )}
                className={`${buttons.button} ${buttons.buttonSmall} ${utilities.ml2}`}
                disabled={set.defaultFieldSet}
                  title={
                    set.defaultFieldSet
                      ? "FieldSet di default non modificabile"
                      : ""
                  }
              >
                ✎ Edit
              </button>
            </div>

            {expandedSets[set.id] && (
              <div className={utilities.mt4}>
                {set.fieldSetEntries?.length > 0 ? (
                  <table className={table.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Field name</th>
                        <th>Type</th>
                        <th>Options</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...set.fieldSetEntries].map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.fieldConfiguration?.name || "-"}</td>
                          <td>{entry.fieldConfiguration?.fieldName || "-"}</td>
                          <td>{entry.fieldConfiguration?.fieldType?.displayName || "-"}</td>
                          <td>
                            <OptionsPopup options={entry.fieldConfiguration?.options || []} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={layout.paragraphMuted}>Nessun campo assegnato a questo set.</p>
                )}
              </div>
            )}


          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>
        Field Sets {isProjectContext ? "di Progetto" : "Globali"}
      </h1>

      {content}

      <div className={layout.buttonRow}>
        <button
          onClick={handleCreate}
          className={`${buttons.button} ${buttons.buttonSmall}`}
        >
          + Crea Nuovo Field Set
        </button>
      </div>
    </div>
  );
}
