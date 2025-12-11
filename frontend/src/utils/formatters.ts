/**
 * Formats a number as a currency string using pt-BR locale (BRL).
 * Example: 1234.56 -> "R$ 1.234,56"
 */
export const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

/**
 * Formats a number using pt-BR locale for standard decimal/thousand separators.
 * Example: 1234.56 -> "1.234,56"
 */
export const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('pt-BR').format(value);
};
