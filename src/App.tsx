import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { ToastProvider } from "./context/ToastContext";

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}

