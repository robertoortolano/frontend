/**
 * Componente riutilizzabile per il badge "Default"
 * Utilizzato nei popup per indicare elementi di default (workflow, ItemTypeSet, ecc.)
 */
export default function DefaultBadge() {
  return (
    <span
      style={{
        fontSize: "0.625rem",
        padding: "0.125rem 0.375rem",
        backgroundColor: "#dbeafe",
        color: "#1e40af",
        borderRadius: "0.25rem",
        fontWeight: "500",
      }}
    >
      Default
    </span>
  );
}

