import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Aggiungi il token a ogni richiesta, se presente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Gestisci errori globali, es. 401: logout automatico e redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/"; // o "/login" a seconda del tuo routing
    }
    return Promise.reject(error);
  }
);

// Tenant API
export const tenantApi = {
  getTenants: () => api.get("/tenants"),
  createTenant: (data) => api.post("/auth/create-tenant", data)
};

export default api;
