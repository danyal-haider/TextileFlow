import React, { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import CustomButton from '../components/CustomButton';
import { colors, spacing, shadows } from '../theme';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('exporter');

    const { register, isLoading } = useContext(AuthContext);

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join Textile Flow today</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="John Doe"
                                placeholderTextColor="#94A3B8"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="name@example.com"
                                placeholderTextColor="#94A3B8"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Min 8 characters"
                                placeholderTextColor="#94A3B8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.roleContainer}>
                            <Text style={styles.inputLabel}>I am a...</Text>
                            <View style={styles.roleSelector}>
                                <TouchableOpacity
                                    style={[styles.roleButton, role === 'exporter' && styles.roleButtonActive]}
                                    onPress={() => setRole('exporter')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.roleText, role === 'exporter' && styles.roleTextActive]}>Exporter</Text>
                                </TouchableOpacity>
                                <View style={{ width: spacing.m }} />
                                <TouchableOpacity
                                    style={[styles.roleButton, role === 'manufacturer' && styles.roleButtonActive]}
                                    onPress={() => setRole('manufacturer')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.roleText, role === 'manufacturer' && styles.roleTextActive]}>Manufacturer</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <CustomButton
                            title={isLoading ? "Creating Account..." : "Register"}
                            onPress={() => register(name, email, password, role)}
                            disabled={isLoading}
                            style={styles.registerButton}
                        />
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.loginText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.l,
    },
    headerContainer: {
        marginBottom: spacing.xl,
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textLight,
    },
    formContainer: {
        marginBottom: spacing.l,
    },
    inputContainer: {
        marginBottom: spacing.m,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.s,
        marginLeft: 4,
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.m,
        fontSize: 16,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.small,
    },
    roleContainer: {
        marginBottom: spacing.l,
        marginTop: spacing.s,
    },
    roleSelector: {
        flexDirection: 'row',
        // Removed gap for better compatibility
    },
    roleButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    roleButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        ...shadows.small,
    },
    roleText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textLight,
    },
    roleTextActive: {
        color: '#FFFFFF',
    },
    registerButton: {
        marginTop: spacing.m,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    footerText: {
        color: colors.textLight,
        fontSize: 15,
    },
    loginText: {
        color: colors.secondary,
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default RegisterScreen;
