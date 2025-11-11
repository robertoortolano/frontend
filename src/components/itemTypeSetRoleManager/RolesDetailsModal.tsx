import { MouseEvent } from "react";

interface RolesDetailsState {
  permissionName: string;
  roles: string[];
}

interface RolesDetailsModalProps {
  details: RolesDetailsState | null;
  onClose: () => void;
}

export const RolesDetailsModal = ({
  details,
  onClose,
}: RolesDetailsModalProps) => {
  if (!details) {
    return null;
  }

  const handleOverlayClick = () => {
    onClose();
  };

  const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const roles = details.roles || [];

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10001,
      }}
    >
      <div
        onClick={handleContentClick}
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            marginBottom: "16px",
          }}
        >
          Dettagli Ruoli - {details.permissionName}
        </h2>

        {roles.length > 0 ? (
          <div>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              Ruoli Assegnati ({roles.length})
            </h3>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {roles.map((role, index) => (
                <span
                  key={`${role}-${index}`}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#dbeafe",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#6b7280",
            }}
          >
            Nessun ruolo assegnato
          </div>
        )}

        <div
          style={{
            marginTop: "24px",
            textAlign: "right",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "600",
            }}
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};


