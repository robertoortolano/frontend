import { useState, FormEvent, ChangeEvent, CSSProperties } from "react";
import api from "../api/api";
import { ProjectCreateDto } from "../types/project.types";

import buttons from "../styles/common/Buttons.module.css";
import form from "../styles/common/Forms.module.css";
import alert from "../styles/common/Alerts.module.css";

const modalStyle: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "2rem",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    maxHeight: "90vh",
    overflow: "auto",
  },
  title: {
    marginTop: 0,
    marginBottom: "1.5rem",
    color: "#1f2937",
    textAlign: "center",
  },
};

interface CreateProjectModalProps {
  token: string;
  onClose: () => void;
  onProjectCreated: () => void;
}

export default function CreateProjectModal({ token, onClose, onProjectCreated }: CreateProjectModalProps) {
  const [formData, setFormData] = useState<ProjectCreateDto>({
    key: "",
    name: "",
    description: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateProject = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await api.post("/projects", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      onProjectCreated();
      onClose();
    } catch (err: any) {
      console.error("Errore durante la creazione del progetto", err);
      setError(err.response?.data?.message || "Error creating project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={modalStyle.overlay}
      onClick={onClose}
      role="presentation"
    >
      <div 
        style={modalStyle.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h3 id="modal-title" style={modalStyle.title as CSSProperties}>Crea un nuovo progetto</h3>

        <form onSubmit={handleCreateProject}>
          <div className={form.formGroup}>
            <label htmlFor="key" className={form.label}>
              Key
            </label>
            <input 
              id="key"
              className={form.input} 
              type="text" 
              name="key" 
              value={formData.key} 
              onChange={handleChange} 
              required 
              disabled={loading}
            />
          </div>
          <div className={form.formGroup}>
            <label htmlFor="name" className={form.label}>
              Name
            </label>
            <input
              id="name"
              className={form.input}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className={form.formGroup}>
            <label htmlFor="description" className={form.label}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={form.textarea}
              disabled={loading}
            />
          </div>

          {error && <div className={alert.error}>{error}</div>}

          <div className={form.buttonGroup}>
            <button 
              type="button"
              onClick={onClose} 
              className={`${buttons.button} ${buttons.secondary}`}
              disabled={loading}
            >
              Annulla
            </button>
            <button 
              type="submit" 
              className={buttons.button}
              disabled={loading}
            >
              {loading ? "Creazione in corso..." : "Crea Progetto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

