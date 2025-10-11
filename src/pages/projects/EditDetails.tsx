import { useEffect, useState, FormEvent } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { ProjectDto } from "../../types/project.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";

export default function EditDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();

  const token = (state as any)?.token || localStorage.getItem("token");
  const from = (state as any)?.from;

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProject(response.data);
        setName(response.data.name);
        setKey(response.data.key);
        setDescription(response.data.description);
      } catch (err: any) {
        console.error("Errore nel caricamento del progetto:", err);

        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("Errore nel caricamento del progetto. Riprova.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (token && projectId) fetchProject();
  }, [projectId, token]);

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await axios.put(
        `http://localhost:8080/api/projects/${projectId}`,
        { name, key, description },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate(from, { state: { token } });
    } catch (err: any) {
      console.error("Errore durante il salvataggio del progetto:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Errore durante il salvataggio. Riprova.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(from, { state: { token } });
  };

  if (loading) return <p className="italic text-blue-600">Loading project...</p>;

  if (!project) return <p className="text-red-600">Project not found or loading error.</p>;

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Edit Project</h1>

      <form onSubmit={handleSave} className={form.formWrapper}>
        <div className={form.formGroup}>
          <label htmlFor="name" className={form.label}>
            Name
          </label>
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

        <div className={form.formGroup}>
          <label htmlFor="key" className={form.label}>
            Key
          </label>
          <input
            id="key"
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
            className={form.input}
            disabled={saving}
          />
        </div>

        <div className={form.formGroup}>
          <label htmlFor="description" className={form.label}>
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={form.textarea}
            disabled={saving}
          />
        </div>

        {error && <p className={alert.error}>{error}</p>}

        <div className={form.buttonGroup}>
          <button type="submit" disabled={saving} className={`${buttons.button} ${buttons.small}`}>
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className={`${buttons.button} ${buttons.secondary} ${buttons.small}`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

