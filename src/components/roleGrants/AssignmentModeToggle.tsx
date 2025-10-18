import { Shield, Users } from 'lucide-react';
import layout from '../../styles/common/Layout.module.css';
import buttons from '../../styles/common/Buttons.module.css';

interface AssignmentModeToggleProps {
  mode: 'GRANT' | 'ROLE';
  onModeChange: (mode: 'GRANT' | 'ROLE') => void;
}

export default function AssignmentModeToggle({
  mode,
  onModeChange
}: Readonly<AssignmentModeToggleProps>) {
  return (
    <div className={layout.block}>
      <h3 className={layout.blockTitleBlue}>Modalità Assegnazione</h3>
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => onModeChange('GRANT')}
          className={`${buttons.button} ${buttons.buttonSmall} ${
            mode === 'GRANT' ? buttons.buttonPrimary : buttons.buttonSecondary
          }`}
        >
          <Shield size={16} className="mr-2" />
          Grant Diretto
        </button>
        <button
          onClick={() => onModeChange('ROLE')}
          className={`${buttons.button} ${buttons.buttonSmall} ${
            mode === 'ROLE' ? buttons.buttonPrimary : buttons.buttonSecondary
          }`}
        >
          <Users size={16} className="mr-2" />
          Role Template
        </button>
      </div>
    </div>
  );
}


