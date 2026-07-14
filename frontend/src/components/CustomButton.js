import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
// Note: We'll stick to simple views for now to avoid dependency issues if Expo LinearGradient isn't installed.
// If user wants gradients, we can add expo-linear-gradient later.
import { colors, spacing, shadows } from '../theme';

const CustomButton = ({ title, onPress, type = 'primary', disabled = false, style }) => {
    const getBackgroundColor = () => {
        if (disabled) return colors.border;
        if (type === 'primary') return colors.primary;
        if (type === 'secondary') return colors.secondary;
        return 'transparent';
    };

    const getTextColor = () => {
        if (disabled) return colors.textLight;
        if (type === 'outline') return colors.primary;
        return colors.surface;
    };

    const containerStyle = [
        styles.button,
        { backgroundColor: getBackgroundColor() },
        type === 'outline' && styles.outlineButton,
        type !== 'outline' && !disabled && styles.shadow,
        style,
    ];

    return (
        <TouchableOpacity
            style={containerStyle}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={disabled}
        >
            <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.l,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    outlineButton: {
        borderWidth: 2,
        borderColor: colors.primary,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    shadow: {
        ...shadows.small,
    },
});

export default CustomButton;
