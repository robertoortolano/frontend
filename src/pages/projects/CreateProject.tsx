import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import api from "../../api/api";
import { useLocation, useNavigate } from "react-router-dom";
import { ProjectCreateDto } from "../../types/project.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";

interface CreateProjectProps {
  token?: string;
}

export default function CreateProject({ token: propToken }: CreateProjectProps) {
  const location = useLocation();
  const locationState = (location.state as any) || {};

  const [token, setToken] = useState(propToken || locationState.token || localStorage.getItem("token"));

  const [formData, setFormData] = useState<ProjectCreateDto>({
    key: "",
    name: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) setToken(localStorage.getItem("token"));
  }, [token]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateProject = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api.post(`http://localhost:8080/api/projects`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage("Progetto creato con successo!");
      setFormData({ key: "", name: "", description: "" });
      navigate("/projects", {
        state: { token },
      });
    } catch (err: any) {
      console.error("Errore durante la creazione del progetto", err);
      setError(err.response?.data?.message || "Error creating project. Please try again.");
    }
  };

  const handleBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    navigate("/projects", {
      state: { token },
    });
  };

  return (
    <div className={layout.container}>
      <h2 className={layout.title}>Crea un nuovo progetto</h2>

      <form onSubmit={handleCreateProject}>
        <div className={form.formGroup}>
          <label htmlFor="key" className={form.label}>
            Key
          </label>
          <input className={form.input} type="text" name="key" value={formData.key} onChange={handleChange} required />
        </div>
        <div className={form.formGroup}>
          <label htmlFor="name" className={form.label}>
            Name
          </label>
          <input
            className={form.input}
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className={form.formGroup}>
          <label htmlFor="description" className={form.label}>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={form.textarea}
          />
        </div>
        <div className={form.buttonGroup}>
          <button type="submit" className={`${buttons.button} flex-1`}>
            Crea
          </button>
          <button onClick={handleBackClick} className={`${buttons.button} ${buttons.secondary} flex-1`}>
            Annulla
          </button>
        </div>
      </form>

      {message && <div className={alert.success}>{message}</div>}
      {error && <div className={alert.error}>{error}</div>}
    </div>
  );
}

