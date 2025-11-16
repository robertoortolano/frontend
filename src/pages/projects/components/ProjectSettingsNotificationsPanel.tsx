import { Panel } from "../../../components/shared/layout";
import alert from "../../../styles/common/Alerts.module.css";
import buttons from "../../../styles/common/Buttons.module.css";

export interface ProjectNotificationChannel {
  id: string;
  name: string;
  target?: string;
  enabled: boolean;
  type?: string;
}

interface ProjectSettingsNotificationsPanelProps {
  notifications?: ProjectNotificationChannel[];
  onConfigure?: () => void;
}

export function ProjectSettingsNotificationsPanel({
  notifications = [],
  onConfigure,
}: ProjectSettingsNotificationsPanelProps) {
  const hasNotifications = notifications.length > 0;

  return (
    <Panel
      title="Notifiche"
      description="Configura gli avvisi per tenere il team aggiornato sui cambiamenti principali."
      bodyClassName="space-y-4"
    >
      {hasNotifications ? (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <li key={notification.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <div>
                <p className="font-medium">{notification.name}</p>
                {notification.target && (
                  <p className="text-sm text-gray-500">{notification.target}</p>
                )}
                {notification.type && (
                  <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    {notification.type}
                  </span>
                )}
              </div>
              <span className={`text-sm font-semibold ${notification.enabled ? "text-emerald-600" : "text-gray-400"}`}>
                {notification.enabled ? "Attivo" : "Disattivato"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={alert.muted}>
          Nessuna notifica configurata. Puoi attivarle per ricevere email o messaggi su modifiche rilevanti del progetto.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className={`${buttons.button} ${buttons.buttonSecondary}`}
          onClick={onConfigure}
        >
          {hasNotifications ? "Gestisci notifiche" : "Configura notifiche"}
        </button>
      </div>
    </Panel>
  );
}














