/**
 * Utility function to format count labels for popup triggers and other UI elements.
 * 
 * @param count - The number of items
 * @param singular - The singular form of the label (e.g., "workflow", "configurazione")
 * @param plural - Optional plural form. If not provided, defaults to singular + "s"
 * @returns Formatted string like "1 workflow" or "5 workflows" or "2 configurazioni"
 * 
 * @example
 * formatCountLabel(1, 'workflow') // "1 workflow"
 * formatCountLabel(5, 'workflow') // "5 workflows"
 * formatCountLabel(2, 'configurazione', 'configurazioni') // "2 configurazioni"
 * formatCountLabel(0, 'option') // "0 options"
 */
export function formatCountLabel(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural || `${singular}s`}`;
}

