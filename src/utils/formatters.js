/**
 * Standard USD currency formatter
 */
export function formatCurrency(value) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(number);
}

/**
 * Standard POS receipt timestamp formatter (e.g. 10/02/2026, 11:32:05 AM)
 */
export function formatDateTime(date = new Date()) {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * POS Clock time (e.g. 11:32:05 AM)
 */
export function formatTime(date = new Date()) {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}
