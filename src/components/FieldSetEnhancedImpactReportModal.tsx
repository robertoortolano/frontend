import { FC } from 'react';
import { FieldSetRemovalImpactDto } from '../types/fieldset-impact.types';
import {
  EnhancedImpactReportModal,
  EnhancedImpactReportModalBaseProps
} from './EnhancedImpactReportModal';
import { fieldSetImpactConfig } from './enhancedImpact/configs';

export type FieldSetEnhancedImpactReportModalProps =
  EnhancedImpactReportModalBaseProps<FieldSetRemovalImpactDto>;

export const FieldSetEnhancedImpactReportModal: FC<FieldSetEnhancedImpactReportModalProps> = (
  props
) => <EnhancedImpactReportModal {...props} config={fieldSetImpactConfig} />;


