/** Shared y-axis labels for chart time series (economics rail, SaaS). */

export function formatChartY(value: number, unit: string): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (unit === 'percent') return `${sign}${abs.toFixed(1)}%`;
  if (unit === 'index') return `${sign}${abs.toFixed(0)}`;
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) {
    const billions = abs / 1e9;
    return `${sign}$${billions >= 100 ? billions.toFixed(0) : billions.toFixed(1)}B`;
  }
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(0)}M`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatChartX(date: string, first: string, last: string): string {
  const span = (Date.parse(`${last}T12:00:00Z`) - Date.parse(`${first}T12:00:00Z`)) / 86400000;
  if (!Number.isFinite(span) || span > 500) return date.slice(0, 4);
  if (span > 40) return date.slice(0, 7);
  return date.slice(5);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatChartAsOf(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
