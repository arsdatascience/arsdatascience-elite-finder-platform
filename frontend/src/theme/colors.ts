export const COLORS = {
    primary: {
        main: '#7b8c93',
        light: '#8c9da4',
        dark: '#63737a',
        contrastText: '#ffffff'
    },
    secondary: {
        main: '#64748b',
        light: '#94a3b8',
        dark: '#475569',
        contrastText: '#ffffff'
    },
    status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    },
    background: {
        default: '#f8fafc',
        paper: '#ffffff',
        dark: '#0f172a'
    },
    text: {
        primary: '#1e293b',
        secondary: '#64748b',
        disabled: '#94a3b8'
    }
};

// Chart Colors aligned with the theme
export const CHART_COLORS = [
    COLORS.primary.main,
    COLORS.secondary.main,
    COLORS.status.success,
    COLORS.status.warning,
    COLORS.status.error
];

// Helper to get Tailwind-like class name (if needed for utility generation)
export const getSemanticClass = (color: keyof typeof COLORS, variant: string = 'main') => {
    return `text-${color}-${variant}`;
};
