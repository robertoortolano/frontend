/**
 * Funzioni di formattazione e costruzione righe per CSV
 */

export const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Formatta una transition secondo il formato richiesto:
 * - Con nome: <fromStatus> -> <toStatus> (<transitionName>)
 * - Senza nome: <fromStatus> -> <toStatus>
 */
export const formatTransition = (
  fromStatusName: string | null | undefined,
  toStatusName: string | null | undefined,
  transitionName: string | null | undefined
): string => {
  if (!fromStatusName || !toStatusName) return '';
  
  const from = escapeCSV(fromStatusName);
  const to = escapeCSV(toStatusName);
  const transition = transitionName ? escapeCSV(transitionName) : '';
  
  return transition 
    ? `${from} -> ${to} (${transition})`
    : `${from} -> ${to}`;
};

export interface CreateBaseRowParams {
  permissionName: string;
  itemTypeSetName: string;
  action: string;
  fieldName: string;
  statusName: string;
  transitionName: string;
  roleName: string;
  grant: string;
  userName: string;
  negatedUserName: string;
  groupName: string;
  negatedGroupName: string;
}

export const createBaseRow = ({
  permissionName,
  itemTypeSetName,
  action,
  fieldName,
  statusName,
  transitionName,
  roleName,
  grant,
  userName,
  negatedUserName,
  groupName,
  negatedGroupName
}: CreateBaseRowParams): string => {
  return [
    escapeCSV(permissionName),
    itemTypeSetName,
    action,
    fieldName,
    statusName,
    transitionName,
    escapeCSV(roleName),
    escapeCSV(grant),
    escapeCSV(userName),
    escapeCSV(negatedUserName),
    escapeCSV(groupName),
    escapeCSV(negatedGroupName)
  ].join(',');
};






