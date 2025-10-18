import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <AppRoutes />
      </FavoritesProvider>
    </AuthProvider>
  );
}

