import { FC } from 'react';
import { TransitionRemovalImpactDto } from '../types/transition-impact.types';
import {
  EnhancedImpactReportModal,
  EnhancedImpactReportModalBaseProps
} from './EnhancedImpactReportModal';
import { transitionImpactConfig } from './enhancedImpact/configs';

export type TransitionEnhancedImpactReportModalProps =
  EnhancedImpactReportModalBaseProps<TransitionRemovalImpactDto>;

export const TransitionEnhancedImpactReportModal: FC<TransitionEnhancedImpactReportModalProps> = (
  props
) => <EnhancedImpactReportModal {...props} config={transitionImpactConfig} />;
