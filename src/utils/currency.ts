/**
 * Formats a currency value to whole integer with thousands separator.
 * e.g. 717.1 -> "HK$ 717"
 * e.g. 16666.7 -> "HK$ 16,667"
 */
export const formatCurrency = (val: number): string => {
  if (isNaN(val) || !isFinite(val)) return 'HK$ 0';
  return 'HK$ ' + Math.round(val).toLocaleString();
};

/**
 * Formats an hourly rate to whole integer with thousands separator.
 * e.g. 717.1 -> "HK$ 717 / h"
 * e.g. 16666.7 -> "HK$ 16,667 / h"
 */
export const formatHourlyRate = (val: number): string => {
  if (isNaN(val) || !isFinite(val)) return 'HK$ 0 / h';
  return `${formatCurrency(val)} / h`;
};
