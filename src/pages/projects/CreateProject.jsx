import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { useLocation, useNavigate } from "react-router-dom";
import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";

export default function CreateProject({ token: propToken }) {

  const location = useLocation();
  const locationState = location.state || {};

  const [token, setToken] = useState(
    propToken || locationState.token || localStorage.getItem("token")
  );

  const [formData, setFormData] = useState({
    key: "",
    name: "",
    description: "",
  });

  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) setToken(localStorage.getItem("token"));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        `http://localhost:8080/api/projects`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage("Progetto creato con successo!");
      setFormData({ key: "", name: "", description: "" });
      navigate("/projects", {
        state: { token }
      });
    } catch (err) {
      setMessage(
        console.error("Errore durante la creazione del progetto" + err)
      );

      setError(
        err.response?.data?.message || "Error creating item type. Please try again."
      );

    }
  };

  const handleBackClick = (e) => {
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
          <label htmlFor="key" className={form.label}>Key</label>
          <input
            className={form.input}
            type="text"
            name="key"
            value={formData.key}
            onChange={handleChange}
            required
          />
        </div>
        <div className={form.formGroup}>
          <label htmlFor="name" className={form.label}>Key</label>
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
          <label htmlFor="description" className={form.label}>Description</label>
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

      {message && (
        <div className={alert.success}>
          {message}
        </div>
      )}
    </div>
  );
}

CreateProject.propTypes = {
  token: PropTypes.string,
};

