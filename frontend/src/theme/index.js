export const colors = {
    primary: '#0F172A', // Deep Blue/Slate
    secondary: '#F97316', // Vibrant Orange
    background: '#F8FAFC', // Very Light Blue/Gray
    surface: '#FFFFFF',
    text: '#1E293B',
    textLight: '#64748B',
    border: '#E2E8F0',
    error: '#EF4444',
    success: '#22C55E',
    // Gradients (represented as array for LinearGradient)
    primaryGradient: ['#1E293B', '#0F172A'],
    secondaryGradient: ['#FB923C', '#F97316'],
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const typography = {
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    subheader: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    body: {
        fontSize: 16,
        color: colors.text,
    },
    caption: {
        fontSize: 14,
        color: colors.textLight,
    },
};

export const shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
};
