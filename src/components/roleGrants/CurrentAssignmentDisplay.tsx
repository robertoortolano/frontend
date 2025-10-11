import { Shield, Users, ShieldOff, Trash2 } from 'lucide-react';
import layout from '../../styles/common/Layout.module.css';
import buttons from '../../styles/common/Buttons.module.css';

interface CurrentAssignment {
  assignmentType: 'GRANT' | 'ROLE' | 'GRANTS' | 'NONE';
  grantName?: string;
  roleTemplateName?: string;
}

interface CurrentAssignmentDisplayProps {
  currentAssignment: CurrentAssignment | null;
  grantsCount: number;
  onRemove: () => void;
}

export default function CurrentAssignmentDisplay({
  currentAssignment,
  grantsCount,
  onRemove
}: CurrentAssignmentDisplayProps) {
  if (!currentAssignment) return null;

  return (
    <div className={layout.block}>
      <h3 className={layout.blockTitleBlue}>Assegnazione Corrente</h3>
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        {currentAssignment.assignmentType === 'GRANT' && currentAssignment.grantName && (
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            <span className="font-medium">Grant: {currentAssignment.grantName}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">GRANT</span>
          </div>
        )}
        
        {currentAssignment.assignmentType === 'ROLE' && currentAssignment.roleTemplateName && (
          <div className="flex items-center gap-2">
            <Users size={20} className="text-green-600" />
            <span className="font-medium">Role: {currentAssignment.roleTemplateName}</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">ROLE</span>
          </div>
        )}
        
        {currentAssignment.assignmentType === 'GRANTS' && grantsCount > 0 && (
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-purple-600" />
            <span className="font-medium">{grantsCount} Grants associati</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">GRANTS</span>
          </div>
        )}
        
        {currentAssignment.assignmentType === 'NONE' && (
          <div className="flex items-center gap-2">
            <ShieldOff size={20} className="text-gray-400" />
            <span className="font-medium text-gray-500">Nessuna assegnazione</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">NONE</span>
          </div>
        )}
        
        {currentAssignment.assignmentType !== 'NONE' && (
          <button
            onClick={onRemove}
            className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonDanger} ml-auto`}
          >
            <Trash2 size={16} className="mr-1" />
            Rimuovi
          </button>
        )}
      </div>
    </div>
  );
}


