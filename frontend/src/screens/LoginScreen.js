import React, { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import CustomButton from '../components/CustomButton';
import { colors, spacing, typography, shadows } from '../theme';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hidePassword, setHidePassword] = useState(true);
    const { login, isLoading } = useContext(AuthContext);

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.content}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="manufacturer@example.com"
                            placeholderTextColor="#94A3B8"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.passwordWrapper}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="********"
                                placeholderTextColor="#94A3B8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={hidePassword}
                            />
                            <TouchableOpacity 
                                onPress={() => setHidePassword(!hidePassword)}
                                style={styles.showHideButton}
                                activeOpacity={0.7}
                            >
                                <Ionicons 
                                    name={hidePassword ? "eye-off" : "eye"} 
                                    size={22} 
                                    color={colors.textLight} 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <CustomButton
                        title={isLoading ? "Signing In..." : "Login"}
                        onPress={() => login(email, password)}
                        disabled={isLoading}
                        style={styles.loginButton}
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.signupText}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
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
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.l,
    },
    headerContainer: {
        marginBottom: spacing.xl,
        alignItems: 'center',
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
        marginBottom: spacing.xl,
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
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.small,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.m,
        fontSize: 16,
        color: colors.text,
    },
    showHideButton: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.m,
        justifyContent: 'center',
    },
    showHideText: {
        color: colors.secondary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    loginButton: {
        marginTop: spacing.s,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.l,
    },
    footerText: {
        color: colors.textLight,
        fontSize: 15,
    },
    signupText: {
        color: colors.secondary,
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default LoginScreen;
