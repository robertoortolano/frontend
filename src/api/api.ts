import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Aggiungi il token a ogni richiesta, se presente
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: Error) => Promise.reject(error)
);

// Gestisci errori globali, es. 401: logout automatico e redirect
api.interceptors.response.use(
  (response) => response,
  (error: Error) => {
    const status = (error as any).response?.status;
    
    if (status === 401) {
      // Token non valido o scaduto - logout completo e redirect immediato
      // Non propagare l'errore per evitare che venga mostrato il messaggio
      localStorage.removeItem("token");
      localStorage.removeItem("tenantId");
      // Redirect immediato senza mostrare errori
      window.location.href = "/";
      // Non reindirizzare l'errore per evitare che venga mostrato
      return Promise.resolve({ data: null }); // Resolve con un valore vuoto per evitare errori
    }
    
    if (status === 403) {
      // Permessi insufficienti - potrebbe essere cambiamento ruolo
      // Reindirizza a una pagina sicura accessibile
      const currentPath = window.location.pathname;
      
      // Se sei in una pagina tenant, vai alla home tenant
      if (currentPath.startsWith("/tenant")) {
        window.location.href = "/tenant";
        return Promise.reject(error);
      }
      
      // Se sei in una pagina progetto, vai alla home progetti
      if (currentPath.startsWith("/projects")) {
        window.location.href = "/projects";
        return Promise.reject(error);
      }
      
      // Fallback: vai alla selezione tenant
      window.location.href = "/tenant";
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Tenant API
export const tenantApi = {
  getTenants: () => api.get("/tenants"),
  createTenant: (data: any) => api.post("/auth/create-tenant", data)
};

export default api;


