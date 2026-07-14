import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors, shadows, spacing } from '../theme';

const Card = ({ children, onPress, style }) => {
    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            style={[styles.card, style]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            {children}
        </Container>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.m,
        marginBottom: spacing.m,
        ...shadows.medium,
    },
});

export default Card;
