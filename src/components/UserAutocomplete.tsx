import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import api from "../api/api";

export interface UserOption {
  id: number;
  username: string;
  fullName?: string;
}

interface UserAutocompleteProps {
  selectedUsers: UserOption[];
  onAddUser: (user: UserOption) => void;
  onRemoveUser: (userId: number) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function UserAutocomplete({
  selectedUsers,
  onAddUser,
  onRemoveUser,
  label = "Utenti",
  placeholder = "Cerca utente per nome o email...",
  disabled = false,
}: UserAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Chiudi il dropdown quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ricerca utenti quando l'utente digita
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchTerm.length >= 1) {
        setIsLoading(true);
        try {
          const response = await api.get(`/users/search`, {
            params: { query: searchTerm },
          });
          
          // Filtra gli utenti già selezionati
          const filteredUsers = response.data.filter(
            (user: UserOption) => !selectedUsers.some((selected) => selected.id === user.id)
          );
          
          setSuggestions(filteredUsers);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Error searching users:", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce di 300ms

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedUsers]);

  const handleSelectUser = (user: UserOption) => {
    onAddUser(user);
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const getUserDisplayName = (user: UserOption) => {
    return user.fullName || user.username;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Label */}
      <label className="block text-base font-bold text-blue-900">{label}</label>

      {/* Conteggio utenti selezionati */}
      {selectedUsers.length > 0 && (
        <div className="text-sm font-semibold text-gray-700">
          {selectedUsers.length} {selectedUsers.length === 1 ? "utente selezionato" : "utenti selezionati"}
        </div>
      )}

      {/* Search Input - PIÙ GRANDE E EVIDENTE */}
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600" size={22} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm.length >= 1 && setShowSuggestions(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full pl-12 pr-12 py-3.5 text-base border-2 border-blue-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed hover:border-blue-400 transition-colors"
            style={{ fontSize: '1rem' }}
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white border-2 border-blue-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {suggestions.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelectUser(user)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none"
              >
                <div className="font-medium text-gray-900 text-base">{getUserDisplayName(user)}</div>
                {user.fullName && user.username !== user.fullName && (
                  <div className="text-sm text-gray-500">{user.username}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {showSuggestions && !isLoading && searchTerm.length >= 1 && suggestions.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
            Nessun utente trovato
          </div>
        )}
      </div>

      {/* Selected Users List - One per row */}
      {selectedUsers.length > 0 && (
        <div style={{ marginTop: '28px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '8px',
                  paddingLeft: '12px',
                  paddingRight: '4px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  borderRadius: '9999px',
                  maxWidth: 'fit-content',
                }}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors group"
              >
                <span className="text-sm font-medium text-blue-900">
                  {getUserDisplayName(user)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveUser(user.id)}
                  disabled={disabled}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 150ms',
                  }}
                  className="bg-blue-200 hover:bg-red-500 text-blue-700 hover:text-white disabled:opacity-50"
                  title={`Rimuovi ${getUserDisplayName(user)}`}
                  aria-label={`Rimuovi ${getUserDisplayName(user)}`}
                  onMouseEnter={(e) => {
                    if (!disabled) {
                      e.currentTarget.style.backgroundColor = '#ef4444';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled) {
                      e.currentTarget.style.backgroundColor = '#bfdbfe';
                      e.currentTarget.style.color = '#1e3a8a';
                    }
                  }}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

