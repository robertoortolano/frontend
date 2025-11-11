import { FC } from 'react';
import { StatusRemovalImpactDto } from '../types/status-impact.types';
import {
  EnhancedImpactReportModal,
  EnhancedImpactReportModalBaseProps
} from './EnhancedImpactReportModal';
import { statusImpactConfig } from './enhancedImpact/configs';

export type StatusEnhancedImpactReportModalProps =
  EnhancedImpactReportModalBaseProps<StatusRemovalImpactDto>;

export const StatusEnhancedImpactReportModal: FC<StatusEnhancedImpactReportModalProps> = (props) => (
  <EnhancedImpactReportModal {...props} config={statusImpactConfig} />
);
