import { FC } from 'react';
import { ItemTypeConfigurationRemovalImpactDto } from '../types/itemtypeconfiguration-impact.types';
import {
  EnhancedImpactReportModal,
  EnhancedImpactReportModalBaseProps
} from './EnhancedImpactReportModal';
import { itemTypeConfigurationImpactConfig } from './enhancedImpact/configs';

export type ItemTypeConfigurationEnhancedImpactReportModalProps =
  EnhancedImpactReportModalBaseProps<ItemTypeConfigurationRemovalImpactDto>;

export const ItemTypeConfigurationEnhancedImpactReportModal: FC<
  ItemTypeConfigurationEnhancedImpactReportModalProps
> = (props) => (
  <EnhancedImpactReportModal {...props} config={itemTypeConfigurationImpactConfig} />
);
