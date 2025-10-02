import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import utilities from "../../styles/common/Utilities.module.css";
import table from "../../styles/common/Tables.module.css";


export default function ItemTypeSets() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, roles, isAuthenticated } = useAuth();
  const [expandedSets, setExpandedSets] = useState({});

  const toggleExpand = (setId) => {
    setExpandedSets(prev => ({
      ...prev,
      [setId]: !prev[setId]
    }));
  };


  const isProjectContext = !!id;
  const [itemTypeSets, setItemTypeSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasRole = (name, scope = null) => {
    return roles.some(r => r.name === name && (scope === null || r.scope === scope));
  };


  const isTenantAdmin = hasRole("ADMIN", "GLOBAL");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  useEffect(() => {
    if (!token) return;

    const fetchItemTypeSets = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/item-type-sets/global", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Errore nel caricamento");

        const data = await res.json();
        setItemTypeSets(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItemTypeSets();
  }, [isProjectContext, id, token]);

  // ✅ Accesso negato se non autorizzato
  if (!isAuthenticated || (!isTenantAdmin && (!isProjectContext || !isProjectAdmin))) {
    return <p className={alert.error}>Accesso negato</p>;
  }

  const handleCreate = () => {
    navigate(isProjectContext ? `create` : `/tenant/item-type-sets/create`);
  };

  let content;

  if (loading) {
    content = <p className={layout.loading}>Caricamento...</p>;
  } else if (error) {
    content = <p className={alert.error}>{error}</p>;
  } else if (itemTypeSets.length === 0) {
    content = <p className={layout.loading}>Nessun item type set trovato.</p>;
  } else {
    content = (
      <ul className={layout.verticalList}>
        {itemTypeSets.map((set) => (
            <li key={set.id} className={layout.block}>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  className={`${layout.blockHeader} cursor-pointer flex items-center justify-between flex-grow`}
                  onClick={() => toggleExpand(set.id)}
                >
                  <h2 className={layout.blockTitleBlue}>{set.name}</h2>
                  {expandedSets[set.id] ? <ChevronDown /> : <ChevronRight />}
                </button>

                {!set.defaultItemTypeSet && (
                  <button
                    className={`${buttons.button} ${buttons.buttonSmall}`}
                    onClick={() => navigate(`/tenant/item-type-sets/edit/${set.id}`)}
                    title="Modifica Item Type Set"
                    type="button"
                  >
                    Edit
                  </button>
                )}
              </div>

              {expandedSets[set.id] && (
                <div className={utilities.mt4}>
                  {set.itemTypeConfigurations?.length > 0 ? (
                    <table className={table.table}>
                      <thead>
                        <tr>
                          <th>Item Type</th>
                          <th>Categoria</th>
                          <th>Workflow</th>
                          <th>Field Set</th>
                        </tr>
                      </thead>
                      <tbody>
                        {set.itemTypeConfigurations.map((conf) => (
                          <tr key={conf.id}>
                            <td>{conf.itemType?.name}</td>
                            <td>{conf.category}</td>
                            <td>{conf.workflow?.name || "-"}</td>
                            <td>{conf.fieldSet?.name || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className={layout.paragraphMuted}>Nessuna configurazione in questo set.</p>
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
        Item Type Sets {isProjectContext ? "di Progetto" : "Globali"}
      </h1>

      {content}

      <div className={layout.buttonRow}>
        <button
          onClick={handleCreate}
          className={`${buttons.button} ${buttons.buttonSmall}`}
        >
          + Crea Nuovo Item Type Set
        </button>
      </div>
    </div>
  );
}
