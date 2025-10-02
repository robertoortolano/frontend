import React, { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // <== Assicurati di averlo
import '../styles/globals.css';

export default function Register() {
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    licenseKey: "",
    subdomain: ""
  });
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate();
  const { token, tenantId, setToken, setTenantId, logout } = useAuth();

  const handleTenantRedirect = () => {
    navigate("/tenant", {
      state: { token, tenantId }
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", {
        username: formData.username,
        password: formData.password
      });

      const { accessToken, tenantId } = response.data;
      setToken(accessToken);
      setTenantId(tenantId || null);

      setMessage({ text: "Login effettuato con successo!", type: "success" });
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Errore durante il login",
        type: "error"
      });
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      logout(); // <- pulizia centralizzata
      setMessage({ text: "Logout effettuato con successo", type: "success" });
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Errore durante il logout",
        type: "error"
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", {
        username: formData.username,
        password: formData.password
      });

      setMessage({
        text: "Registrazione avvenuta con successo! Effettua il login.",
        type: "success"
      });
      setActiveTab("login");
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Errore durante la registrazione",
        type: "error"
      });
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/create-tenant", {
        licenseKey: formData.licenseKey.trim(),
        subdomain: formData.subdomain.trim()
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const { token: newToken, subdomain } = response.data;
      if (newToken) setToken(newToken);

      setMessage({
        text: `Tenant creato con successo! Sottodominio: ${subdomain}`,
        type: "success"
      });
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Errore durante la creazione del tenant",
        type: "error"
      });
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case "login":
        return (
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" name="username" value={formData.username} onChange={handleChange} required />
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            <button type="submit">Login</button>
          </form>
        );

      case "register":
        return (
          <form onSubmit={handleRegister} className="space-y-4">
            <input type="email" name="username" value={formData.username} onChange={handleChange} required />
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            <button type="submit">Registrati</button>
          </form>
        );

      case "tenant":
        return (
          <form onSubmit={handleCreateTenant} className="space-y-4">
            <input type="text" name="licenseKey" value={formData.licenseKey} onChange={handleChange} required />
            <input type="text" name="subdomain" value={formData.subdomain} onChange={handleChange} required />
            <button type="submit">Crea Tenant</button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex border-b">
          <button onClick={() => setActiveTab("login")}>Login</button>
          {token ? (
            <>
              <button onClick={handleLogout}>Logout</button>
              <button onClick={() => setActiveTab("tenant")}>Crea Tenant</button>
              <button onClick={handleTenantRedirect} disabled={!tenantId}>Go to Tenant</button>
            </>
          ) : (
            <button onClick={() => setActiveTab("register")}>Registrati</button>
          )}
        </div>
        <div className="p-6">
          {renderForm()}
          {message.text && (
            <div className={`mt-4 p-3 rounded ${message.type === "success" ? "bg-green-100" : "bg-red-100"}`}>
              {message.text}
            </div>
          )}
          {token && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded">
              Sei autenticato come: {formData.username || "utente"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
