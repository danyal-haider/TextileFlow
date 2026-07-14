import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Platform } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import Card from '../components/Card';
import { colors, spacing, typography, shadows } from '../theme';

const OtherUserProfileScreen = ({ route, navigation }) => {
    const { user } = route.params;

    if (!user) {
        return (
            <ScreenWrapper>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>User profile details not found.</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    const avatarUri = user.profilePic || 'https://ui-avatars.com/api/?name=' + (user.name || 'User') + '&background=0F172A&color=fff&size=150';
    const isManufacturer = user.role === 'manufacturer';

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>User Profile</Text>
                </View>

                <Card style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                    </View>
                    <View style={styles.nameSection}>
                        <Text style={styles.name}>{user.name || 'User Name'}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: isManufacturer ? '#7C3AED15' : '#2563EB15' }]}>
                            <Text style={[styles.roleBadgeText, { color: isManufacturer ? '#7C3AED' : '#2563EB' }]}>
                                {user.role?.toUpperCase() || 'USER'}
                            </Text>
                        </View>
                    </View>
                </Card>

                <Card style={styles.detailsCard}>
                    <Text style={styles.cardHeaderTitle}>Contact & Business Details</Text>
                    <View style={styles.divider} />

                    <View style={styles.infoList}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoEmoji}>👤</Text>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Full Name</Text>
                                <Text style={styles.infoValue}>{user.name || 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoEmoji}>✉️</Text>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Email Address</Text>
                                <Text style={styles.infoValue}>{user.email || 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoEmoji}>🏢</Text>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Company Name</Text>
                                <Text style={styles.infoValue}>{user.companyName || 'Not Provided'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoEmoji}>📞</Text>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Phone Number</Text>
                                <Text style={styles.infoValue}>{user.phone || 'Not Provided'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoEmoji}>📍</Text>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Location (City, Country)</Text>
                                <Text style={styles.infoValue}>
                                    {user.city && user.country
                                        ? `${user.city}, ${user.country}`
                                        : user.city || user.country || 'Not Provided'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoEmoji}>🏠</Text>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Company Address</Text>
                                <Text style={styles.infoValue}>{user.address || 'Not Provided'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoEmoji}>ℹ️</Text>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>About Company</Text>
                                <Text style={styles.infoValue}>{user.about || 'No details provided yet.'}</Text>
                            </View>
                        </View>
                    </View>
                </Card>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: spacing.m,
        paddingBottom: spacing.xl,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    errorText: {
        fontSize: 16,
        color: colors.textLight,
        marginBottom: spacing.l,
    },
    backBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.s,
        borderRadius: 8,
    },
    backBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.m,
    },
    title: {
        ...typography.header,
        fontSize: 20,
        color: colors.primary,
    },
    profileCard: {
        alignItems: 'center',
        paddingVertical: spacing.l,
        marginBottom: spacing.m,
        borderRadius: 16,
    },
    avatarContainer: {
        marginBottom: spacing.s,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: colors.background,
    },
    nameSection: {
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    name: {
        ...typography.subheader,
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    roleBadge: {
        paddingHorizontal: spacing.m,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    detailsCard: {
        padding: spacing.m,
        marginBottom: spacing.m,
        borderRadius: 16,
    },
    cardHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.s,
    },
    infoList: {
        width: '100%',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.s,
    },
    infoEmoji: {
        fontSize: 20,
        marginRight: spacing.m,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        ...typography.caption,
        color: colors.textLight,
        fontSize: 11,
        marginBottom: 2,
    },
    infoValue: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
        fontSize: 14,
    },
    infoDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 4,
    },
});

export default OtherUserProfileScreen;
