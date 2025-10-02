import React, { useEffect, useState } from "react";
import api from "../api/api";
import { Link } from "react-router-dom";
import layout from "../styles/common/Layout.module.css";
import table from "../styles/common/Tables.module.css";
import alert from "../styles/common/Alerts.module.css";

import { useAuth } from "../context/AuthContext"; // 👈 importa hook dal context

export default function HomeProjects() {
  const { token } = useAuth(); // 👈 prendi il token dal context

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get("/projects/by-user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(response.data);
      } catch (err) {
        console.error("Errore nel recupero progetti:", err);
        setError(err.response?.data?.message || "Errore nel recupero progetti.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProjects();
  }, [token]);

  let content;

  if (loading) {
    content = <p className={layout.loading}>Loading...</p>;
  } else if (error) {
    content = <p className={alert.error}>{error}</p>;
  } else if (projects.length === 0) {
    content = <p className={layout.loading}>No project found.</p>;
  } else {
    content = (
      <table className={table.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Key</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((proj) => (
            <tr key={proj.id}>
              <td>
                <Link to={`/projects/${proj.id}`} className={layout.link}>
                  {proj.name}
                </Link>
              </td>
              <td>
                <Link to={`/projects/${proj.id}`} className={layout.link}>
                  {proj.key}
                </Link>
              </td>
              <td>{proj.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className={layout.container}>
      <h2 className={layout.title}>Projects</h2>
      {content}
    </div>
  );
}
