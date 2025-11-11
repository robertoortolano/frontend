import { ChangeEvent } from "react";
import { Panel } from "../../../components/shared/layout";
import table from "../../../styles/common/Tables.module.css";
import buttons from "../../../styles/common/Buttons.module.css";
import form from "../../../styles/common/Forms.module.css";
import alert from "../../../styles/common/Alerts.module.css";

interface WorkflowTransitionsTabProps {
  edges: any[];
  nodes: any[];
  onEdgeLabelChange: (edgeId: string, newLabel: string) => void;
  onEdgeDelete: (edgeId: string) => void;
}

export function WorkflowTransitionsTab({
  edges,
  nodes,
  onEdgeLabelChange,
  onEdgeDelete,
}: WorkflowTransitionsTabProps) {
  const transitions = edges.map((edge) => {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);

    return {
      id: edge.id,
      label: edge.data?.label ?? "",
      from: sourceNode?.data?.label ?? edge.source,
      to: targetNode?.data?.label ?? edge.target,
      persisted: Boolean(edge.data?.transitionId),
    };
  });

  const handleLabelChange = (edgeId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    onEdgeLabelChange(edgeId, event.target.value);
  };

  return (
    <Panel
      title="Transizioni"
      description="Gestisci le transizioni create nel workflow. Le modifiche vengono salvate insieme al workflow."
      bodyClassName="space-y-4"
    >
      {transitions.length === 0 ? (
        <p className={alert.muted}>Nessuna transizione definita. Aggiungine una dal tab Stati collegando due nodi.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className={table.table}>
            <thead>
              <tr>
                <th>Origine</th>
                <th>Destinazione</th>
                <th>Nome</th>
                <th>Stato</th>
                <th className="w-24 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {transitions.map((transition) => (
                <tr key={transition.id}>
                  <td>{transition.from}</td>
                  <td>{transition.to}</td>
                  <td>
                    <input
                      type="text"
                      className={form.input}
                      value={transition.label}
                      placeholder="Nome transizione"
                      onChange={handleLabelChange(transition.id)}
                    />
                  </td>
                  <td>
                    <span className={transition.persisted ? "text-green-600" : "text-blue-600"}>
                      {transition.persisted ? "Esistente" : "Nuova"}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      className={`${buttons.button} ${buttons.buttonSecondary}`}
                      type="button"
                      onClick={() => onEdgeDelete(transition.id)}
                    >
                      Rimuovi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}


