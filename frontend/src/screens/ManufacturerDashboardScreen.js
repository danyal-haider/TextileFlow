import React, { useContext, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, shadows } from '../theme';
import { API_URL, resolveImageUri } from '../config';

const ManufacturerDashboardScreen = ({ navigation }) => {
    const { userInfo, userToken } = useContext(AuthContext);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            const count = response.data.filter(n => !n.read).length;
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching notifications count:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount();
        }, [])
    );

    const DashboardCard = ({ title, subtitle, onPress, accentColor }) => (
        <TouchableOpacity
            style={[localStyles.card, { borderLeftColor: accentColor }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={localStyles.cardContent}>
                <Text style={localStyles.cardTitle}>{title}</Text>
                <Text style={localStyles.cardSubtitle}>{subtitle}</Text>
            </View>
            <View style={[localStyles.iconPlaceholder, { backgroundColor: accentColor + '20' }]}>
                {/* Simulated Icon Circle */}
                <View style={[localStyles.dot, { backgroundColor: accentColor }]} />
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <ScrollView contentContainerStyle={localStyles.container}>
                <View style={localStyles.header}>
                    <View>
                        <Text style={localStyles.greeting}>Hello,</Text>
                        <Text style={localStyles.username}>{userInfo?.name || 'Manufacturer'}</Text>
                    </View>
                    <View style={localStyles.headerActions}>
                        {/* Bell Icon */}
                        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={localStyles.notificationBell}>
                            <Text style={localStyles.bellIcon}>🔔</Text>
                            {unreadCount > 0 && (
                                <View style={localStyles.badgeContainer}>
                                    <Text style={localStyles.badgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('ManufacturerProfile')}>
                            <Image
                                source={{ uri: resolveImageUri(userInfo?.profilePic) || 'https://ui-avatars.com/api/?name=' + (userInfo?.name || 'User') + '&background=0F172A&color=fff' }}
                                style={localStyles.avatar}
                            />
                        </TouchableOpacity>
                    </View>
                </View>



                <View style={localStyles.grid}>
                    <DashboardCard
                        title="Available Orders"
                        subtitle="Explore new opportunities"
                        accentColor="#2563EB" // Royal Blue
                        onPress={() => navigation.navigate('AvailableOrders')}
                    />
                    <DashboardCard
                        title="My Bids"
                        subtitle="Track your submissions"
                        accentColor="#D97706" // Amber
                        onPress={() => navigation.navigate('MyBids')}
                    />
                    <DashboardCard
                        title="My Orders"
                        subtitle="Manage active projects"
                        accentColor="#059669" // Emerald
                        onPress={() => navigation.navigate('MyOrders')}
                    />
                    <DashboardCard
                        title="Manage Machines"
                        subtitle="Add and update your equipment"
                        accentColor="#8B5CF6" // Purple
                        onPress={() => navigation.navigate('ManageMachines')}
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const localStyles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: spacing.m,
        paddingTop: spacing.s,
        paddingBottom: spacing.m,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    greeting: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    username: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notificationBell: {
        position: 'relative',
        padding: 6,
    },
    bellIcon: {
        fontSize: 22,
    },
    badgeContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.secondary,
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    grid: {
        gap: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        borderLeftWidth: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
    },
    iconPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
});

export default ManufacturerDashboardScreen;
