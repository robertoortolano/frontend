import { Panel } from "../../../components/shared/layout";
import table from "../../../styles/common/Tables.module.css";
import layout from "../../../styles/common/Layout.module.css";
import alert from "../../../styles/common/Alerts.module.css";

interface ItemTypeSetInfoProps {
  itemTypeSet: any;
  title: string;
  panelOverrides?: { className?: string; headingLevel?: "h2" | "h3" | "h4" };
}

export function ItemTypeSetInfo({ itemTypeSet, title, panelOverrides }: ItemTypeSetInfoProps) {
  const hasEntries = itemTypeSet.itemTypeConfigurations?.length > 0;

  return (
    <Panel
      title={title}
      headingLevel={panelOverrides?.headingLevel ?? "h3"}
      className={panelOverrides?.className}
      bodyClassName="space-y-3"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p>
            <strong>Name:</strong> {itemTypeSet.name}
          </p>
          <p>
            <strong>Global:</strong> {itemTypeSet.scope === "TENANT" ? "Yes" : "No"}
          </p>
        </div>
        <div>
          <p>
            <strong>Configurazioni:</strong>{" "}
            {itemTypeSet.itemTypeConfigurations?.length || 0}
          </p>
          {itemTypeSet.defaultItemTypeSet && (
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
              Default
            </span>
          )}
        </div>
      </div>

      {hasEntries ? (
        <table className={`${table.table} ${layout.mt4}`}>
          <thead>
            <tr>
              <th>Item Type</th>
              <th>Categoria</th>
              <th>Workflow</th>
              <th>Field Set</th>
            </tr>
          </thead>
          <tbody>
            {itemTypeSet.itemTypeConfigurations.map((config: any) => (
              <tr key={config.id}>
                <td>{config.itemType?.name || "N/A"}</td>
                <td>{config.category}</td>
                <td>{config.workflow?.name || "-"}</td>
                <td>{config.fieldSet?.name || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={alert.muted}>No entries in this set.</p>
      )}
    </Panel>
  );
}







