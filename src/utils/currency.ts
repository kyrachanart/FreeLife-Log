export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'HKD', symbol: 'HK$', name: 'HKD (港幣 HK$)' },
  { code: 'USD', symbol: '$', name: 'USD (美元 $)' },
  { code: 'TWD', symbol: 'NT$', name: 'TWD (新台幣 NT$)' },
  { code: 'EUR', symbol: '€', name: 'EUR (歐元 €)' },
  { code: 'GBP', symbol: '£', name: 'GBP (英鎊 £)' },
  { code: 'JPY', symbol: '¥', name: 'JPY (日圓 ¥)' },
  { code: 'CAD', symbol: 'CA$', name: 'CAD (加幣 CA$)' },
  { code: 'AUD', symbol: 'AU$', name: 'AUD (澳幣 AU$)' },
  { code: 'SGD', symbol: 'SG$', name: 'SGD (新加坡幣 SG$)' },
  { code: 'CNY', symbol: '¥', name: 'CNY (人民幣 ¥)' },
];

export const DEFAULT_CURRENCY = 'HKD';

/**
 * Returns the currency symbol for a given currency code.
 * e.g. "HKD" -> "HK$"
 * e.g. "USD" -> "$"
 * e.g. "TWD" -> "NT$"
 */
export const getCurrencySymbol = (currencyCode?: string): string => {
  if (!currencyCode) return 'HK$';
  const match = SUPPORTED_CURRENCIES.find(
    (c) => c.code.toUpperCase() === currencyCode.trim().toUpperCase()
  );
  if (match) return match.symbol;
  return currencyCode.trim();
};

/**
 * Formats a currency value to whole integer with thousands separator and currency symbol.
 * e.g. (717.1, 'HKD') -> "HK$ 717"
 * e.g. (16666.7, 'USD') -> "$ 16,667"
 * e.g. (5000, 'TWD') -> "NT$ 5,000"
 */
export const formatCurrency = (val: number, currencyCode: string = 'HKD'): string => {
  const symbol = getCurrencySymbol(currencyCode);
  if (isNaN(val) || !isFinite(val)) return `${symbol} 0`;
  return `${symbol} ${Math.round(val).toLocaleString()}`;
};

/**
 * Formats an hourly rate to whole integer with thousands separator.
 * e.g. (717.1, 'HKD') -> "HK$ 717 / h"
 * e.g. (150, 'USD') -> "$ 150 / h"
 */
export const formatHourlyRate = (val: number, currencyCode: string = 'HKD'): string => {
  if (isNaN(val) || !isFinite(val)) return `${getCurrencySymbol(currencyCode)} 0 / h`;
  return `${formatCurrency(val, currencyCode)} / h`;
};

