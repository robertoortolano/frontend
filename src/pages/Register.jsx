// src/pages/Register.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { tenantApi } from "../api/api";
import TenantModal from "../components/TenantModal";
// Stili
import layout from "../styles/common/Layout.module.css";
import form from "../styles/common/Forms.module.css";
import button from "../styles/common/Buttons.module.css";
import alert from "../styles/common/Alerts.module.css";

export default function Register() {
  const navigate = useNavigate();
  const { token, setToken, setTenantId, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    licenseKey: "",
    subdomain: ""
  });
  const [message, setMessage] = useState({ text: "", type: "" });

  const fetchUserTenants = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching tenants...");
      const response = await tenantApi.getTenants();
      console.log("Tenants received:", response.data);
      setTenants(response.data);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      // If token is invalid, clear it and show login
      if (error.response?.status === 401) {
        logout();
        setIsLoggedIn(false);
        setMessage({
          text: "Sessione scaduta. Effettua nuovamente il login.",
          type: "error"
        });
      } else {
        setMessage({
          text: "Errore nel caricamento dei tenant. Riprova.",
          type: "error"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tenants when token is available
  useEffect(() => {
    if (token) {
      console.log("Token available, fetching tenants...");
      fetchUserTenants();
    } else {
      console.log("No token, showing login form");
      setIsLoggedIn(false);
      setTenants([]);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log("Attempting login with:", { username: formData.username });
      const response = await api.post("/auth/login", {
        username: formData.username,
        password: formData.password
      });
      console.log("Login response:", response.data);
      
      if (response.data.accessToken) {
        setToken(response.data.accessToken);
        setMessage({ text: "Login effettuato con successo!", type: "success" });
      } else {
        setMessage({
          text: "Errore: token non ricevuto dal server",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = error.response?.data?.message || "Credenziali non valide. Riprova.";
      setMessage({
        text: errorMessage,
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setTenants([]);
    setFormData({
      username: "",
      password: "",
      licenseKey: "",
      subdomain: ""
    });
    setMessage({ text: "", type: "" });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setMessage({
        text: "La password deve essere lunga almeno 6 caratteri",
        type: "error"
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/register", {
        username: formData.username,
        password: formData.password
      });
      setMessage({
        text: "Registrazione completata! Effettua il login.",
        type: "success"
      });
      setActiveTab("login");
    } catch (error) {
      console.error("Registration error:", error);
      setMessage({
        text: "Errore durante la registrazione. Riprova.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await tenantApi.createTenant({
        subdomain: formData.subdomain,
        licenseKey: formData.licenseKey
      });
      
      // Update token with tenant info and navigate directly
      if (response.data.token) {
        setToken(response.data.token);
        // The token now contains the tenantId, so we can navigate
        // Refresh tenants list first to get the new tenant
        const tenantsResponse = await tenantApi.getTenants();
        const newTenant = tenantsResponse.data.find(t => t.subdomain === response.data.subdomain);
        if (newTenant) {
          setTenantId(newTenant.id);
        }
        setShowTenantForm(false);
        setMessage({
          text: `Tenant creato con successo! Sottodominio: ${response.data.subdomain}`,
          type: "success"
        });
        setFormData(prev => ({ ...prev, name: "", subdomain: "", licenseKey: "" }));
        // Navigate to tenant home after a short delay to show success message
        setTimeout(() => navigate("/tenant"), 1000);
      }
    } catch (error) {
      console.error("Error creating tenant:", error);
      setMessage({
        text: error.response?.data?.message || "Errore nella creazione del tenant",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTenant = async (tenant) => {
    try {
      setIsLoading(true);
      // Call backend to get new token with tenantId
      const response = await api.post("/auth/select-tenant", {
        tenantId: tenant.id
      });
      
      if (response.data.token) {
        // Update token with the new one that includes tenantId
        setToken(response.data.token);
        setTenantId(tenant.id);
        navigate("/tenant");
      } else {
        setMessage({
          text: "Errore nella selezione del tenant",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error selecting tenant:", error);
      setMessage({
        text: error.response?.data?.Message || "Errore nella selezione del tenant",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render the login/register form
  const renderAuthForm = () => (
    <>
      <div style={{ 
        display: 'flex', 
        marginBottom: '2rem', 
        borderBottom: '1px solid #e5e7eb',
        justifyContent: 'center'
      }}>
        <button
          style={{
            flex: 1,
            padding: '0.75rem',
            border: 'none',
            background: 'transparent',
            fontSize: '1rem',
            fontWeight: activeTab === 'login' ? '600' : '400',
            color: activeTab === 'login' ? '#2563eb' : '#6b7280',
            borderBottom: activeTab === 'login' ? '2px solid #2563eb' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setActiveTab('login')}
        >
          Login
        </button>
        <button
          style={{
            flex: 1,
            padding: '0.75rem',
            border: 'none',
            background: 'transparent',
            fontSize: '1rem',
            fontWeight: activeTab === 'register' ? '600' : '400',
            color: activeTab === 'register' ? '#2563eb' : '#6b7280',
            borderBottom: activeTab === 'register' ? '2px solid #2563eb' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setActiveTab('register')}
        >
          Registrati
        </button>
      </div>

      {activeTab === 'login' ? (
        <form onSubmit={handleLogin}>
          <div className={form.formGroup}>
            <label className={form.label}>Username:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={form.input}
              required
            />
          </div>
          <div className={form.formGroup}>
            <label className={form.label}>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={form.input}
              required
            />
          </div>
          <button type="submit" className={`${button.primary} ${button.fullWidth}`} disabled={isLoading}>
            {isLoading ? "Caricamento..." : "Accedi"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <div className={form.formGroup}>
            <label className={form.label}>Username:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={form.input}
              required
            />
          </div>
          <div className={form.formGroup}>
            <label className={form.label}>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={form.input}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className={`${button.primary} ${button.fullWidth}`} disabled={isLoading}>
            {isLoading ? "Caricamento..." : "Registrati"}
          </button>
        </form>
      )}
    </>
  );

  // Render the tenant selection/creation screen
  const renderTenantScreen = () => {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>Seleziona un Tenant</h2>
          <button 
            onClick={handleLogout}
            className={button.secondary}
            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
          >
            Logout
          </button>
        </div>
        
        {isLoading ? (
          <p style={{ color: '#6b7280', margin: '2rem 0' }}>Caricamento tenant in corso...</p>
        ) : (
          <div>
            {tenants.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                {tenants.map(tenant => (
                  <div 
                    key={tenant.id} 
                    onClick={() => handleSelectTenant(tenant)}
                    style={{
                      padding: '1.25rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>
                      {tenant.name || tenant.subdomain}
                    </h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                      {tenant.subdomain}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', margin: '2rem 0' }}>
                Nessun tenant disponibile. Creane uno nuovo.
              </p>
            )}

            <button 
              onClick={() => setShowTenantForm(true)}
              className={`${button.secondary} ${button.fullWidth}`}
            >
              Crea un nuovo Tenant
            </button>
            
            <TenantModal
              show={showTenantForm}
              onClose={() => setShowTenantForm(false)}
              formData={formData}
              isLoading={isLoading}
              handleChange={handleChange}
              handleSubmit={handleCreateTenant}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={layout.container} style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      position: 'relative'
    }}>
      <div className={form.formContainer} style={{ 
        width: '100%',
        maxWidth: '500px',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        backgroundColor: 'white',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {!isLoggedIn ? (
          <>
            <h1 style={{ marginBottom: '2rem', color: '#1f2937' }}>Benvenuto</h1>
            {renderAuthForm()}
          </>
        ) : (
          renderTenantScreen()
        )}
        
        {message.text && (
          <div className={message.type === 'error' ? alert.error : alert.success} 
               style={{ marginTop: '1.5rem' }}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}