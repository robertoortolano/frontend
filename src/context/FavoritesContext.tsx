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
  
  const [favoriteProjects, setFavoriteProjects] = useState<FavoriteProject[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const refreshFavorites = async () => {
    if (!token) return;
    
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
      console.error("Errore toggle preferito:", err);
      throw err;
    }
  };

  useEffect(() => {
    refreshFavorites();
  }, [token]);

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






