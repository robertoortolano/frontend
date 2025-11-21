import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../api/api";
import { useAuth } from "./AuthContext";

interface FavoriteProject {
  id: number;
  name: string;
  key: string;
}

interface FavoritesContextType {
  favoriteProjects: FavoriteProject[];
  favoriteIds: Set<number>;
  refreshFavorites: () => Promise<void>;
  toggleFavorite: (projectId: number) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const auth = useAuth() as any;
  const token = auth?.token;
  const tenantId = auth?.tenantId;
  
  const [favoriteProjects, setFavoriteProjects] = useState<FavoriteProject[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const refreshFavorites = async () => {
    // Non fare la chiamata se non c'è il token o il tenantId non è ancora stato selezionato
    if (!token || !tenantId) {
      setFavoriteProjects([]);
      setFavoriteIds(new Set());
      return;
    }
    
    try {
      const response = await api.get("/projects/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavoriteProjects(response.data);
      setFavoriteIds(new Set(response.data.map((p: FavoriteProject) => p.id)));
    } catch (err) {
      console.error("Errore nel recupero preferiti:", err);
      setFavoriteProjects([]);
      setFavoriteIds(new Set());
    }
  };

  const toggleFavorite = async (projectId: number) => {
    const isFavorite = favoriteIds.has(projectId);
    
    try {
      if (isFavorite) {
        await api.delete(`/projects/${projectId}/favorite`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post(`/projects/${projectId}/favorite`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      
      // Aggiorna immediatamente
      await refreshFavorites();
    } catch (err: any) {
      // Se l'errore è "Project is already in favorites" o "Project is not in favorites",
      // significa che lo stato locale non è sincronizzato con il database
      // In questo caso, aggiorna i preferiti dal server per sincronizzare
      const errorMessage = err.response?.data?.message || err.message || '';
      if (errorMessage.includes('already in favorites') || errorMessage.includes('not in favorites')) {
        console.warn("Stato preferiti non sincronizzato, aggiornando dal server...");
        await refreshFavorites();
        // Non lanciare l'errore, perché abbiamo già sincronizzato lo stato
        return;
      }
      
      console.error("Errore toggle preferito:", err);
      throw err;
    }
  };

  useEffect(() => {
    refreshFavorites();
  }, [token, tenantId]);

  return (
    <FavoritesContext.Provider value={{ favoriteProjects, favoriteIds, refreshFavorites, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
























