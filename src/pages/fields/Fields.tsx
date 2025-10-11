import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import FieldConfigurationsPopup from "../../components/shared/FieldConfigurationsPopup";
import FieldSetsPopup from "../../components/shared/FieldSetsPopup";
import { useAuth } from "../../context/AuthContext";
import { FieldDetailDto } from "../../types/field.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";
import table from "../../styles/common/Tables.module.css";

function getDeleteTitle(field: FieldDetailDto, used: boolean): string {
  if (field.defaultField) return "Campo di default non eliminabile";
  if (used) return "Campo utilizzato: non eliminabile";
  return "";
}

export default function Fields() {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const roles = auth?.roles || [];

  const [fields, setFields] = useState<FieldDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hasRole = (name: string, scope: string | null = null) => {
    return roles && Array.isArray(roles) && roles.some((r: any) => r.name === name && (scope === null || r.scope === scope));
  };
  const isTenantAdmin = hasRole("ADMIN", "TENANT");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  useEffect(() => {
    if (!token) return;

    const fetchFields = async () => {
      try {
        const response = await api.get("/fields/details", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFields(response.data);
      } catch (err: any) {
        console.error("Errore nel caricamento dei campi", err);
        setError(err.response?.data?.message || "Errore nel caricamento dei campi");
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [token]);

  if (!isTenantAdmin && !isProjectAdmin) {
    return <p className={alert.error}>You are not authorized</p>;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const postResponse = await api.post(
        "/fields",
        { name },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newFieldId = postResponse.data.id;

      // Subito dopo, recuperi i dettagli completi
      const detailResponse = await api.get(`/fields/${newFieldId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFields((prev) => [...prev, detailResponse.data]);
      setName("");
    } catch (err: any) {
      console.error("Errore nella creazione", err);
      setError(err.response?.data?.message || "Errore nella creazione. Riprova.");
    } finally {
      setSaving(false);
    }
  };


  const handleEdit = (id: number) => {
    navigate(`/tenant/fields/${id}`);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Sei sicuro di voler eliminare questo campo?");
    if (!confirmed) return;

    try {
      await api.delete(`/fields/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFields((prev) => prev.filter((field) => field.id !== id));
    } catch (err: any) {
      console.error("Errore durante l'eliminazione", err);
      window.alert(err.response?.data?.message || "Errore durante l'eliminazione");
    }
  };

  let content;
  if (loading) {
    content = <p className="list-loading">Caricamento campi...</p>;
  } else if (fields.length === 0) {
    content = <p className="list-loading">Nessun campo trovato.</p>;
  } else {
    content = (
      <table className={table.table}>
        <thead>
          <tr>
            <th className="w-30">Nome</th>
            <th className="w-20"># Config</th>
            <th className="w-30">FieldSet</th>
            <th className="w-20"></th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => {
            const used =
              (field.fieldConfigurations?.length ?? 0) > 0 ||
              (field.fieldSets?.length ?? 0) > 0;

            return (
              <tr key={field.id}>
                <td>{field.name}</td>

                <td>
                  <FieldConfigurationsPopup field={field} />
                </td>
                <td>
                  <FieldSetsPopup field={field} />
                </td>

                <td className="flex gap-2">
                  <button
                    className={buttons.button}
                    onClick={() => handleEdit(field.id)}
                    disabled={field.defaultField}
                    title={
                      field.defaultField
                        ? "Campo di default non modificabile"
                        : ""
                    }
                  >
                    ✎ Edit
                  </button>
                  <button
                    className={buttons.button}
                    onClick={() => handleDelete(field.id)}
                    disabled={field.defaultField || used}
                    title={getDeleteTitle(field, used)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  if (!isTenantAdmin && !isProjectAdmin) {
    return <p className="list-loading">You are not authorized</p>;
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Fields</h1>

      <form onSubmit={handleSubmit}>
        <div className={form.formGroup}>
          <label className={form.label} htmlFor="name">Nome</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={form.input}
            disabled={saving}
          />
        </div>

        {error && <p className={alert.error}>{error}</p>}

        <button type="submit" disabled={saving} className={buttons.button}>
          {saving ? "Salvataggio in corso..." : "Crea nuovo campo"}
        </button>
      </form>

      {content}
    </div>
  );
}

