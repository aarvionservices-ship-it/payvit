
/**
 * Formats a number as per Indian Currency (INR) standards.
 * Example: 100000 -> ₹ 1,00,000
 */
export const formatCurrency = (amount: number | string, includeSymbol = true): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return includeSymbol ? '₹ 0' : '0';

  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });

  return includeSymbol ? `₹ ${formatted}` : formatted;
};

/**
 * Formats a number into a shorter version with L (Lakhs) or Cr (Crores).
 * Example: 100000 -> 1 L, 10000000 -> 1 Cr
 */
export const formatCompactNumber = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';

  if (num >= 10000000) {
    return (num / 10000000).toFixed(num % 10000000 === 0 ? 0 : 1) + ' Cr';
  }
  if (num >= 100000) {
    return (num / 100000).toFixed(num % 100000 === 0 ? 0 : 1) + ' L';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + ' K';
  }
  return num.toString();
};
