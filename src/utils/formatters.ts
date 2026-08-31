/**
 * Formateador de moneda oficial para República Dominicana (DOP / RD$)
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'RD$ 0.00';
  
  const formatted = new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return `RD$ ${formatted}`;
}

/**
 * Formateador de cantidades con unidades
 */
export function formatUnit(amount: number, unit: string): string {
  if (isNaN(amount)) return `0 ${unit}`;

  if (unit === 'g') {
    if (amount >= 1000) {
      const kg = amount / 1000;
      return `${kg % 1 === 0 ? kg : kg.toFixed(2)} kg (${amount.toLocaleString('es-DO')} g)`;
    }
    return `${amount % 1 === 0 ? amount : amount.toFixed(1)} g`;
  }

  if (unit === 'ml') {
    if (amount >= 1000) {
      const l = amount / 1000;
      return `${l % 1 === 0 ? l : l.toFixed(2)} L (${amount.toLocaleString('es-DO')} ml)`;
    }
    return `${amount % 1 === 0 ? amount : amount.toFixed(1)} ml`;
  }

  if (unit === 'ud') {
    return `${amount % 1 === 0 ? amount : amount.toFixed(1)} ud${amount > 1 ? 's' : ''}`;
  }

  return `${amount} ${unit}`;
}

/**
 * Formateador de fechas elegante en español (República Dominicana / Caribe)
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Sin fecha';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString('es-DO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return dateString;
  } catch {
    return dateString;
  }
}

/**
 * Formateador de porcentajes
 */
export function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  return `${value % 1 === 0 ? value : value.toFixed(1)}%`;
}
